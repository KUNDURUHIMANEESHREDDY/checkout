class Product {
  final String id;
  final String brand;
  final String name;
  final String shortName;
  final String variant;
  final String category;
  final double mrp;
  final double price;
  final String barcode;
  final List<String> ocrKeywords;

  Product({
    required this.id,
    required this.brand,
    required this.name,
    required this.shortName,
    required this.variant,
    required this.category,
    required this.mrp,
    required this.price,
    required this.barcode,
    this.ocrKeywords = const [],
  });

  factory Product.fromFirestore(Map<String, dynamic> json, String id) {
    return Product(
      id: id,
      brand: json['brand'] ?? '',
      name: json['product_name'] ?? '',
      shortName: json['short_name'] ?? '',
      variant: json['variant'] ?? '',
      category: json['category'] ?? '',
      mrp: (json['mrp'] ?? 0).toDouble(),
      price: (json['price'] ?? 0).toDouble(),
      barcode: json['barcode'] ?? '',
      ocrKeywords: List<String>.from(json['ocr_keywords'] ?? []),
    );
  }

  Map<String, dynamic> toFirestore() {
    return {
      'brand': brand,
      'product_name': name,
      'short_name': shortName,
      'variant': variant,
      'category': category,
      'mrp': mrp,
      'price': price,
      'barcode': barcode,
      'ocr_keywords': ocrKeywords,
    };
  }
}
