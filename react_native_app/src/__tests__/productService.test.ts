/**
 * Unit tests for Product Service
 * 
 * Tests the product catalog functionality
 */

import { productService } from '../services/productService';
import { Product } from '../types';

describe('ProductService', () => {
  describe('getProducts', () => {
    it('should return an array of products', () => {
      const products = productService.getProducts();
      expect(Array.isArray(products)).toBe(true);
    });

    it('should return at least 5 products', () => {
      const products = productService.getProducts();
      expect(products.length).toBeGreaterThanOrEqual(5);
    });

    it('should return products with all required fields', () => {
      const products = productService.getProducts();
      
      products.forEach(product => {
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
    });

    it('should return products with valid types', () => {
      const products = productService.getProducts();
      
      products.forEach(product => {
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
  });

  describe('getProductById', () => {
    it('should return product by valid ID', () => {
      const products = productService.getProducts();
      const firstProduct = products[0];
      
      const result = productService.getProductById(firstProduct.id);
      expect(result).not.toBeNull();
      expect(result?.id).toBe(firstProduct.id);
    });

    it('should return null for invalid ID', () => {
      const result = productService.getProductById('INVALID_ID');
      expect(result).toBeNull();
    });

    it('should return null for non-existent ID', () => {
      const result = productService.getProductById('P99999');
      expect(result).toBeNull();
    });
  });

  describe('searchProducts', () => {
    it('should return products matching query', () => {
      const results = productService.searchProducts('Maggi');
      expect(results.length).toBeGreaterThan(0);
      expect(results.some(p => p.brand.toLowerCase().includes('maggi'))).toBe(true);
    });

    it('should return empty array for no matches', () => {
      const results = productService.searchProducts('NonExistentProduct');
      expect(results.length).toBe(0);
    });

    it('should be case-insensitive', () => {
      const lowerResults = productService.searchProducts('maggi');
      const upperResults = productService.searchProducts('MAGGI');
      expect(lowerResults.length).toBe(upperResults.length);
    });

    it('should match by brand', () => {
      const results = productService.searchProducts('Nestle');
      expect(results.every(p => p.brand.toLowerCase().includes('nestle'))).toBe(true);
    });

    it('should match by short name', () => {
      const results = productService.searchProducts('Coke');
      expect(results.some(p => p.short_name.toLowerCase().includes('coke'))).toBe(true);
    });

    it('should match by OCR keywords', () => {
      const results = productService.searchProducts('MASALA');
      expect(results.some(p => p.ocr_keywords.some(kw => kw.toLowerCase().includes('masala')))).toBe(true);
    });
  });

  describe('addProduct', () => {
    it('should add new product to catalog', () => {
      const initialCount = productService.getProducts().length;
      
      const newProduct: Product = {
        id: 'TEST_001',
        brand: 'Test Brand',
        product_name: 'Test Product',
        short_name: 'Test',
        variant: '100g',
        category: 'Test',
        mrp: 10.0,
        price: 9.0,
        barcode: 'TEST001',
        ocr_keywords: ['TEST'],
      };
      
      productService.addProduct(newProduct);
      const newCount = productService.getProducts().length;
      
      expect(newCount).toBe(initialCount + 1);
      expect(productService.getProductById('TEST_001')).not.toBeNull();
    });

    it('should allow adding multiple products', () => {
      const initialCount = productService.getProducts().length;
      
      const productsToAdd: Product[] = [
        {
          id: 'TEST_002',
          brand: 'Test Brand 2',
          product_name: 'Test Product 2',
          short_name: 'Test 2',
          variant: '200g',
          category: 'Test',
          mrp: 20.0,
          price: 18.0,
          barcode: 'TEST002',
          ocr_keywords: ['TEST2'],
        },
        {
          id: 'TEST_003',
          brand: 'Test Brand 3',
          product_name: 'Test Product 3',
          short_name: 'Test 3',
          variant: '300g',
          category: 'Test',
          mrp: 30.0,
          price: 27.0,
          barcode: 'TEST003',
          ocr_keywords: ['TEST3'],
        },
      ];
      
      productsToAdd.forEach(product => productService.addProduct(product));
      const newCount = productService.getProducts().length;
      
      expect(newCount).toBe(initialCount + 2);
    });
  });
});
