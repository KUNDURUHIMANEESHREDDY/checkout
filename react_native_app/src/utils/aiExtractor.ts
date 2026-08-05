import { Product, ExtractedProductInfo, AIExtractionResult } from '../types';
import stringSimilarity from 'string-similarity';

class AIExtractor {
  static processText(text: string, catalog: Product[]): AIExtractionResult {
    // 1. Raw Extraction
    const rawInfo = this.extractInfoFromText(text);
    
    // 2. Fuzzy Matching against Catalog
    const fullText = text.toUpperCase().replace(/\n/g, ' ');
    
    let bestMatch: Product | null = null;
    let highestConfidence = 0.0;

    for (const product of catalog) {
      const productBrand = product.brand.toUpperCase();
      const productName = product.name.toUpperCase();
      const shortName = product.short_name.toUpperCase();
      const variant = product.variant.toUpperCase();

      // Calculate Similarity
      const extractedSearchTerm = `${rawInfo.brand} ${rawInfo.productName}`.toUpperCase();
      const productSearchTerm = `${productBrand} ${productName}`.toUpperCase();
      
      let confidence = stringSimilarity.compareTwoStrings(
        extractedSearchTerm.toLowerCase(),
        productSearchTerm.toLowerCase()
      );

      // Boost for matching Brand
      if (fullText.includes(productBrand) || rawInfo.brand.toUpperCase().includes(productBrand)) {
        confidence += 0.3;
      }

      // Boost for matching short name
      if (fullText.includes(shortName) || 
          rawInfo.brand.toUpperCase().includes(shortName) || 
          rawInfo.productName.toUpperCase().includes(shortName)) {
        confidence += 0.4;
      }

      // Boost for variant match (Quantity)
      if (rawInfo.quantity && variant.includes(rawInfo.quantity.toUpperCase())) {
        confidence += 0.2;
      }

      // Boost for Keywords
      let keywordMatches = 0;
      for (const keyword of product.ocr_keywords) {
        if (fullText.includes(keyword.toUpperCase())) {
          keywordMatches++;
        }
      }
      confidence += Math.min(keywordMatches * 0.1, 0.4);

      // Additional boost if brand matches exactly
      if (rawInfo.brand.toUpperCase() === productBrand || 
          rawInfo.brand.toUpperCase() === shortName) {
        confidence += 0.2;
      }

      // Additional boost if product name contains keywords
      for (const keyword of product.ocr_keywords) {
        if (rawInfo.productName.toUpperCase().includes(keyword.toUpperCase())) {
          confidence += 0.1;
        }
      }

      if (confidence > 1.0) confidence = 1.0;

      if (confidence > highestConfidence) {
        highestConfidence = confidence;
        bestMatch = product;
      }
    }

    return {
      matchedProduct: highestConfidence >= 0.35 ? bestMatch : null,
      confidenceScore: highestConfidence,
      rawOcrInfo: rawInfo,
    };
  }

  private static extractInfoFromText(text: string): ExtractedProductInfo {
    let brand = '';
    let productName = '';
    let quantity = '';

    const lines = text.split('\n');
    const quantityRegex = /(\d+)\s*(g|kg|ml|l|L|gm|pack|Pack|PACK)/gi;

    // Sort lines by length (longer lines are likely brand/product names)
    const sortedLines = [...lines].sort((a, b) => b.length - a.length);

    for (const line of sortedLines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      // Extract quantity first
      if (!quantity) {
        const match = trimmed.match(quantityRegex);
        if (match) {
          quantity = match[0];
        }
      }

      // First long line is likely brand
      if (!brand && trimmed.length > 3) {
        brand = trimmed;
      } else if (!productName && trimmed.length > 3 && trimmed !== brand) {
        productName = trimmed;
      }
    }

    // If we only have one line, use it as brand
    if (!productName && brand) {
      productName = 'Unknown Product';
    }

    return {
      brand: brand || 'Unknown',
      productName: productName || 'Unknown Product',
      quantity: quantity || '',
    };
  }
}

export default AIExtractor;
