"""
G Fresh Cloud Backend - Complete Cloud-Based Mobile App Backend
Features:
- Product Database API
- AI Vision Processing (OCR + Product Matching)
- PDF Receipt Generation
- WhatsApp Integration (PDF attachment support)
- User Authentication
- Order History
"""

import os
import io
import base64
import json
from datetime import datetime
from typing import List, Optional, Dict, Any
from fastapi import FastAPI, HTTPException, UploadFile, File, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib import colors
from twilio.rest import Client
import httpx
import firebase_admin
from firebase_admin import credentials, firestore

# ============================================================================
# CONFIGURATION
# ============================================================================

app = FastAPI(
    title="G Fresh Cloud Backend",
    description="Cloud backend for AI-powered mobile checkout app",
    version="1.0.0"
)

# Enable CORS for mobile app
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Firebase Admin SDK
try:
    cred_path = os.getenv("FIREBASE_CREDENTIALS_PATH", "serviceAccountKey.json")
    if os.path.exists(cred_path):
        cred = credentials.Certificate(cred_path)
        firebase_admin.initialize_app(cred)
        db = firestore.client()
        print("✅ Firebase Admin initialized")
    else:
        db = None
        print("⚠️ Firebase credentials not found - running in mock mode")
except Exception as e:
    db = None
    print(f"⚠️ Firebase initialization error: {e}")

# Twilio WhatsApp Configuration
TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID", "")
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN", "")
TWILIO_WHATSAPP_NUMBER = os.getenv("TWILIO_WHATSAPP_NUMBER", "")
twilio_client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN) if TWILIO_ACCOUNT_SID else None

# Mock Product Catalog (fallback)
MOCK_PRODUCTS = [
    {"id": "P10023", "brand": "Nestle", "product_name": "Maggi 2-Minute Noodles Masala 70g", "short_name": "Maggi", "variant": "70g", "category": "Instant Noodles", "mrp": 20.0, "price": 18.0, "barcode": "8901058002341", "ocr_keywords": ["MAGGI", "2-MINUTE", "MASALA", "70g"]},
    {"id": "P20412", "brand": "The Coca-Cola Company", "product_name": "Coke Original Taste 750ml", "short_name": "Coke", "variant": "750ml", "category": "Beverages", "mrp": 45.0, "price": 40.0, "barcode": "5449000000996", "ocr_keywords": ["COCA-COLA", "COKE", "750ml"]},
    {"id": "P30991", "brand": "Amul", "product_name": "Pasteurised Taaza Milk 1L", "short_name": "Milk", "variant": "1L", "category": "Dairy", "mrp": 66.0, "price": 64.0, "barcode": "8901262010112", "ocr_keywords": ["AMUL", "TAAZA", "MILK", "1L"]},
    {"id": "P40115", "brand": "Frito-Lay", "product_name": "Lays Classic Salted Chips 52g", "short_name": "Lays Chips", "variant": "52g", "category": "Snacks", "mrp": 20.0, "price": 18.0, "barcode": "8901491102030", "ocr_keywords": ["LAYS", "CLASSIC", "52g"]},
    {"id": "P50882", "brand": "Nestle", "product_name": "Nescafe Classic Instant Coffee 100g", "short_name": "Nescafe Coffee", "variant": "100g", "category": "Pantry", "mrp": 350.0, "price": 320.0, "barcode": "7613035123456", "ocr_keywords": ["NESCAFE", "CLASSIC", "100g"]},
]

# ============================================================================
# DATA MODELS
# ============================================================================

class CartItem(BaseModel):
    product_id: str
    brand: str
    product_name: str
    variant: str
    price: float
    quantity: int = 1

class CheckoutRequest(BaseModel):
    items: List[CartItem]
    customer_phone: str
    customer_name: Optional[str] = None
    store_id: Optional[str] = "STORE_001"

class VisionRequest(BaseModel):
    image_base64: str

class VisionResponse(BaseModel):
    success: bool
    detected_products: List[Dict[str, Any]]
    raw_text: str
    confidence: float

class ProductMatch(BaseModel):
    product_id: str
    brand: str
    product_name: str
    variant: str
    price: float
    confidence: float

# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def extract_text_from_image(image_data: bytes) -> str:
    """Extract text from image using Google Cloud Vision API or fallback OCR"""
    try:
        # Try Google Cloud Vision API first
        from google.cloud import vision
        client = vision.ImageAnnotatorClient()
        image = vision.Image(content=image_data)
        response = client.text_detection(image=image)
        texts = response.text_annotations
        if texts:
            return texts[0].description
    except Exception as e:
        print(f"Google Vision error: {e}")
    
    # Fallback to Tesseract OCR
    try:
        import pytesseract
        from PIL import Image
        img = Image.open(io.BytesIO(image_data))
        text = pytesseract.image_to_string(img)
        return text
    except Exception as e:
        print(f"Tesseract error: {e}")
        return ""

def match_products_from_text(text: str, products: List[Dict]) -> List[ProductMatch]:
    """Match extracted text against product catalog using fuzzy matching"""
    import re
    from difflib import SequenceMatcher
    
    text_upper = text.upper()
    matches = []
    
    # Extract quantity pattern
    quantity_pattern = r'(\d+)\s*(g|kg|ml|l|gm)'
    quantity_match = re.search(quantity_pattern, text_upper, re.IGNORECASE)
    detected_quantity = quantity_match.group(0) if quantity_match else ""
    
    for product in products:
        score = 0.0
        matched_keywords = []
        
        # Check brand match
        brand = product.get('brand', '').upper()
        if brand in text_upper:
            score += 0.3
            matched_keywords.append('brand')
        
        # Check product name match
        product_name = product.get('product_name', '').upper()
        short_name = product.get('short_name', '').upper()
        
        if short_name in text_upper:
            score += 0.4
            matched_keywords.append('short_name')
        elif product_name in text_upper:
            score += 0.3
            matched_keywords.append('product_name')
        
        # Check OCR keywords
        for keyword in product.get('ocr_keywords', []):
            if keyword.upper() in text_upper:
                score += 0.1
                matched_keywords.append(keyword)
        
        # Check variant/quantity match
        variant = product.get('variant', '').upper()
        if variant and detected_quantity:
            if variant.upper() in text_upper or detected_quantity in variant:
                score += 0.2
        
        # Normalize score
        score = min(score, 1.0)
        
        if score > 0.3:  # Threshold for match
            matches.append(ProductMatch(
                product_id=product['id'],
                brand=product['brand'],
                product_name=product['product_name'],
                variant=product['variant'],
                price=product['price'],
                confidence=score
            ))
    
    # Sort by confidence
    matches.sort(key=lambda x: x.confidence, reverse=True)
    return matches

def generate_pdf_receipt(items: List[CartItem], total: float, tax_rate: float = 0.18) -> bytes:
    """Generate PDF receipt using ReportLab"""
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=0.5*inch, leftMargin=0.5*inch, topMargin=0.5*inch, bottomMargin=0.5*inch)
    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=18,
        textColor=colors.HexColor('#10B981'),
        spaceAfter=12,
        alignment=1  # Center
    )
    
    elements = []
    
    # Header
    elements.append(Paragraph("G FRESH SUPERMARKET", title_style))
    elements.append(Paragraph("AI-Powered Smart Checkout", styles['Normal']))
    elements.append(Spacer(1, 0.2*inch))
    
    # Invoice details
    now = datetime.now()
    invoice_id = f"INV-{now.strftime('%Y%m%d%H%M%S')}"
    elements.append(Paragraph(f"<b>Invoice:</b> {invoice_id}", styles['Normal']))
    elements.append(Paragraph(f"<b>Date:</b> {now.strftime('%d %B %Y, %I:%M %p')}", styles['Normal']))
    elements.append(Spacer(1, 0.2*inch))
    
    # Items table
    table_data = [['Item', 'Qty', 'Price', 'Total']]
    
    for item in items:
        item_total = item.price * item.quantity
        table_data.append([
            f"{item.product_name}\n({item.brand} - {item.variant})",
            str(item.quantity),
            f"₹{item.price:.2f}",
            f"₹{item_total:.2f}"
        ])
    
    # Add subtotal
    subtotal = sum(item.price * item.quantity for item in items)
    tax = subtotal * tax_rate
    grand_total = subtotal + tax
    
    table_data.append(['', '', 'Subtotal:', f"₹{subtotal:.2f}"])
    table_data.append(['', '', f'Tax ({tax_rate*100:.0f}%):', f"₹{tax:.2f}"])
    table_data.append(['', '', '<b>TOTAL:</b>', f"<b>₹{grand_total:.2f}</b>"])
    
    table = Table(table_data, colWidths=[3*inch, 0.5*inch, 1*inch, 1*inch])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#10B981')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 12),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('ROWBACKGROUNDS', (0, 1), (-1, -2), [colors.white, colors.HexColor('#F0FDF4')]),
        ('FONTNAME', (0, -4), (-1, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, -4), (-1, -1), 11),
    ]))
    
    elements.append(table)
    elements.append(Spacer(1, 0.3*inch))
    
    # Footer
    elements.append(Paragraph("<i>Thank you for shopping with G Fresh!</i>", styles['Normal']))
    elements.append(Paragraph("<font size='8' color='grey'>Eco-friendly Digital Receipt</font>", styles['Normal']))
    
    doc.build(elements)
    pdf_bytes = buffer.getvalue()
    buffer.close()
    return pdf_bytes

async def send_whatsapp_with_pdf(phone_number: str, pdf_bytes: bytes, invoice_id: str, total: float):
    """Send WhatsApp message with PDF attachment using Twilio"""
    if not twilio_client:
        print("Twilio not configured - skipping WhatsApp send")
        return False
    
    try:
        # Save PDF to temporary file
        temp_pdf_path = f"/tmp/receipt_{invoice_id}.pdf"
        with open(temp_pdf_path, 'wb') as f:
            f.write(pdf_bytes)
        
        # Send WhatsApp message with media
        message = twilio_client.messages.create(
            from_=f'whatsapp:{TWILIO_WHATSAPP_NUMBER}',
            body=f"Thank you for shopping at G Fresh!\n\nYour total bill is ₹{total:.2f}\nInvoice: {invoice_id}",
            media_url=[f'file://{temp_pdf_path}'],
            to=f'whatsapp:+91{phone_number}'
        )
        
        # Clean up temp file
        os.remove(temp_pdf_path)
        
        print(f"WhatsApp sent: {message.sid}")
        return True
    except Exception as e:
        print(f"WhatsApp send error: {e}")
        return False

# ============================================================================
# API ENDPOINTS
# ============================================================================

@app.get("/")
def root():
    return {"status": "online", "service": "G Fresh Cloud Backend", "version": "1.0.0"}

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "firebase": "connected" if db else "disconnected",
        "twilio": "configured" if twilio_client else "not configured"
    }

@app.get("/api/products")
async def get_products():
    """Get all products from database"""
    if db:
        try:
            products_ref = db.collection('products')
            docs = products_ref.stream()
            products = []
            for doc in docs:
                product = doc.to_dict()
                product['id'] = doc.id
                products.append(product)
            return {"success": True, "products": products}
        except Exception as e:
            print(f"Firestore error: {e}")
    
    # Fallback to mock data
    return {"success": True, "products": MOCK_PRODUCTS}

@app.post("/api/vision/detect", response_model=VisionResponse)
async def detect_products(request: VisionRequest):
    """Process image and detect products using AI"""
    try:
        # Decode base64 image
        image_data = base64.b64decode(request.image_base64)
        
        # Extract text from image
        extracted_text = extract_text_from_image(image_data)
        
        # Get products from database
        if db:
            products_ref = db.collection('products')
            docs = products_ref.stream()
            products = [doc.to_dict() for doc in docs]
        else:
            products = MOCK_PRODUCTS
        
        # Match products from extracted text
        matches = match_products_from_text(extracted_text, products)
        
        detected = []
        for match in matches:
            detected.append({
                "product_id": match.product_id,
                "brand": match.brand,
                "product_name": match.product_name,
                "variant": match.variant,
                "price": match.price,
                "confidence": match.confidence
            })
        
        return VisionResponse(
            success=True,
            detected_products=detected,
            raw_text=extracted_text,
            confidence=max([m.confidence for m in matches]) if matches else 0.0
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/checkout")
async def process_checkout(request: CheckoutRequest, background_tasks: BackgroundTasks):
    """Process checkout, generate PDF, and send via WhatsApp"""
    try:
        # Calculate totals
        subtotal = sum(item.price * item.quantity for item in request.items)
        tax = subtotal * 0.18
        total = subtotal + tax
        
        # Generate PDF receipt
        pdf_bytes = generate_pdf_receipt(request.items, total)
        
        # Create invoice record
        invoice_id = f"INV-{datetime.now().strftime('%Y%m%d%H%M%S')}"
        invoice_data = {
            "invoice_id": invoice_id,
            "customer_phone": request.customer_phone,
            "customer_name": request.customer_name,
            "store_id": request.store_id,
            "items": [item.dict() for item in request.items],
            "subtotal": subtotal,
            "tax": tax,
            "total": total,
            "created_at": datetime.utcnow(),
            "status": "completed"
        }
        
        # Save to Firestore
        if db:
            db.collection('invoices').document(invoice_id).set(invoice_data)
        
        # Send WhatsApp with PDF (async)
        background_tasks.add_task(
            send_whatsapp_with_pdf,
            request.customer_phone,
            pdf_bytes,
            invoice_id,
            total
        )
        
        return {
            "success": True,
            "invoice_id": invoice_id,
            "total": total,
            "message": "Checkout successful! Receipt sent to WhatsApp."
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/invoice/{invoice_id}/resend")
async def resend_invoice(invoice_id: str, phone_number: str, background_tasks: BackgroundTasks):
    """Resend invoice PDF to WhatsApp number"""
    try:
        # Fetch invoice from database
        if not db:
            raise HTTPException(status_code=400, detail="Database not configured")
        
        invoice_ref = db.collection('invoices').document(invoice_id)
        invoice_doc = invoice_ref.get()
        
        if not invoice_doc.exists:
            raise HTTPException(status_code=404, detail="Invoice not found")
        
        invoice_data = invoice_doc.to_dict()
        
        # Recreate cart items
        items = [CartItem(**item) for item in invoice_data['items']]
        
        # Regenerate PDF
        pdf_bytes = generate_pdf_receipt(items, invoice_data['total'])
        
        # Send WhatsApp
        background_tasks.add_task(
            send_whatsapp_with_pdf,
            phone_number,
            pdf_bytes,
            invoice_id,
            invoice_data['total']
        )
        
        return {"success": True, "message": "Invoice resent to WhatsApp"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/invoice/{invoice_id}")
async def get_invoice(invoice_id: str):
    """Get invoice details"""
    if not db:
        raise HTTPException(status_code=400, detail="Database not configured")
    
    invoice_ref = db.collection('invoices').document(invoice_id)
    invoice_doc = invoice_ref.get()
    
    if not invoice_doc.exists:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    return {"success": True, "invoice": invoice_doc.to_dict()}

# ============================================================================
# MAIN
# ============================================================================

if __name__ == "__main__":
    print("=" * 70)
    print("           G FRESH CLOUD BACKEND SERVER                    ")
    print("           Running on http://0.0.0.0:8000                  ")
    print("=" * 70)
    print("\nEndpoints:")
    print("  GET  /health              - Health check")
    print("  GET  /api/products        - Get product catalog")
    print("  POST /api/vision/detect   - AI product detection")
    print("  POST /api/checkout        - Process checkout & send WhatsApp")
    print("  GET  /api/invoice/{id}    - Get invoice details")
    print("  POST /api/invoice/{id}/resend - Resend invoice to WhatsApp")
    print("\n" + "=" * 70)
    
    uvicorn.run(app, host="0.0.0.0", port=8000)
