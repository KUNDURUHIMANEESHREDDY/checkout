import 'dart:ui';
import 'package:google_mlkit_text_recognition/google_mlkit_text_recognition.dart';
import 'package:string_similarity/string_similarity.dart';
import '../models/product.dart';

class ExtractedProductInfo {
  final String brand;
  final String productName;
  final String quantity;

  ExtractedProductInfo({
    required this.brand,
    required this.productName,
    required this.quantity,
  });
}

class AIExtractionResult {
  final Product? matchedProduct;
  final double confidenceScore;
  final ExtractedProductInfo rawOcrInfo;

  AIExtractionResult({
    this.matchedProduct,
    required this.confidenceScore,
    required this.rawOcrInfo,
  });
}

class AIExtractor {
  static AIExtractionResult processFrame(RecognizedText recognizedText, List<Product> catalog, {Size? imageSize}) {
    // 1. Raw Extraction (Fallback / Prefill)
    String brand = '';
    String productName = '';
    String quantity = '';

    double maxFontSize = 0;
    double secondMaxFontSize = 0;
    final quantityRegex = RegExp(r'\d+\s*(g|kg|ml|l|L|gm|gm|kgm|KGM|pack|Pack|PACK)', caseSensitive: false);

    for (TextBlock block in recognizedText.blocks) {
      for (TextLine line in block.lines) {
        final text = line.text.trim();
        if (text.isEmpty) continue;

        final double currentHeight = line.boundingBox.height;

        // Extract quantity first
        if (quantity.isEmpty) {
          final match = quantityRegex.firstMatch(text);
          if (match != null) {
            quantity = match.group(0) ?? '';
          }
        }

        // Extract brand and product name based on font size (larger text = brand/product)
        if (currentHeight > maxFontSize) {
          secondMaxFontSize = maxFontSize;
          productName = brand.isNotEmpty ? brand : productName;
          maxFontSize = currentHeight;
          brand = text;
        } else if (currentHeight > secondMaxFontSize && text != brand) {
          secondMaxFontSize = currentHeight;
          productName = text;
        }
      }
    }

    final rawInfo = ExtractedProductInfo(
      brand: brand,
      productName: productName.isEmpty ? 'Unknown Product' : productName,
      quantity: quantity,
    );

    // 2. Fuzzy Matching against Local Catalog
    final fullText = recognizedText.text.toUpperCase().replaceAll('\n', ' ');
    
    Product? bestMatch;
    double highestConfidence = 0.0;

    for (final product in catalog) {
      final productBrand = product.brand.toUpperCase();
      final productName = product.name.toUpperCase();
      final shortName = product.shortName.toUpperCase();
      final variant = product.variant.toUpperCase();

      // Calculate Similarity
      final extractedSearchTerm = '${rawInfo.brand} ${rawInfo.productName}'.toUpperCase();
      final productSearchTerm = '$productBrand $productName'.toUpperCase();
      
      double confidence = extractedSearchTerm.similarityTo(productSearchTerm);

      // Boost for matching Brand
      if (fullText.contains(productBrand) || rawInfo.brand.toUpperCase().contains(productBrand)) {
        confidence += 0.3;
      }

      // Boost for matching short name
      if (fullText.contains(shortName) || rawInfo.brand.toUpperCase().contains(shortName) || rawInfo.productName.toUpperCase().contains(shortName)) {
        confidence += 0.4;
      }

      // Boost for variant match (Quantity)
      if (rawInfo.quantity.isNotEmpty && variant.contains(rawInfo.quantity.toUpperCase())) {
        confidence += 0.2;
      }

      // Boost for Keywords
      int keywordMatches = 0;
      for (final keyword in product.ocrKeywords) {
        if (fullText.contains(keyword.toUpperCase())) {
          keywordMatches++;
        }
      }
      confidence += (keywordMatches * 0.1).clamp(0.0, 0.4);

      // Additional boost if brand matches exactly
      if (rawInfo.brand.toUpperCase() == productBrand || 
          rawInfo.brand.toUpperCase() == shortName) {
        confidence += 0.2;
      }

      // Additional boost if product name contains keywords
      for (final keyword in product.ocrKeywords) {
        if (rawInfo.productName.toUpperCase().contains(keyword.toUpperCase())) {
          confidence += 0.1;
        }
      }

      if (confidence > 1.0) confidence = 1.0;

      if (confidence > highestConfidence) {
        highestConfidence = confidence;
        bestMatch = product;
      }
    }

    return AIExtractionResult(
      matchedProduct: highestConfidence >= 0.35 ? bestMatch : null,
      confidenceScore: highestConfidence,
      rawOcrInfo: rawInfo,
    );
  }
}
