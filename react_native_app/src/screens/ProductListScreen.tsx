import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, FlatList, TouchableOpacity } from 'react-native';
import { Card, Searchbar, Button, Avatar } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { productService } from '../services/productService';
import { Product } from '../types';

const ProductListScreen = () => {
  const navigation = useNavigation();
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);

  useEffect(() => {
    const allProducts = productService.getProducts();
    setProducts(allProducts);
    setFilteredProducts(allProducts);
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const filtered = productService.searchProducts(searchQuery);
      setFilteredProducts(filtered);
    } else {
      setFilteredProducts(products);
    }
  }, [searchQuery, products]);

  const renderItem = ({ item }: { item: Product }) => (
    <Card style={styles.itemCard}>
      <Card.Title
        title={`${item.brand} - ${item.short_name}`}
        subtitle={`${item.variant} | $${item.price.toFixed(2)}`}
        left={(props) => (
          <Avatar.Icon
            {...props}
            icon="shopping"
            style={{ backgroundColor: '#10B981' }}
          />
        )}
      />
      <Card.Content>
        <Text style={styles.productCategory}>{item.category}</Text>
        <Text style={styles.productBarcode}>Barcode: {item.barcode}</Text>
        <View style={styles.keywordsContainer}>
          {item.ocr_keywords.slice(0, 3).map((keyword, index) => (
            <View key={index} style={styles.keywordTag}>
              <Text style={styles.keywordText}>{keyword}</Text>
            </View>
          ))}
        </View>
      </Card.Content>
    </Card>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Product Catalog</Text>
      
      <Searchbar
        placeholder="Search products..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchBar}
        inputStyle={styles.searchInput}
      />

      <Text style={styles.countText}>
        {filteredProducts.length} product(s) found
      </Text>

      <FlatList
        data={filteredProducts}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
      />

      <Button
        mode="contained"
        onPress={() => navigation.goBack()}
        style={styles.backButton}
      >
        Back to Scanner
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#10B981',
  },
  searchBar: {
    marginBottom: 16,
    elevation: 2,
  },
  searchInput: {
    fontSize: 14,
  },
  countText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    textAlign: 'right',
  },
  listContainer: {
    paddingBottom: 20,
  },
  itemCard: {
    marginBottom: 12,
    elevation: 2,
  },
  productCategory: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  productBarcode: {
    fontSize: 10,
    color: '#999',
    fontFamily: 'monospace',
  },
  keywordsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    gap: 6,
  },
  keywordTag: {
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  keywordText: {
    fontSize: 10,
    color: '#0369a1',
  },
  backButton: {
    marginTop: 'auto',
    paddingVertical: 8,
  },
});

export default ProductListScreen;
