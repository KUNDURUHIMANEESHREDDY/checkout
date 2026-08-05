import 'dart:convert';
import 'package:flutter/services.dart';
import '../models/product.dart';

class ProductService {
  List<Product> _localProducts = [];
  bool _isLoaded = false;

  ProductService() {
    _loadLocalProducts();
  }

  Future<void> _loadLocalProducts() async {
    if (_isLoaded) return;
    
    try {
      final String localData = await rootBundle.loadString('assets/data/products.json');
      final List<dynamic> localJson = json.decode(localData);
      _localProducts = localJson.map((j) => Product.fromFirestore(j, j['id'])).toList();
      _isLoaded = true;
    } catch (e) {
      print('Error loading local products: $e');
      // Fallback to hardcoded products if file loading fails
      _localProducts = _getFallbackProducts();
      _isLoaded = true;
    }
  }

  List<Product> _getFallbackProducts() {
    return [
      Product(
        id: 'P10023',
        brand: 'Nestle',
        name: 'Maggi 2-Minute Noodles Masala 70g',
        shortName: 'Maggi',
        variant: '70g',
        category: 'Instant Noodles',
        mrp: 20.0,
        price: 18.0,
        barcode: '8901058002341',
        ocrKeywords: ['MAGGI', '2-MINUTE', 'MASALA', '70g'],
      ),
      Product(
        id: 'P20412',
        brand: 'The Coca-Cola Company',
        name: 'Coke Original Taste 750ml',
        shortName: 'Coke',
        variant: '750ml',
        category: 'Beverages',
        mrp: 45.0,
        price: 40.0,
        barcode: '5449000000996',
        ocrKeywords: ['COCA-COLA', 'COKE', '750ml'],
      ),
      Product(
        id: 'P30991',
        brand: 'Amul',
        name: 'Pasteurised Taaza Milk 1L',
        shortName: 'Milk',
        variant: '1L',
        category: 'Dairy',
        mrp: 66.0,
        price: 64.0,
        barcode: '8901262010112',
        ocrKeywords: ['AMUL', 'TAAZA', 'MILK', '1L'],
      ),
      Product(
        id: 'P40115',
        brand: 'Frito-Lay',
        name: 'Lays Classic Salted Chips 52g',
        shortName: 'Lays Chips',
        variant: '52g',
        category: 'Snacks',
        mrp: 20.0,
        price: 18.0,
        barcode: '8901491102030',
        ocrKeywords: ['LAYS', 'CLASSIC', '52g'],
      ),
      Product(
        id: 'P50882',
        brand: 'Nestle',
        name: 'Nescafe Classic Instant Coffee 100g',
        shortName: 'Nescafe Coffee',
        variant: '100g',
        category: 'Pantry',
        mrp: 350.0,
        price: 320.0,
        barcode: '7613035123456',
        ocrKeywords: ['NESCAFE', 'CLASSIC', '100g'],
      ),
    ];
  }

  Stream<List<Product>> getProducts() async* {
    // Ensure products are loaded
    await _loadLocalProducts();
    
    // Emit local products
    yield _localProducts;
  }

  Future<List<Product>> getProductsOnce() async {
    await _loadLocalProducts();
    return _localProducts;
  }

  Future<void> addProduct(Product product) async {
    // In local mode, we can't persist to Firebase
    // For now, just add to local list (won't persist after app restart)
    _localProducts.add(product);
    print('Product added to local list: ${product.shortName}');
  }

  Product? getProductById(String id) {
    try {
      return _localProducts.firstWhere((p) => p.id == id);
    } catch (e) {
      return null;
    }
  }
}
