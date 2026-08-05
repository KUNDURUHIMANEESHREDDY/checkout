import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_mlkit_text_recognition/google_mlkit_text_recognition.dart';
import '../models/product.dart';
import '../services/product_service.dart';
import '../utils/ai_extractor.dart';
import 'cart_provider.dart';

final productServiceProvider = Provider((ref) => ProductService());

abstract class ScanState {}

class ScanIdle extends ScanState {}

class ScanSuccess extends ScanState {
  final Product product;
  ScanSuccess(this.product);
}

class ScanNeedsReview extends ScanState {
  final ExtractedProductInfo rawInfo;
  final Product? suggestedProduct;
  final double confidence;
  ScanNeedsReview(this.rawInfo, this.suggestedProduct, this.confidence);
}

class ScanNotifier extends StateNotifier<ScanState> {
  final Ref _ref;
  final TextRecognizer _textRecognizer = TextRecognizer();
  bool _isProcessing = false;
  List<Product> _localProducts = [];

  ScanNotifier(this._ref) : super(ScanIdle()) {
    _loadProducts();
  }

  Future<void> _loadProducts() async {
    _localProducts = await _ref.read(productServiceProvider).getProductsOnce();
  }

  void resumeScanning() {
    state = ScanIdle();
  }

  Future<void> processImage(InputImage inputImage) async {
    if (_isProcessing || state is ScanNeedsReview) return; // Pause if reviewing
    _isProcessing = true;

    try {
      final recognizedText = await _textRecognizer.processImage(inputImage);
      
      // Use local products
      if (_localProducts.isEmpty) {
        _localProducts = await _ref.read(productServiceProvider).getProductsOnce();
      }

      final result = AIExtractor.processFrame(recognizedText, _localProducts, imageSize: inputImage.metadata?.size);
      
      // We only proceed if we at least extracted some brand
      if (result.rawOcrInfo.brand.isNotEmpty) {
        
        if (result.confidenceScore >= 0.60 && result.matchedProduct != null) {
          // AUTO ADD (High Confidence)
          if (state is ScanSuccess && (state as ScanSuccess).product.id == result.matchedProduct!.id) {
             // Already showing success for this item, ignore
          } else {
            state = ScanSuccess(result.matchedProduct!);
            _ref.read(cartProvider.notifier).addProduct(result.matchedProduct!);

            Future.delayed(const Duration(seconds: 2), () {
              if (mounted && state is ScanSuccess) state = ScanIdle();
            });
          }
        } else {
          // REVIEW SUGGESTED (< 60%) or UNKNOWN PRODUCT
          // Pauses the camera automatically because state becomes ScanNeedsReview
          state = ScanNeedsReview(result.rawOcrInfo, result.matchedProduct, result.confidenceScore);
        }
      }
    } catch (e) {
      debugPrint('Scan error: $e');
      // Silently fail for empty frames
    } finally {
      _isProcessing = false;
    }
  }

  @override
  void dispose() {
    _textRecognizer.close();
    super.dispose();
  }
}

final scanNotifierProvider = StateNotifierProvider<ScanNotifier, ScanState>((ref) => ScanNotifier(ref));
