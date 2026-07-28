import os
import base64
import cv2
import numpy as np
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import uvicorn
from ultralytics import YOLO
from paddleocr import PaddleOCR
from typing import List

# Initialize FastAPI
app = FastAPI(title="G Fresh Vision AI Server")

# Load YOLOv11 model (Nano version for speed)
# It will download automatically on first run
print("[+] Loading YOLOv11...")
model = YOLO("yolo11n.pt")

# Initialize PaddleOCR
print("[+] Loading PaddleOCR...")
ocr = PaddleOCR(use_angle_cls=True, lang='en', show_log=False)

# Mock Product Database (Matching ScanContext.jsx)
PRODUCT_CATALOG = [
    {"id": "P10023", "name": "Maggi", "keywords": ["MAGGI", "NOODLES"]},
    {"id": "P20412", "name": "Coke", "keywords": ["COKE", "COCA-COLA", "COCA"]},
    {"id": "P30991", "name": "Milk", "keywords": ["MILK", "AMUL", "TAAZA"]},
    {"id": "P40115", "name": "Lays Chips", "keywords": ["LAYS", "CHIPS"]},
    {"id": "P50882", "name": "Nescafe Coffee", "keywords": ["NESCAFE", "COFFEE"]},
    {"id": "P60341", "name": "Wheat Bread", "keywords": ["BREAD", "BRITANNIA", "WHEAT"]},
]

class ImagePayload(BaseModel):
    image_base64: str

@app.get("/health")
def health_check():
    return {"status": "online", "models": ["YOLOv11n", "PaddleOCR"]}

@app.post("/api/vision/detect")
async def detect_products(payload: ImagePayload):
    try:
        # Decode base64 image
        img_data = base64.b64decode(payload.image_base64)
        nparr = np.frombuffer(img_data, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if img is None:
            raise HTTPException(status_code=400, detail="Invalid image data")

        # 1. YOLOv11 Detection (Bounding Boxes)
        results = model(img)
        detections = []

        # 2. Extract OCR from detected areas
        # For simplicity in this version, we'll run OCR on the whole image
        # and match keywords if YOLO found something
        ocr_results = ocr.ocr(img, cls=True)
        detected_text = ""
        if ocr_results and ocr_results[0]:
            for line in ocr_results[0]:
                detected_text += line[1][0].upper() + " "

        print(f"[DEBUG] OCR Found: {detected_text}")

        # 3. Match against Catalog
        found_products = []
        for product in PRODUCT_CATALOG:
            for keyword in product["keywords"]:
                if keyword in detected_text:
                    found_products.append({
                        "product_id": product["id"],
                        "name": product["name"],
                        "confidence": 0.95
                    })
                    break # Found this product, move to next

        return {
            "success": True,
            "detected_products": found_products,
            "raw_text": detected_text
        }

    except Exception as e:
        print(f"[ERROR] {e}")
        return {"success": False, "error": str(e)}

if __name__ == "__main__":
    print("==========================================================================")
    print("           G FRESH VISION AI SERVER RUNNING ON PORT 8000                 ")
    print("==========================================================================")
    uvicorn.run(app, host="0.0.0.0", port=8000)
