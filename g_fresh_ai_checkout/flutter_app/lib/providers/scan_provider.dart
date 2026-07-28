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

  ScanNotifier(this._ref) : super(ScanIdle());

  void resumeScanning() {
    state = ScanIdle();
  }

  Future<void> processImage(InputImage inputImage) async {
    if (_isProcessing || state is ScanNeedsReview) return; // Pause if reviewing
    _isProcessing = true;

    try {
      final recognizedText = await _textRecognizer.processImage(inputImage);

      // Add a timeout to the Firestore fetch to prevent hanging
      final products = await _ref
          .read(productServiceProvider)
          .getProducts()
          .first
          .timeout(const Duration(seconds: 5), onTimeout: () => []);

      if (products.isEmpty) {
        debugPrint('Warning: No products found in catalog or fetch timed out.');
      }
      
      final result = AIExtractor.processFrame(recognizedText, products, imageSize: inputImage.metadata?.size);
      
      // We only proceed if we at least extracted some brand
      if (result.rawOcrInfo.brand.isNotEmpty) {
        
        if (result.confidenceScore >= 0.85 && result.matchedProduct != null) {
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
          // REVIEW SUGGESTED (< 85%) or UNKNOWN PRODUCT
          // Pauses the camera automatically because state becomes ScanNeedsReview
          state = ScanNeedsReview(result.rawOcrInfo, result.matchedProduct, result.confidenceScore);
        }
      }
    } catch (e) {
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
