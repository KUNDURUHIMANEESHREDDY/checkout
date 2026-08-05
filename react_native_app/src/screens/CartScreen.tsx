import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, FlatList, Alert, TouchableOpacity } from 'react-native';
import { Button, Card, List, Avatar, TextInput, Dialog, Portal } from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import ReceiptService from '../services/receiptService';
import { Product } from '../types';

type CartScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Cart'>;
  route: any;
};

const CartScreen: React.FC<CartScreenProps> = ({ navigation, route }) => {
  const { items: initialItems = [], setItems } = route.params || {};
  const [cartItems, setCartItems] = useState<Product[]>(initialItems);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showCheckoutDialog, setShowCheckoutDialog] = useState(false);
  const [customerName, setCustomerName] = useState('Customer');
  const [customerPhone, setCustomerPhone] = useState('');

  // Sync with parent if setItems is provided
  useEffect(() => {
    if (setItems) {
      setItems(cartItems);
    }
  }, [cartItems, setItems]);

  const calculateSubtotal = () => {
    return cartItems.reduce((sum, item) => sum + item.price, 0);
  };

  const calculateTax = () => {
    return calculateSubtotal() * 0.18;
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax();
  };

  const removeItem = (index: number) => {
    const newItems = [...cartItems];
    newItems.splice(index, 1);
    setCartItems(newItems);
  };

  const clearCart = () => {
    Alert.alert(
      'Clear Cart',
      'Are you sure you want to remove all items?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            setCartItems([]);
            if (setItems) setItems([]);
          },
        },
      ]
    );
  };

  const generateTextReceipt = () => {
    const receiptText = ReceiptService.generateReceiptText(
      cartItems,
      customerName,
      customerPhone
    );
    Alert.alert('Receipt', receiptText, [{ text: 'OK' }]);
  };

  const generateAndShareReceipt = async () => {
    if (cartItems.length === 0) {
      Alert.alert('Error', 'Your cart is empty!');
      return;
    }

    setShowCheckoutDialog(true);
  };

  const confirmCheckout = async () => {
    setShowCheckoutDialog(false);
    setIsGenerating(true);
    
    try {
      // Generate PDF
      const pdfUri = await ReceiptService.generateReceiptPdf(
        cartItems,
        customerName,
        customerPhone
      );
      
      setIsGenerating(false);
      
      // Navigate to receipt screen
      navigation.navigate('Receipt', { pdfUri });
      
      // Clear cart
      setCartItems([]);
      if (setItems) setItems([]);
      
    } catch (error) {
      console.error('Error generating receipt:', error);
      Alert.alert('Error', 'Failed to generate receipt. Please try again.');
      setIsGenerating(false);
    }
  };

  const renderItem = ({ item, index }: { item: Product; index: number }) => (
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
        right={(props) => (
          <Button
            {...props}
            icon="delete"
            onPress={() => removeItem(index)}
            color="#ef4444"
            size={20}
          />
        )}
      />
    </Card>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your Cart</Text>
      
      {cartItems.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Your cart is empty</Text>
          <Text style={styles.emptySubtext}>
            Scan products to add them to your cart
          </Text>
          <Button
            mode="contained"
            onPress={() => navigation.goBack()}
            style={styles.emptyButton}
          >
            Back to Scanner
          </Button>
        </View>
      ) : (
        <>
          <FlatList
            data={cartItems}
            renderItem={renderItem}
            keyExtractor={(item, index) => `${item.id}-${index}`}
            contentContainerStyle={styles.listContainer}
          />

          <View style={styles.summaryContainer}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Items:</Text>
              <Text style={styles.summaryValue}>{cartItems.length}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal:</Text>
              <Text style={styles.summaryValue}>${calculateSubtotal().toFixed(2)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Tax (18%):</Text>
              <Text style={styles.summaryValue}>${calculateTax().toFixed(2)}</Text>
            </View>
            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text style={[styles.summaryLabel, styles.totalLabel]}>TOTAL:</Text>
              <Text style={[styles.summaryValue, styles.totalValue]}>
                ${calculateTotal().toFixed(2)}
              </Text>
            </View>
          </View>

          <View style={styles.buttonsContainer}>
            <Button
              mode="outlined"
              onPress={clearCart}
              style={styles.button}
              textColor="#ef4444"
            >
              Clear Cart
            </Button>
            
            <Button
              mode="outlined"
              onPress={generateTextReceipt}
              style={styles.button}
            >
              View Text Receipt
            </Button>
            
            <Button
              mode="contained"
              onPress={generateAndShareReceipt}
              style={styles.button}
              loading={isGenerating}
              disabled={isGenerating}
            >
              Generate PDF Receipt
            </Button>
          </View>
        </>
      )}

      {/* Checkout Dialog */}
      <Portal>
        <Dialog
          visible={showCheckoutDialog}
          onDismiss={() => setShowCheckoutDialog(false)}
          style={styles.dialog}
        >
          <Dialog.Title style={styles.dialogTitle}>Checkout</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Customer Name"
              value={customerName}
              onChangeText={setCustomerName}
              style={styles.input}
              mode="outlined"
            />
            <TextInput
              label="Phone Number (optional)"
              value={customerPhone}
              onChangeText={setCustomerPhone}
              style={styles.input}
              mode="outlined"
              keyboardType="phone-pad"
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowCheckoutDialog(false)} mode="text">
              Cancel
            </Button>
            <Button onPress={confirmCheckout} mode="contained">
              Confirm
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
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
  listContainer: {
    paddingBottom: 20,
  },
  itemCard: {
    marginBottom: 12,
    elevation: 2,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 20,
    color: '#666',
    marginBottom: 10,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginBottom: 30,
  },
  emptyButton: {
    marginTop: 20,
  },
  summaryContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
    elevation: 2,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#666',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    marginTop: 8,
    paddingTop: 12,
  },
  totalLabel: {
    fontWeight: 'bold',
    color: '#333',
  },
  totalValue: {
    fontWeight: 'bold',
    color: '#10B981',
    fontSize: 18,
  },
  buttonsContainer: {
    flexDirection: 'column',
    gap: 12,
  },
  button: {
    paddingVertical: 8,
  },
  dialog: {
    maxWidth: '90%',
    alignSelf: 'center',
  },
  dialogTitle: {
    textAlign: 'center',
    color: '#10B981',
  },
  input: {
    marginBottom: 10,
  },
});

export default CartScreen;
