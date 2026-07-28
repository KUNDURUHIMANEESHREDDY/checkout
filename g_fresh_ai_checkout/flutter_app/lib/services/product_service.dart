import 'dart:convert';
import 'package:flutter/services.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import '../models/product.dart';

class ProductService {
  final FirebaseFirestore _db = FirebaseFirestore.instance;

  Stream<List<Product>> getProducts() async* {
    // Try local assets first as a baseline
    final String localData = await rootBundle.loadString('assets/data/products.json');
    final List<dynamic> localJson = json.decode(localData);
    final List<Product> localProducts = localJson.map((j) => Product.fromFirestore(j, j['id'])).toList();

    // Start by emitting local products so the app works instantly
    yield localProducts;

    try {
      // Then listen for live updates from Firestore
      await for (var snapshot in _db.collection('products').snapshots()) {
        if (snapshot.docs.isNotEmpty) {
          final liveProducts = snapshot.docs.map((doc) {
            return Product.fromFirestore(doc.data(), doc.id);
          }).toList();
          yield liveProducts;
        }
      }
    } catch (e) {
      // If Firestore fails (offline/no server), we just keep using local products
      print('Firestore Error: $e. Falling back to local catalog.');
    }
  }

  Future<void> addProduct(Product product) async {
    await _db.collection('products').doc(product.id).set(product.toFirestore());
  }
}
