# G Fresh AI Checkout - Complete Cloud-Based Mobile App

A production-ready mobile application for AI-powered supermarket checkout. The app uses camera vision to scan products, extract text, match against a cloud database, and send PDF receipts via WhatsApp.

## Architecture Overview

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Flutter App    │────▶│  Cloud Backend   │────▶│  Firebase       │
│  (Mobile)       │     │  (FastAPI)       │     │  (Database)     │
└─────────────────┘     └──────────────────┘     └─────────────────┘
        │                       │                        │
        │                       ▼                        ▼
        │              ┌──────────────────┐     ┌─────────────────┐
        │              │  Google Vision   │     │  Twilio         │
        │              │  / Tesseract OCR │     │  (WhatsApp)     │
        │              └──────────────────┘     └─────────────────┘
        ▼
┌─────────────────┐
│  ML Kit Text    │
│  Recognition    │
└─────────────────┘
```

## Features

### Mobile App (Flutter)
- **Camera-based Product Scanning**: Real-time camera feed with AI scanning overlay
- **On-device OCR**: Google ML Kit for instant text recognition
- **Smart Product Matching**: Fuzzy matching algorithm with confidence scoring
- **Automatic Cart Management**: Auto-add products with high confidence matches
- **Manual Review Dialog**: For low-confidence detections
- **PDF Receipt Generation**: Professional invoice generation
- **WhatsApp Integration**: Send receipts directly to customer's WhatsApp

### Cloud Backend (FastAPI)
- **Product Database API**: RESTful API for product catalog management
- **AI Vision Processing**: Cloud-based OCR using Google Vision API + Tesseract fallback
- **Intelligent Product Matching**: Advanced fuzzy matching with keyword boosting
- **PDF Generation**: Server-side receipt generation using ReportLab
- **WhatsApp Integration**: Twilio API for sending PDF attachments
- **Invoice Management**: Store and retrieve invoice history
- **Firebase Integration**: Firestore for real-time database sync

## Project Structure

```
/workspace
├── g_fresh_ai_checkout/
│   └── flutter_app/           # Flutter mobile application
│       ├── lib/
│       │   ├── main.dart      # App entry point
│       │   ├── models/        # Data models (Product, CartItem)
│       │   ├── providers/     # State management (Riverpod)
│       │   ├── screens/       # UI screens
│       │   ├── services/      # Business logic services
│       │   ├── utils/         # AI extraction utilities
│       │   └── widgets/       # Reusable UI components
│       ├── assets/
│       │   └── data/
│       │       └── products.json  # Local product catalog
│       └── pubspec.yaml       # Dependencies
│
├── cloud_backend.py           # FastAPI cloud backend server
├── vision_ai_server.py        # Optional: YOLO + PaddleOCR server
└── README.md                  # This file
```

## Setup Instructions

### Prerequisites
- Flutter SDK (3.0+)
- Python 3.9+
- Firebase account
- Twilio account (for WhatsApp)
- Google Cloud account (optional, for Vision API)

### Mobile App Setup

1. **Navigate to Flutter app:**
```bash
cd g_fresh_ai_checkout/flutter_app
```

2. **Install dependencies:**
```bash
flutter pub get
```

3. **Configure Firebase:**
   - Create a Firebase project at https://console.firebase.google.com
   - Add Android/iOS apps to your Firebase project
   - Download `google-services.json` (Android) and `GoogleService-Info.plist` (iOS)
   - Place them in the appropriate directories

4. **Run the app:**
```bash
flutter run
```

### Cloud Backend Setup

1. **Install Python dependencies:**
```bash
pip install fastapi uvicorn reportlab twilio firebase-admin google-cloud-vision pytesseract pillow httpx
```

2. **Set environment variables:**
```bash
export FIREBASE_CREDENTIALS_PATH="path/to/serviceAccountKey.json"
export TWILIO_ACCOUNT_SID="your_twilio_sid"
export TWILIO_AUTH_TOKEN="your_twilio_token"
export TWILIO_WHATSAPP_NUMBER="+14155238886"
export GOOGLE_APPLICATION_CREDENTIALS="path/to/google_credentials.json"
```

3. **Run the backend server:**
```bash
python cloud_backend.py
```

The server will start on `http://0.0.0.0:8000`

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/api/products` | Get product catalog |
| POST | `/api/vision/detect` | AI product detection from image |
| POST | `/api/checkout` | Process checkout & send WhatsApp |
| GET | `/api/invoice/{id}` | Get invoice details |
| POST | `/api/invoice/{id}/resend` | Resend invoice to WhatsApp |

## How It Works

### 1. Product Scanning Flow

```
User opens camera → Real-time frame capture → ML Kit OCR → 
Text extraction → Fuzzy matching against catalog → 
Confidence check → Auto-add (>85%) or Manual review (<85%)
```

### 2. Checkout Flow

```
User clicks Checkout → Enter phone number → Generate PDF → 
Save to Firestore → Send WhatsApp with PDF attachment → 
Clear cart → Show success screen
```

### 3. AI Matching Algorithm

The app uses a multi-factor scoring system:
- **Brand match**: +0.3 points
- **Short name match**: +0.4 points
- **Full product name match**: +0.3 points
- **OCR keyword match**: +0.1 per keyword (max +0.4)
- **Quantity/variant match**: +0.2 points

**Thresholds:**
- ≥ 0.85: Auto-add to cart
- 0.35 - 0.85: Show review dialog
- < 0.35: Unknown product

## Configuration

### Firebase Firestore Structure

**Products Collection:**
```json
{
  "brand": "Nestle",
  "product_name": "Maggi 2-Minute Noodles Masala 70g",
  "short_name": "Maggi",
  "variant": "70g",
  "category": "Instant Noodles",
  "mrp": 20.0,
  "price": 18.0,
  "barcode": "8901058002341",
  "ocr_keywords": ["MAGGI", "2-MINUTE", "MASALA", "70g"]
}
```

**Invoices Collection:**
```json
{
  "invoice_id": "INV-20240115123456",
  "customer_phone": "9876543210",
  "customer_name": "John Doe",
  "store_id": "STORE_001",
  "items": [...],
  "subtotal": 100.0,
  "tax": 18.0,
  "total": 118.0,
  "created_at": "timestamp",
  "status": "completed"
}
```

### Twilio WhatsApp Setup

1. Sign up at https://www.twilio.com
2. Enable WhatsApp sandbox or production number
3. Get Account SID and Auth Token
4. Set environment variables

## Testing

### Test the Cloud Backend

```bash
# Health check
curl http://localhost:8000/health

# Get products
curl http://localhost:8000/api/products

# Test vision detection (base64 image)
curl -X POST http://localhost:8000/api/vision/detect \
  -H "Content-Type: application/json" \
  -d '{"image_base64": "iVBORw0KGgoAAAANS..."}'

# Test checkout
curl -X POST http://localhost:8000/api/checkout \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {"product_id": "P10023", "brand": "Nestle", "product_name": "Maggi", "variant": "70g", "price": 18.0, "quantity": 2}
    ],
    "customer_phone": "9876543210",
    "customer_name": "Test User"
  }'
```

## Deployment Options

### Option 1: Google Cloud Platform
- **Cloud Run** for backend container
- **Firestore** for database
- **Cloud Storage** for PDF storage
- **Cloud Vision API** for OCR

### Option 2: AWS
- **ECS/Fargate** for backend
- **DynamoDB** or **RDS** for database
- **S3** for PDF storage
- **Textract** for OCR

### Option 3: Heroku
- Deploy backend as web dyno
- Use Heroku Postgres addon
- Configure environment variables

## Security Considerations

1. **Authentication**: Implement JWT or Firebase Auth for API access
2. **Rate Limiting**: Add rate limiting to prevent abuse
3. **Input Validation**: Validate all user inputs
4. **HTTPS**: Always use HTTPS in production
5. **Environment Variables**: Never hardcode secrets
6. **CORS**: Configure proper CORS policies

## Troubleshooting

### Camera not working
- Check permissions in AndroidManifest.xml and Info.plist
- Ensure physical device has camera
- Test on real device (emulator camera support varies)

### OCR not detecting text
- Ensure good lighting conditions
- Hold camera steady
- Check if text is clear and readable
- Verify ML Kit is properly initialized

### WhatsApp not sending
- Verify Twilio credentials
- Check WhatsApp sandbox approval
- Ensure phone number format is correct (+91XXXXXXXXXX)

### Firebase connection issues
- Verify google-services.json is in correct location
- Check Firebase console for app configuration
- Ensure internet connectivity

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - See LICENSE file for details

## Support

For issues and questions, please open an issue on GitHub.

---

**Built with ❤️ using Flutter, FastAPI, and Firebase**
