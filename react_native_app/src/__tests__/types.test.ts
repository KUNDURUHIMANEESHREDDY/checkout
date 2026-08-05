/**
 * Unit tests for TypeScript types
 * 
 * Tests that all types are properly defined
 */

import { Product, ExtractedProductInfo, AIExtractionResult, CartItem, ReceiptItem, ReceiptData } from '../types';

describe('Types', () => {
  describe('Product', () => {
    it('should have all required properties', () => {
      const product: Product = {
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
      };
      
      expect(product).toHaveProperty('id');
      expect(product).toHaveProperty('brand');
      expect(product).toHaveProperty('product_name');
      expect(product).toHaveProperty('short_name');
      expect(product).toHaveProperty('variant');
      expect(product).toHaveProperty('category');
      expect(product).toHaveProperty('mrp');
      expect(product).toHaveProperty('price');
      expect(product).toHaveProperty('barcode');
      expect(product).toHaveProperty('ocr_keywords');
    });

    it('should have correct types for all properties', () => {
      const product: Product = {
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
      };
      
      expect(typeof product.id).toBe('string');
      expect(typeof product.brand).toBe('string');
      expect(typeof product.product_name).toBe('string');
      expect(typeof product.short_name).toBe('string');
      expect(typeof product.variant).toBe('string');
      expect(typeof product.category).toBe('string');
      expect(typeof product.mrp).toBe('number');
      expect(typeof product.price).toBe('number');
      expect(typeof product.barcode).toBe('string');
      expect(Array.isArray(product.ocr_keywords)).toBe(true);
    });
  });

  describe('ExtractedProductInfo', () => {
    it('should have all required properties', () => {
      const info: ExtractedProductInfo = {
        brand: 'Nestle',
        productName: 'Maggi',
        quantity: '70g',
      };
      
      expect(info).toHaveProperty('brand');
      expect(info).toHaveProperty('productName');
      expect(info).toHaveProperty('quantity');
    });

    it('should have correct types for all properties', () => {
      const info: ExtractedProductInfo = {
        brand: 'Nestle',
        productName: 'Maggi',
        quantity: '70g',
      };
      
      expect(typeof info.brand).toBe('string');
      expect(typeof info.productName).toBe('string');
      expect(typeof info.quantity).toBe('string');
    });
  });

  describe('AIExtractionResult', () => {
    it('should have all required properties', () => {
      const mockProduct: Product = {
        id: 'P10023',
        brand: 'Nestle',
        product_name: 'Maggi',
        short_name: 'Maggi',
        variant: '70g',
        category: 'Noodles',
        mrp: 20.0,
        price: 18.0,
        barcode: '123',
        ocr_keywords: ['MAGGI'],
      };
      
      const mockInfo: ExtractedProductInfo = {
        brand: 'Nestle',
        productName: 'Maggi',
        quantity: '70g',
      };
      
      const result: AIExtractionResult = {
        matchedProduct: mockProduct,
        confidenceScore: 0.95,
        rawOcrInfo: mockInfo,
      };
      
      expect(result).toHaveProperty('matchedProduct');
      expect(result).toHaveProperty('confidenceScore');
      expect(result).toHaveProperty('rawOcrInfo');
    });

    it('should have correct types for all properties', () => {
      const mockProduct: Product = {
        id: 'P10023',
        brand: 'Nestle',
        product_name: 'Maggi',
        short_name: 'Maggi',
        variant: '70g',
        category: 'Noodles',
        mrp: 20.0,
        price: 18.0,
        barcode: '123',
        ocr_keywords: ['MAGGI'],
      };
      
      const mockInfo: ExtractedProductInfo = {
        brand: 'Nestle',
        productName: 'Maggi',
        quantity: '70g',
      };
      
      const result: AIExtractionResult = {
        matchedProduct: mockProduct,
        confidenceScore: 0.95,
        rawOcrInfo: mockInfo,
      };
      
      expect(result.matchedProduct).toBeInstanceOf(Object);
      expect(typeof result.confidenceScore).toBe('number');
      expect(result.rawOcrInfo).toBeInstanceOf(Object);
    });

    it('should allow null matchedProduct', () => {
      const mockInfo: ExtractedProductInfo = {
        brand: 'Unknown',
        productName: 'Unknown',
        quantity: '',
      };
      
      const result: AIExtractionResult = {
        matchedProduct: null,
        confidenceScore: 0.0,
        rawOcrInfo: mockInfo,
      };
      
      expect(result.matchedProduct).toBeNull();
    });
  });

  describe('CartItem', () => {
    it('should extend Product with quantity', () => {
      const product: Product = {
        id: 'P10023',
        brand: 'Nestle',
        product_name: 'Maggi',
        short_name: 'Maggi',
        variant: '70g',
        category: 'Noodles',
        mrp: 20.0,
        price: 18.0,
        barcode: '123',
        ocr_keywords: ['MAGGI'],
      };
      
      const cartItem: CartItem = {
        ...product,
        quantity: 2,
      };
      
      expect(cartItem).toHaveProperty('quantity');
      expect(typeof cartItem.quantity).toBe('number');
      expect(cartItem.quantity).toBe(2);
    });
  });

  describe('ReceiptItem', () => {
    it('should have all required properties', () => {
      const mockProduct: Product = {
        id: 'P10023',
        brand: 'Nestle',
        product_name: 'Maggi',
        short_name: 'Maggi',
        variant: '70g',
        category: 'Noodles',
        mrp: 20.0,
        price: 18.0,
        barcode: '123',
        ocr_keywords: ['MAGGI'],
      };
      
      const receiptItem: ReceiptItem = {
        product: mockProduct,
        quantity: 2,
        total: 36.0,
      };
      
      expect(receiptItem).toHaveProperty('product');
      expect(receiptItem).toHaveProperty('quantity');
      expect(receiptItem).toHaveProperty('total');
    });

    it('should have correct types for all properties', () => {
      const mockProduct: Product = {
        id: 'P10023',
        brand: 'Nestle',
        product_name: 'Maggi',
        short_name: 'Maggi',
        variant: '70g',
        category: 'Noodles',
        mrp: 20.0,
        price: 18.0,
        barcode: '123',
        ocr_keywords: ['MAGGI'],
      };
      
      const receiptItem: ReceiptItem = {
        product: mockProduct,
        quantity: 2,
        total: 36.0,
      };
      
      expect(receiptItem.product).toBeInstanceOf(Object);
      expect(typeof receiptItem.quantity).toBe('number');
      expect(typeof receiptItem.total).toBe('number');
    });
  });

  describe('ReceiptData', () => {
    it('should have all required properties', () => {
      const receiptData: ReceiptData = {
        invoiceId: 'INV-20250805-123456',
        date: '2025-08-05',
        items: [],
        subtotal: 0,
        tax: 0,
        total: 0,
        customerName: 'Test Customer',
        customerPhone: '1234567890',
      };
      
      expect(receiptData).toHaveProperty('invoiceId');
      expect(receiptData).toHaveProperty('date');
      expect(receiptData).toHaveProperty('items');
      expect(receiptData).toHaveProperty('subtotal');
      expect(receiptData).toHaveProperty('tax');
      expect(receiptData).toHaveProperty('total');
      expect(receiptData).toHaveProperty('customerName');
      expect(receiptData).toHaveProperty('customerPhone');
    });

    it('should have correct types for all properties', () => {
      const receiptData: ReceiptData = {
        invoiceId: 'INV-20250805-123456',
        date: '2025-08-05',
        items: [],
        subtotal: 0,
        tax: 0,
        total: 0,
        customerName: 'Test Customer',
        customerPhone: '1234567890',
      };
      
      expect(typeof receiptData.invoiceId).toBe('string');
      expect(typeof receiptData.date).toBe('string');
      expect(Array.isArray(receiptData.items)).toBe(true);
      expect(typeof receiptData.subtotal).toBe('number');
      expect(typeof receiptData.tax).toBe('number');
      expect(typeof receiptData.total).toBe('number');
      expect(typeof receiptData.customerName).toBe('string');
      expect(typeof receiptData.customerPhone).toBe('string');
    });
  });
});
