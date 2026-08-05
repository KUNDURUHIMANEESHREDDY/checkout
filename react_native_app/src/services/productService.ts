import { Product } from '../types';
import productsData from '../assets/data/products';

class ProductService {
  private products: Product[] = [];
  private isLoaded: boolean = false;

  constructor() {
    this.loadProducts();
  }

  private loadProducts(): void {
    if (this.isLoaded) return;
    
    try {
      this.products = productsData as Product[];
      this.isLoaded = true;
    } catch (error) {
      console.error('Error loading products:', error);
      this.products = this.getFallbackProducts();
      this.isLoaded = true;
    }
  }

  private getFallbackProducts(): Product[] {
    return [
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
        brand: 'Coca-Cola',
        product_name: 'Coke Original Taste 750ml',
        short_name: 'Coke',
        variant: '750ml',
        category: 'Beverages',
        mrp: 45.0,
        price: 40.0,
        barcode: '5449000000996',
        ocr_keywords: ['COCA-COLA', 'COKE', '750ml'],
      },
    ];
  }

  getProducts(): Product[] {
    return this.products;
  }

  getProductById(id: string): Product | null {
    return this.products.find(p => p.id === id) || null;
  }

  addProduct(product: Product): void {
    this.products.push(product);
    console.log('Product added:', product.short_name);
  }

  searchProducts(query: string): Product[] {
    const lowerQuery = query.toLowerCase();
    return this.products.filter(product => 
      product.brand.toLowerCase().includes(lowerQuery) ||
      product.short_name.toLowerCase().includes(lowerQuery) ||
      product.product_name.toLowerCase().includes(lowerQuery) ||
      product.ocr_keywords.some(kw => kw.toLowerCase().includes(lowerQuery))
    );
  }
}

export const productService = new ProductService();
