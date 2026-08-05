// Product types
export interface Product {
  id: string;
  brand: string;
  product_name: string;
  short_name: string;
  variant: string;
  category: string;
  mrp: number;
  price: number;
  barcode: string;
  ocr_keywords: string[];
}

// OCR extraction types
export interface ExtractedProductInfo {
  brand: string;
  productName: string;
  quantity: string;
}

export interface AIExtractionResult {
  matchedProduct: Product | null;
  confidenceScore: number;
  rawOcrInfo: ExtractedProductInfo;
}

// Cart types
export interface CartItem extends Product {
  quantity: number;
}

// Receipt types
export interface ReceiptItem {
  product: Product;
  quantity: number;
  total: number;
}

export interface ReceiptData {
  invoiceId: string;
  date: string;
  items: ReceiptItem[];
  subtotal: number;
  tax: number;
  total: number;
  customerName: string;
  customerPhone: string;
}
