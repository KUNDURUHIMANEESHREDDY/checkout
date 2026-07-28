import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/product.dart';
import '../providers/scan_provider.dart';
import '../providers/cart_provider.dart';

class UnknownProductDialog extends ConsumerStatefulWidget {
  final ScanNeedsReview scanData;

  const UnknownProductDialog({super.key, required this.scanData});

  @override
  ConsumerState<UnknownProductDialog> createState() => _UnknownProductDialogState();
}

class _UnknownProductDialogState extends ConsumerState<UnknownProductDialog> {
  late TextEditingController _brandCtrl;
  late TextEditingController _nameCtrl;
  late TextEditingController _quantityCtrl;
  late TextEditingController _priceCtrl;
  late TextEditingController _categoryCtrl;

  @override
  void initState() {
    super.initState();
    final info = widget.scanData.rawInfo;
    final suggested = widget.scanData.suggestedProduct;

    // Prefill with suggested product if confidence is somewhat decent, else raw OCR
    _brandCtrl = TextEditingController(text: suggested?.brand ?? info.brand);
    _nameCtrl = TextEditingController(text: suggested?.name ?? info.productName);
    _quantityCtrl = TextEditingController(text: suggested?.variant ?? info.quantity);
    _priceCtrl = TextEditingController(text: suggested?.price.toString() ?? '0.0');
    _categoryCtrl = TextEditingController(text: suggested?.category ?? 'Auto-Detected');
  }

  @override
  void dispose() {
    _brandCtrl.dispose();
    _nameCtrl.dispose();
    _quantityCtrl.dispose();
    _priceCtrl.dispose();
    _categoryCtrl.dispose();
    super.dispose();
  }

  Product _buildProduct() {
    return Product(
      id: widget.scanData.suggestedProduct?.id ?? DateTime.now().millisecondsSinceEpoch.toString(),
      brand: _brandCtrl.text.trim(),
      name: _nameCtrl.text.trim(),
      shortName: _nameCtrl.text.trim(),
      variant: _quantityCtrl.text.trim(),
      category: _categoryCtrl.text.trim(),
      mrp: double.tryParse(_priceCtrl.text) ?? 0.0,
      price: double.tryParse(_priceCtrl.text) ?? 0.0,
      barcode: widget.scanData.suggestedProduct?.barcode ?? '',
    );
  }

  void _resumeScanning() {
    ref.read(scanNotifierProvider.notifier).resumeScanning();
    Navigator.of(context).pop();
  }

  @override
  Widget build(BuildContext context) {
    final bool isReview = widget.scanData.confidence >= 0.90;

    return Dialog(
      backgroundColor: const Color(0xFF111827),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
      child: Padding(
        padding: const EdgeInsets.all(24.0),
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Row(
                children: [
                  Icon(
                    isReview ? Icons.rate_review : Icons.warning_amber_rounded,
                    color: isReview ? Colors.orangeAccent : Colors.redAccent,
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      isReview ? 'Review Suggested (Conf: ${(widget.scanData.confidence * 100).toStringAsFixed(1)}%)' : 'Unknown Product',
                      style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 24),
              
              // Product Image Placeholder (To be replaced with actual cropped image in future)
              Container(
                height: 120,
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.05),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: const Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.image_outlined, color: Colors.grey, size: 40),
                      SizedBox(height: 8),
                      Text('Product Image', style: TextStyle(color: Colors.grey)),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 24),

              _buildField('Brand', _brandCtrl),
              _buildField('Product Name', _nameCtrl),
              Row(
                children: [
                  Expanded(child: _buildField('Quantity', _quantityCtrl)),
                  const SizedBox(width: 16),
                  Expanded(child: _buildField('Price (₹)', _priceCtrl, isNumber: true)),
                ],
              ),
              _buildField('Category', _categoryCtrl),
              
              const SizedBox(height: 32),

              ElevatedButton(
                onPressed: () async {
                  Product product = _buildProduct();
                  
                  // Duplicate Protection
                  final existingProducts = await ref.read(productServiceProvider).getProducts().first;
                  try {
                    final duplicate = existingProducts.firstWhere((p) => 
                      p.brand.toLowerCase() == product.brand.toLowerCase() &&
                      p.name.toLowerCase() == product.name.toLowerCase() &&
                      p.variant.toLowerCase() == product.variant.toLowerCase()
                    );
                    // Reuse existing ID to update instead of duplicate
                    product = Product(
                      id: duplicate.id,
                      brand: product.brand,
                      name: product.name,
                      shortName: product.shortName,
                      variant: product.variant,
                      category: product.category,
                      mrp: product.mrp,
                      price: product.price,
                      barcode: duplicate.barcode,
                      ocrKeywords: duplicate.ocrKeywords,
                    );
                  } catch (_) {
                    // No duplicate found
                  }

                  // Save to Firebase
                  ref.read(productServiceProvider).addProduct(product);
                  // Add to Cart
                  ref.read(cartProvider.notifier).addProduct(product);
                  _resumeScanning();
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF10B981),
                  foregroundColor: Colors.black,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                child: const Text('Save & Add', style: TextStyle(fontWeight: FontWeight.bold)),
              ),
              const SizedBox(height: 12),
              
              OutlinedButton(
                onPressed: () {
                  final product = _buildProduct();
                  // Add to Cart ONLY
                  ref.read(cartProvider.notifier).addProduct(product);
                  _resumeScanning();
                },
                style: OutlinedButton.styleFrom(
                  foregroundColor: Colors.white,
                  side: const BorderSide(color: Colors.white30),
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                child: const Text('Add Once (Do not save)'),
              ),
              const SizedBox(height: 12),
              
              TextButton(
                onPressed: _resumeScanning,
                style: TextButton.styleFrom(foregroundColor: Colors.redAccent),
                child: const Text('Cancel & Resume Scanning'),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildField(String label, TextEditingController controller, {bool isNumber = false}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: TextField(
        controller: controller,
        keyboardType: isNumber ? const TextInputType.numberWithOptions(decimal: true) : TextInputType.text,
        style: const TextStyle(color: Colors.white),
        decoration: InputDecoration(
          labelText: label,
          labelStyle: TextStyle(color: Colors.grey[500]),
          filled: true,
          fillColor: Colors.white.withOpacity(0.05),
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: BorderSide.none,
          ),
        ),
      ),
    );
  }
}
