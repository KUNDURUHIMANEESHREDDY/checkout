# G Fresh AI Checkout - Local Mobile Setup

This version of the app runs **completely locally on the mobile device** without requiring any cloud backend or internet connection.

## Key Features

✅ **100% Offline** - No cloud backend required
✅ **Local OCR** - Uses Google ML Kit for on-device text recognition
✅ **Local AI Processing** - Product matching happens on the device
✅ **Local PDF Generation** - Receipts are generated and saved on the device
✅ **Fast & Responsive** - No network latency
✅ **Privacy-Friendly** - All data stays on your device

## How It Works

1. **Camera Capture** - User points camera at product labels
2. **Local OCR** - Google ML Kit extracts text from the image
3. **AI Matching** - Local algorithm matches extracted text against product catalog
4. **Cart Management** - Items are added to local cart
5. **Local Receipt** - PDF receipt is generated and saved to device storage

## Setup Instructions

### 1. Flutter Setup

Make sure you have Flutter installed:
```bash
flutter doctor
```

### 2. Add Required Dependencies

The app uses these key packages (already in `pubspec.yaml`):
- `camera` - For camera access
- `google_mlkit_text_recognition` - For on-device OCR
- `pdf` - For PDF generation
- `path_provider` - For file system access
- `open_file` - For opening generated receipts

Run:
```bash
cd g_fresh_ai_checkout/flutter_app
flutter pub get
```

### 3. Android Setup

Add these permissions to `android/app/src/main/AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.CAMERA"/>
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE"/>
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE"/>
```

### 4. iOS Setup

Add these to `ios/Runner/Info.plist`:

```xml
<key>NSCameraUsageDescription</key>
<string>We need camera access to scan product labels</string>
<key>NSPhotoLibraryUsageDescription</key>
<string>We need photo library access to save receipts</string>
```

### 5. Run the App

```bash
flutter run
```

## Product Catalog

Products are loaded from `assets/data/products.json`. You can edit this file to add more products.

### Adding New Products

Add entries to `products.json` with this format:

```json
{
  "id": "UNIQUE_ID",
  "brand": "Brand Name",
  "product_name": "Full Product Name",
  "short_name": "Short Display Name",
  "variant": "Size/Variant",
  "category": "Product Category",
  "mrp": 20.0,
  "price": 18.0,
  "barcode": "UPC/EAN Code",
  "ocr_keywords": ["KEYWORD1", "KEYWORD2", "KEYWORD3"]
}
```

**OCR Keywords** are used for matching. Include brand names, product names, and common abbreviations.

## Usage

### Scanning Products

1. Point your camera at a product label
2. Tap the camera button to capture
3. The app will:
   - Extract text using Google ML Kit OCR
   - Match against the local product catalog
   - Display the matched product
   - Add it to your cart

### Viewing Cart

- The cart total is displayed in the top-right corner
- Tap "Confirm & Generate Receipt" to create a PDF

### Saving Receipts

- Receipts are saved as PDF files in the app's documents directory
- You can open them directly from the app
- Files are named: `receipt_INV-YYYYMMDD-HHMMSS.pdf`

## Troubleshooting

### OCR Not Working

1. Make sure the text is clear and well-lit
2. Hold the camera steady
3. Ensure the product label is facing the camera
4. Try moving closer or farther away

### Products Not Matching

1. Check that the product is in `products.json`
2. Add more OCR keywords to help matching
3. Make sure the keywords match what's on the label

### Camera Not Working

1. Check camera permissions in app settings
2. Restart the app
3. Make sure no other app is using the camera

## Performance Tips

- **Lighting**: Good lighting improves OCR accuracy
- **Distance**: Hold the camera 15-30cm from the product
- **Angle**: Keep the camera parallel to the label
- **Focus**: Make sure the text is in focus

## Customization

### Changing Confidence Threshold

In `scan_provider.dart`, adjust the confidence threshold:
```dart
if (result.confidenceScore >= 0.60 && result.matchedProduct != null) {
```

Lower values = more matches but potentially less accurate
Higher values = fewer matches but more accurate

### Adding More Products

Edit `assets/data/products.json` and add your products. Make sure to include good OCR keywords.

## Architecture

```
Mobile App (Flutter)
├── Camera Capture
├── Google ML Kit OCR (Local)
├── AI Extractor (Local)
│   ├── Text Extraction
│   ├── Product Matching
│   └── Confidence Scoring
├── Product Service (Local)
│   └── Local JSON Catalog
├── Cart Management (Local)
└── PDF Generation (Local)
```

## Comparison: Cloud vs Local

| Feature | Cloud Version | Local Version |
|---------|--------------|---------------|
| Internet Required | ✅ Yes | ❌ No |
| OCR Processing | Cloud Vision API | Google ML Kit |
| Product Matching | Cloud LLM | Local Algorithm |
| PDF Generation | Server-side | Device-side |
| WhatsApp Integration | ✅ Yes | ❌ No |
| Speed | Network dependent | Instant |
| Privacy | Data sent to cloud | All local |
| Cost | API costs | Free |

## Future Enhancements

- [ ] Add local database (Hive/SQLite) for persistent cart
- [ ] Add barcode scanning support
- [ ] Add voice feedback for accessibility
- [ ] Add multi-language OCR support
- [ ] Add product image recognition
- [ ] Add offline WhatsApp sharing (when online)

## Support

For issues or questions, check:
1. This README file
2. The troubleshooting section above
3. Flutter documentation for camera/ML Kit setup

---

**Built with Flutter & Google ML Kit**  
**100% Local. 100% Private. 100% Offline.**
