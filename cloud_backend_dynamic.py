import os
import io
import json
import base64
import fitz  # PyMuPDF for PDF generation
from fastapi import FastAPI, UploadFile, File, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import httpx
from datetime import datetime

# --- Configuration ---
# In production, load these from Environment Variables
GOOGLE_CLOUD_VISION_API_KEY = os.getenv("GOOGLE_CLOUD_VISION_API_KEY", "YOUR_VISION_KEY")
LLM_API_KEY = os.getenv("LLM_API_KEY", "YOUR_GEMINI_OR_OPENAI_KEY") # Using Gemini for Google Cloud synergy
TWILIO_SID = os.getenv("TWILIO_SID")
TWILIO_TOKEN = os.getenv("TWILIO_TOKEN")
TWILIO_WHATSAPP_NUMBER = "whatsapp:+14155238886"

app = FastAPI(title="Dynamic AI Checkout System")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Mock Database (In real app, use Firestore/DynamoDB) ---
# The AI will map dynamic text to these categories
PRODUCT_DB = [
    {"id": "1", "brand": "Lay's", "name": "Potato Chips Classic", "price": 20.0, "keywords": ["lays", "chips", "potato", "classic"]},
    {"id": "2", "brand": "Coca-Cola", "name": "Soft Drink 750ml", "price": 40.0, "keywords": ["coke", "coca cola", "soft drink", "750ml"]},
    {"id": "3", "brand": "Amul", "name": "Butter 100g", "price": 60.0, "keywords": ["amul", "butter", "dairy", "100g"]},
    {"id": "4", "brand": "Tata Salt", "name": "Iodized Salt 1kg", "price": 25.0, "keywords": ["tata", "salt", "iodized", "1kg"]},
    {"id": "5", "brand": "Britannia", "name": "Good Day Biscuits", "price": 30.0, "keywords": ["britannia", "biscuit", "good day", "cookies"]},
]

# --- Data Models ---
class CartItem(BaseModel):
    product_id: str
    brand: str
    name: str
    quantity: int
    price: float
    detected_text: str

class CheckoutResponse(BaseModel):
    items: List[CartItem]
    total: float
    pdf_url: Optional[str] = None

# --- AI Services ---

async def extract_text_with_vision(image_bytes: bytes) -> str:
    """
    Sends image to Google Cloud Vision API to get raw text dynamically.
    No hardcoded labels here.
    """
    url = f"https://vision.googleapis.com/v1/images:annotate?key={GOOGLE_CLOUD_VISION_API_KEY}"
    
    payload = {
        "requests": [{
            "image": {"content": base64.b64encode(image_bytes).decode('UTF-8')},
            "features": [{"type": "TEXT_DETECTION"}]
        }]
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.post(url, json=payload)
        if response.status_code != 200:
            raise HTTPException(status_code=500, detail="Vision API Failed")
        
        data = response.json()
        try:
            full_text = data['responses'][0]['fullTextAnnotation']['text']
            return full_text
        except (KeyError, IndexError):
            return ""

async def interpret_text_with_llm(raw_text: str) -> List[Dict[str, Any]]:
    """
    Sends raw OCR text to an LLM (Gemini/OpenAI) to dynamically identify:
    - Brand
    - Product Name
    - Quantity
    The LLM returns structured JSON based on understanding, not string matching.
    """
    if not raw_text.strip():
        return []

    prompt = f"""
    You are a supermarket checkout assistant. 
    Analyze the following text extracted from a product image:
    "{raw_text}"
    
    Identify distinct products. For each product, extract:
    1. brand (e.g., "Lay's", "Coke")
    2. name (e.g., "Chips", "Cola")
    3. quantity (integer, default to 1 if not specified)
    
    Return ONLY a valid JSON list of objects. Example:
    [{{"brand": "Lay's", "name": "Chips", "quantity": 2}}]
    
    If no product is found, return an empty list [].
    """

    # Using Google Gemini API (adjust for OpenAI if preferred)
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key={LLM_API_KEY}"
    
    payload = {
        "contents": [{
            "parts": [{"text": prompt}]
        }]
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.post(url, json=payload, timeout=30.0)
        if response.status_code != 200:
            print(f"LLM Error: {response.text}")
            return []
        
        try:
            data = response.json()
            llm_text = data['candidates'][0]['content']['parts'][0]['text']
            # Clean markdown code blocks if present
            llm_text = llm_text.replace("```json", "").replace("```", "").strip()
            parsed_data = json.loads(llm_text)
            return parsed_data
        except Exception as e:
            print(f"Parsing error: {e}")
            return []

def match_product_to_db(ai_detected_item: Dict) -> Optional[Dict]:
    """
    Fuzzy matches the AI-detected brand/name against our DB.
    Since the AI normalizes the input, simple keyword inclusion works better now.
    """
    ai_brand = ai_detected_item.get('brand', '').lower()
    ai_name = ai_detected_item.get('name', '').lower()
    ai_qty = ai_detected_item.get('quantity', 1)
    
    best_match = None
    highest_score = 0
    
    for db_item in PRODUCT_DB:
        score = 0
        db_keywords = " ".join(db_item['keywords']).lower()
        
        # Check brand overlap
        if ai_brand and ai_brand in db_keywords:
            score += 2
        
        # Check name overlap
        if ai_name and ai_name in db_keywords:
            score += 2
            
        # Partial matches
        if ai_brand in db_item['brand'].lower(): score += 1
        if ai_name in db_item['name'].lower(): score += 1
        
        if score > highest_score:
            highest_score = score
            best_match = db_item
    
    if best_match and highest_score > 0:
        return {
            "product_id": best_match['id'],
            "brand": best_match['brand'],
            "name": best_match['name'],
            "price": best_match['price'],
            "quantity": ai_qty,
            "detected_text": f"{ai_detected_item.get('brand')} {ai_detected_item.get('name')}"
        }
    return None

async def generate_pdf(items: List[CartItem], total: float) -> bytes:
    doc = fitz.open()
    page = doc.new_page()
    
    y = 50
    page.insert_text((50, y), "G-Fresh Mart Receipt", fontsize=16, fontname="helv")
    y += 30
    page.insert_text((50, y), f"Date: {datetime.now().strftime('%Y-%m-%d %H:%M')}", fontsize=10)
    y += 30
    
    page.insert_text((50, y), "Items:", fontsize=12, fontname="helvb")
    y += 20
    
    for item in items:
        line = f"{item.brand} {item.name} x{item.quantity} - ${item.price * item.quantity:.2f}"
        page.insert_text((50, y), line, fontsize=10)
        y += 15
    
    y += 20
    page.insert_text((50, y), f"TOTAL: ${total:.2f}", fontsize=14, fontname="helvb")
    
    return doc.save(output=io.BytesIO())

# --- Endpoints ---

@app.post("/scan-and-detect")
async def scan_and_detect(file: UploadFile = File(...)):
    """
    1. Receives Image
    2. Cloud Vision extracts raw text (Dynamic)
    3. LLM interprets text to find Brand/Name/Qty (Dynamic)
    4. Matches to DB
    """
    contents = await file.read()
    
    # Step 1: Dynamic OCR
    raw_text = await extract_text_with_vision(contents)
    if not raw_text:
        raise HTTPException(status_code=400, detail="No text detected in image")
    
    # Step 2: Dynamic AI Interpretation
    ai_products = await interpret_text_with_llm(raw_text)
    
    if not ai_products:
        raise HTTPException(status_code=404, detail="Could not identify any known products dynamically")
    
    # Step 3: Match to DB
    matched_items = []
    for ai_item in ai_products:
        matched = match_product_to_db(ai_item)
        if matched:
            matched_items.append(CartItem(**matched))
    
    if not matched_items:
        raise HTTPException(status_code=404, detail="Products detected but not found in database")
    
    return {"items": matched_items, "raw_ocr": raw_text[:100] + "..."}

@app.post("/checkout")
async def checkout(items: List[CartItem], whatsapp_number: str):
    total = sum(item.price * item.quantity for item in items)
    
    # Generate PDF
    pdf_bytes = await generate_pdf(items, total)
    
    # TODO: Send to WhatsApp via Twilio
    # client.messages.create(from_=TWILIO_WHATSAPP_NUMBER, body="Receipt attached", media_url=[...], to=whatsapp_number)
    
    return {
        "message": "Checkout successful",
        "total": total,
        "items_count": len(items),
        "whatsapp_sent_to": whatsapp_number
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)