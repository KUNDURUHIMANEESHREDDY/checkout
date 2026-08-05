/**
 * Unit tests for AI Extractor
 * 
 * Tests the product matching algorithm
 */

import AIExtractor from '../utils/aiExtractor';
import { Product } from '../types';

// Mock product catalog
const mockProducts: Product[] = [
  {
    id: 'P10023',
    brand: 'Nestle',
    product_name: 'Maggi 2-Minute Noodles Masala 70g',
    short_name: 'Maggi',
    variant: '70g',
    category: 'Instant Noodles',
    mrp: 20.0,
    price: 18.0,
    barcode: '8901058002341',
    ocr_keywords: ['MAGGI', '2-MINUTE', 'MASALA', '70g'],
  },
  {
    id: 'P20412',
    brand: 'The Coca-Cola Company',
    product_name: 'Coke Original Taste 750ml',
    short_name: 'Coke',
    variant: '750ml',
    category: 'Beverages',
    mrp: 45.0,
    price: 40.0,
    barcode: '5449000000996',
    ocr_keywords: ['COCA-COLA', 'COKE', '750ml'],
  },
  {
    id: 'P30991',
    brand: 'Amul',
    product_name: 'Pasteurised Taaza Milk 1L',
    short_name: 'Milk',
    variant: '1L',
    category: 'Dairy',
    mrp: 66.0,
    price: 64.0,
    barcode: '8901262010112',
    ocr_keywords: ['AMUL', 'TAAZA', 'MILK', '1L'],
  },
];

describe('AIExtractor', () => {
  describe('processText', () => {
    it('should match product by exact brand and name', () => {
      const text = 'MAGGI 2-MINUTE NOODLES MASALA 70g';
      const result = AIExtractor.processText(text, mockProducts);
      
      expect(result.matchedProduct).not.toBeNull();
      expect(result.matchedProduct?.id).toBe('P10023');
      expect(result.matchedProduct?.brand).toBe('Nestle');
      expect(result.confidenceScore).toBeGreaterThan(0.5);
    });

    it('should match product by brand only', () => {
      const text = 'This is a MAGGI product';
      const result = AIExtractor.processText(text, mockProducts);
      
      expect(result.matchedProduct).not.toBeNull();
      expect(result.matchedProduct?.id).toBe('P10023');
    });

    it('should match product by short name', () => {
      const text = 'I love Maggi noodles';
      const result = AIExtractor.processText(text, mockProducts);
      
      expect(result.matchedProduct).not.toBeNull();
      expect(result.matchedProduct?.id).toBe('P10023');
    });

    it('should match product by OCR keywords', () => {
      const text = '2-MINUTE MASALA 70g';
      const result = AIExtractor.processText(text, mockProducts);
      
      expect(result.matchedProduct).not.toBeNull();
      expect(result.matchedProduct?.id).toBe('P10023');
    });

    it('should match Coke by brand', () => {
      const text = 'COCA-COLA 750ml';
      const result = AIExtractor.processText(text, mockProducts);
      
      expect(result.matchedProduct).not.toBeNull();
      expect(result.matchedProduct?.id).toBe('P20412');
    });

    it('should match Milk by brand', () => {
      const text = 'AMUL TAAZA MILK 1L';
      const result = AIExtractor.processText(text, mockProducts);
      
      expect(result.matchedProduct).not.toBeNull();
      expect(result.matchedProduct?.id).toBe('P30991');
    });

    it('should return null for non-matching text', () => {
      const text = 'This is a completely unknown product';
      const result = AIExtractor.processText(text, mockProducts);
      
      expect(result.matchedProduct).toBeNull();
      expect(result.confidenceScore).toBeLessThan(0.35);
    });

    it('should extract brand, product name, and quantity from text', () => {
      const text = 'MAGGI\n2-MINUTE NOODLES\n70g';
      const result = AIExtractor.processText(text, mockProducts);
      
      expect(result.rawOcrInfo.brand).toBe('MAGGI');
      expect(result.rawOcrInfo.productName).toContain('2-MINUTE NOODLES');
      expect(result.rawOcrInfo.quantity).toBe('70g');
    });

    it('should handle empty text', () => {
      const text = '';
      const result = AIExtractor.processText(text, mockProducts);
      
      expect(result.matchedProduct).toBeNull();
      expect(result.rawOcrInfo.brand).toBe('Unknown');
    });

    it('should handle text with no matching products', () => {
      const text = 'Some random text without any product keywords';
      const result = AIExtractor.processText(text, mockProducts);
      
      expect(result.matchedProduct).toBeNull();
      expect(result.confidenceScore).toBeLessThan(0.35);
    });

    it('should return high confidence for exact matches', () => {
      const text = 'MAGGI 2-MINUTE NOODLES MASALA 70g';
      const result = AIExtractor.processText(text, mockProducts);
      
      expect(result.confidenceScore).toBeGreaterThan(0.8);
    });

    it('should return medium confidence for partial matches', () => {
      const text = 'MAGGI';
      const result = AIExtractor.processText(text, mockProducts);
      
      expect(result.confidenceScore).toBeGreaterThan(0.35);
      expect(result.confidenceScore).toBeLessThan(0.8);
    });
  });

  describe('extractInfoFromText', () => {
    it('should extract brand from first long line', () => {
      const text = 'MAGGI\n2-Minute Noodles\n70g';
      // Note: We can't directly test private method, but we can test through processText
      const result = AIExtractor.processText(text, mockProducts);
      expect(result.rawOcrInfo.brand).toBe('MAGGI');
    });

    it('should extract quantity from text', () => {
      const text = 'Product Name\n500g';
      const result = AIExtractor.processText(text, mockProducts);
      expect(result.rawOcrInfo.quantity).toBe('500g');
    });

    it('should handle various quantity formats', () => {
      const quantities = ['500g', '1kg', '750ml', '1L', '250 GM'];
      quantities.forEach(qty => {
        const text = `Product\n${qty}`;
        const result = AIExtractor.processText(text, mockProducts);
        expect(result.rawOcrInfo.quantity).toBe(qty);
      });
    });
  });
});
