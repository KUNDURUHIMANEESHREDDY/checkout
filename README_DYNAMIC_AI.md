# Dynamic AI Checkout System

This system dynamically detects product names from images using Cloud AI, rather than relying on hardcoded searches.

## Architecture

### 1. Mobile App (Flutter)
- Captures product images via camera
- Sends images to cloud backend
- Displays detected items and total
- Triggers WhatsApp receipt sending

### 2. Cloud Backend (FastAPI + AI)
**Dynamic Detection Pipeline:**
1. **Google Cloud Vision API**: Extracts ALL raw text from image (no hardcoded labels)
2. **LLM (Gemini/OpenAI)**: Analyzes raw text to intelligently identify:
   - Brand names
   - Product names  
   - Quantities
3. **Fuzzy Matching**: Maps AI-extracted data to product database prices
4. **PDF Generation**: Creates receipt server-side
5. **WhatsApp Integration**: Sends PDF via Twilio

## Setup Instructions

### Backend Setup
```bash
pip install fastapi uvicorn python-multipart httpx fitz pymupdf pillow
export GOOGLE_CLOUD_VISION_API_KEY="your_key"
export LLM_API_KEY="your_gemini_or_openai_key"
python cloud_backend_dynamic.py
```

### Mobile App Setup
```bash
cd g_fresh_ai_checkout
flutter pub get
# Update BACKEND_URL in lib/main_dynamic.dart
flutter run
```

## How It Works

**Example Flow:**
1. User points camera at "Lay's Chips" packet
2. Cloud Vision extracts text: "Lay's Potato Chips Classic Salted 50g"
3. LLM analyzes: `{brand: "Lay's", name: "Chips", quantity: 1}`
4. System matches to DB entry for Lay's Chips ($20.00)
5. Item added to cart, total updated
6. On checkout, PDF generated and sent to WhatsApp

## Key Features
- ✅ **No Hardcoded Product Names**: AI understands any brand/product
- ✅ **Quantity Detection**: Reads "Pack of 2", "500g", etc.
- ✅ **Cloud-Only Processing**: Mobile app is just a camera interface
- ✅ **Scalable**: Add new products to DB without updating app
- ✅ **Multi-language Support**: LLM can handle various languages

## Environment Variables Required
- `GOOGLE_CLOUD_VISION_API_KEY`: For OCR
- `LLM_API_KEY`: For intelligent text interpretation
- `TWILIO_SID` & `TWILIO_TOKEN`: For WhatsApp messaging