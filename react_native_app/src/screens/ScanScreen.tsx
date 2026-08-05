import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Alert, Image, Platform } from 'react-native';
import { Camera } from 'expo-camera';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { Button, Card, ActivityIndicator, Portal, Dialog } from 'react-native-paper';
import useCamera from '../hooks/useCamera';
import useOCR from '../hooks/useOCR';
import { productService } from '../services/productService';
import ReceiptService from '../services/receiptService';
import { Product } from '../types';

type ScanScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Scan'>;
};

const ScanScreen: React.FC<ScanScreenProps> = ({ navigation }) => {
  const {
    hasPermission,
    cameraRef,
    type,
    isPreviewVisible,
    capturedImage,
    takePicture,
    pickFromGallery,
    switchCamera,
    dismissPreview,
  } = useCamera();

  const {
    isProcessing,
    error,
    result,
    extractTextFromImage,
    clearResult,
  } = useOCR();

  const [cartItems, setCartItems] = useState<Product[]>([]);
  const [statusMessage, setStatusMessage] = useState('Point camera at product labels');
  const [showResultDialog, setShowResultDialog] = useState(false);
  const [customerName, setCustomerName] = useState('Customer');
  const [customerPhone, setCustomerPhone] = useState('');

  // Calculate cart total
  const cartTotal = cartItems.reduce((sum, item) => sum + item.price, 0);

  useEffect(() => {
    if (result) {
      setStatusMessage(`Detected: ${result.matchedProduct?.short_name || result.rawOcrInfo.brand}`);
      setShowResultDialog(true);
    }
  }, [result]);

  useEffect(() => {
    if (error) {
      setStatusMessage(error);
      setTimeout(() => setStatusMessage('Point camera at product labels'), 3000);
    }
  }, [error]);

  const handleCapture = async () => {
    if (isProcessing) return;
    
    setStatusMessage('Capturing...');
    await takePicture();
    
    if (capturedImage) {
      setStatusMessage('Processing with AI...');
      await extractTextFromImage(capturedImage);
    }
  };

  const handleGalleryPick = async () => {
    if (isProcessing) return;
    
    setStatusMessage('Selecting image...');
    await pickFromGallery();
    
    if (capturedImage) {
      setStatusMessage('Processing with AI...');
      await extractTextFromImage(capturedImage);
    }
  };

  const handleAddToCart = () => {
    if (result?.matchedProduct) {
      setCartItems([...cartItems, result.matchedProduct]);
      setStatusMessage(`Added to cart: ${result.matchedProduct.short_name}`);
      clearResult();
      setShowResultDialog(false);
      dismissPreview();
      
      setTimeout(() => setStatusMessage('Point camera at product labels'), 2000);
    }
    setShowResultDialog(false);
  };

  const handleSkip = () => {
    clearResult();
    setShowResultDialog(false);
    dismissPreview();
    setStatusMessage('Point camera at product labels');
  };

  const viewCart = () => {
    navigation.navigate('Cart' as never, {
      items: cartItems,
      setItems: setCartItems,
    } as never);
  };

  const viewProducts = () => {
    navigation.navigate('Products' as never);
  };

  const generateAndShareReceipt = async () => {
    if (cartItems.length === 0) {
      Alert.alert('Error', 'Your cart is empty!');
      return;
    }

    setStatusMessage('Generating receipt...');
    
    try {
      // Generate PDF
      const pdfUri = await ReceiptService.generateReceiptPdf(
        cartItems,
        customerName,
        customerPhone
      );
      
      setStatusMessage('Receipt generated!');
      
      // Navigate to receipt screen
      navigation.navigate('Receipt' as never, { pdfUri } as never);
      
      // Clear cart
      setCartItems([]);
      setStatusMessage('Point camera at product labels');
      
    } catch (error) {
      console.error('Error generating receipt:', error);
      Alert.alert('Error', 'Failed to generate receipt. Please try again.');
      setStatusMessage('Point camera at product labels');
    }
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
          onPress: () => setCartItems([]),
        },
      ]
    );
  };

  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <ActivityIndicator animating={true} size="large" color="#10B981" />
        <Text style={styles.loadingText}>Requesting camera permission...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No access to camera</Text>
        <Button mode="contained" onPress={viewProducts} style={styles.button}>
          View Products
        </Button>
        <Button mode="text" onPress={viewCart} style={styles.button}>
          View Cart ({cartItems.length})
        </Button>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {isPreviewVisible && capturedImage ? (
        <View style={styles.previewContainer}>
          <Image source={{ uri: capturedImage }} style={styles.previewImage} />
          <View style={styles.previewButtons}>
            <Button mode="text" onPress={dismissPreview}>
              Retake
            </Button>
            <Button mode="contained" onPress={handleCapture} disabled={isProcessing}>
              {isProcessing ? 'Processing...' : 'Use Photo'}
            </Button>
          </View>
        </View>
      ) : (
        <>
          <Camera
            style={styles.camera}
            type={type}
            ref={cameraRef}
            ratio="4:3"
            pictureSize="1024x768"
            useCamera2Api={Platform.OS === 'android'}
          >
            <View style={styles.cameraOverlay}>
              {/* Header with status and cart */}
              <View style={styles.header}>
                <Text style={styles.statusText} numberOfLines={1}>
                  {statusMessage}
                </Text>
                {cartItems.length > 0 && (
                  <TouchableOpacity style={styles.cartButton} onPress={viewCart}>
                    <Text style={styles.cartButtonText}>
                      🛒 {cartItems.length} | ${cartTotal.toFixed(2)}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Camera frame */}
              <View style={styles.cameraFrame} />

              {/* Controls */}
              <View style={styles.controls}>
                <TouchableOpacity style={styles.controlButton} onPress={switchCamera}>
                  <Text style={styles.controlButtonText}>🔄</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.captureButton}
                  onPress={handleCapture}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <ActivityIndicator animating={true} color="#fff" />
                  ) : (
                    <Text style={styles.captureButtonText}>📷</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity style={styles.controlButton} onPress={handleGalleryPick}>
                  <Text style={styles.controlButtonText}>📁</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Camera>
        </>
      )}

      {/* Result Dialog */}
      <Portal>
        <Dialog
          visible={showResultDialog}
          onDismiss={() => setShowResultDialog(false)}
          style={styles.dialog}
        >
          <Dialog.Title style={styles.dialogTitle}>
            {result?.matchedProduct ? 'Product Detected' : 'No Match Found'}
          </Dialog.Title>
          
          <Dialog.Content>
            {result?.matchedProduct ? (
              <>
                <View style={styles.resultItem}>
                  <Text style={styles.resultBrand}>{result.matchedProduct.brand}</Text>
                  <Text style={styles.resultName}>{result.matchedProduct.short_name}</Text>
                  <Text style={styles.resultVariant}>{result.matchedProduct.variant}</Text>
                  <Text style={styles.resultPrice}>${result.matchedProduct.price.toFixed(2)}</Text>
                </View>
                <View style={styles.resultMeta}>
                  <Text style={styles.resultLabel}>Confidence:</Text>
                  <Text style={styles.resultValue}>
                    {(result.confidenceScore * 100).toFixed(1)}%
                  </Text>
                </View>
                {result.rawOcrInfo.brand && (
                  <View style={styles.resultMeta}>
                    <Text style={styles.resultLabel}>Detected:</Text>
                    <Text style={styles.resultValue}>
                      {result.rawOcrInfo.brand} - {result.rawOcrInfo.productName}
                    </Text>
                  </View>
                )}
              </>
            ) : (
              <>
                <Text style={styles.noMatchText}>
                  No product matched the detected text.
                </Text>
                <View style={styles.resultMeta}>
                  <Text style={styles.resultLabel}>Brand:</Text>
                  <Text style={styles.resultValue}>{result?.rawOcrInfo.brand || 'Unknown'}</Text>
                </View>
                <View style={styles.resultMeta}>
                  <Text style={styles.resultLabel}>Product:</Text>
                  <Text style={styles.resultValue}>{result?.rawOcrInfo.productName || 'Unknown'}</Text>
                </View>
                {result?.rawOcrInfo.quantity && (
                  <View style={styles.resultMeta}>
                    <Text style={styles.resultLabel}>Quantity:</Text>
                    <Text style={styles.resultValue}>{result.rawOcrInfo.quantity}</Text>
                  </View>
                )}
              </>
            )}
          </Dialog.Content>
          
          <Dialog.Actions>
            {result?.matchedProduct && (
              <Button onPress={handleAddToCart} mode="contained">
                Add to Cart
              </Button>
            )}
            <Button onPress={handleSkip} mode="text">
              {result?.matchedProduct ? 'Skip' : 'Close'}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Loading Overlay */}
      {isProcessing && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator animating={true} size="large" color="#10B981" />
          <Text style={styles.loadingText}>Processing with AI...</Text>
        </View>
      )}

      {/* Cart Floating Button (if cart has items) */}
      {cartItems.length > 0 && !isPreviewVisible && (
        <TouchableOpacity style={styles.floatingCart} onPress={viewCart}>
          <View style={styles.floatingCartContent}>
            <Text style={styles.floatingCartIcon}>🛒</Text>
            <Text style={styles.floatingCartText}>{cartItems.length}</Text>
          </View>
          <Text style={styles.floatingCartTotal}>${cartTotal.toFixed(2)}</Text>
        </TouchableOpacity>
      )}

      {/* Checkout Button (if cart has items) */}
      {cartItems.length > 0 && !isPreviewVisible && (
        <TouchableOpacity 
          style={styles.checkoutButton} 
          onPress={generateAndShareReceipt}
        >
          <Text style={styles.checkoutButtonText}>Checkout</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
  },
  statusText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    flex: 1,
  },
  cartButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 10,
    borderRadius: 20,
    marginLeft: 10,
  },
  cartButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  cameraFrame: {
    flex: 1,
    borderWidth: 2,
    borderColor: '#10B981',
    borderRadius: 10,
    margin: 20,
    backgroundColor: 'transparent',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  controlButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlButtonText: {
    color: '#fff',
    fontSize: 24,
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#fff',
  },
  captureButtonText: {
    color: '#fff',
    fontSize: 32,
  },
  previewContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewImage: {
    width: '100%',
    height: '70%',
    resizeMode: 'contain',
  },
  previewButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    padding: 20,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 10,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 16,
    textAlign: 'center',
    padding: 20,
  },
  button: {
    marginVertical: 5,
  },
  dialog: {
    maxWidth: '90%',
    alignSelf: 'center',
  },
  dialogTitle: {
    textAlign: 'center',
    color: '#10B981',
  },
  resultItem: {
    alignItems: 'center',
    padding: 10,
    marginBottom: 15,
  },
  resultBrand: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  resultName: {
    fontSize: 16,
    color: '#666',
    marginBottom: 5,
  },
  resultVariant: {
    fontSize: 14,
    color: '#999',
    marginBottom: 10,
  },
  resultPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#10B981',
  },
  resultMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  resultLabel: {
    fontSize: 14,
    color: '#666',
  },
  resultValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  noMatchText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 15,
  },
  floatingCart: {
    position: 'absolute',
    bottom: 80,
    right: 20,
    backgroundColor: '#10B981',
    borderRadius: 30,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  floatingCartContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  floatingCartIcon: {
    fontSize: 20,
    marginRight: 5,
  },
  floatingCartText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  floatingCartTotal: {
    position: 'absolute',
    bottom: -25,
    right: 0,
    backgroundColor: '#fff',
    padding: 5,
    borderRadius: 15,
    fontSize: 12,
    fontWeight: 'bold',
    color: '#10B981',
    elevation: 3,
  },
  checkoutButton: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: '#10B981',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  checkoutButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default ScanScreen;
