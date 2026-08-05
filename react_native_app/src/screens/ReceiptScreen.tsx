import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text, Share, Alert, Platform, Linking } from 'react-native';
import { Button, Card, ActivityIndicator } from 'react-native-paper';
import { useRoute, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import ReceiptService from '../services/receiptService';

type ReceiptScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Receipt'>;
  route: any;
};

const ReceiptScreen: React.FC<ReceiptScreenProps> = ({ route, navigation }) => {
  const { pdfUri } = route.params || {};
  const [receiptText, setReceiptText] = useState('');
  const [isSharing, setIsSharing] = useState(false);
  const [isCheckingFile, setIsCheckingFile] = useState(true);
  const [fileExists, setFileExists] = useState(false);

  useEffect(() => {
    if (pdfUri) {
      checkFileExists();
      // Generate text receipt for display
      const text = ReceiptService.generateReceiptText([], 'Customer', '');
      setReceiptText(text);
    }
  }, [pdfUri]);

  const checkFileExists = async () => {
    try {
      const fileInfo = await FileSystem.getInfoAsync(pdfUri);
      setFileExists(fileInfo.exists);
    } catch (error) {
      console.error('Error checking file:', error);
      setFileExists(false);
    } finally {
      setIsCheckingFile(false);
    }
  };

  const shareReceipt = async () => {
    if (!pdfUri) return;

    setIsSharing(true);
    
    try {
      // Check if the file exists
      const fileInfo = await FileSystem.getInfoAsync(pdfUri);
      
      if (fileInfo.exists) {
        // Share the PDF
        await Sharing.shareAsync(pdfUri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Share Receipt',
          UTI: 'com.adobe.pdf',
        });
      } else {
        Alert.alert('Error', 'Receipt file not found.');
      }
    } catch (error) {
      console.error('Error sharing receipt:', error);
      Alert.alert('Error', 'Failed to share receipt.');
    } finally {
      setIsSharing(false);
    }
  };

  const openFileLocation = async () => {
    if (!pdfUri) return;
    
    try {
      const fileInfo = await FileSystem.getInfoAsync(pdfUri);
      
      if (fileInfo.exists) {
        // On Android, we can try to open the file
        if (Platform.OS === 'android') {
          try {
            await Linking.openURL(`file://${pdfUri}`);
          } catch (e) {
            Alert.alert(
              'File Location',
              `Receipt saved at:\n${pdfUri}`,
              [{ text: 'OK' }]
            );
          }
        } else {
          Alert.alert(
            'File Location',
            `Receipt saved at:\n${pdfUri}`,
            [{ text: 'OK' }]
          );
        }
      }
    } catch (error) {
      console.error('Error getting file info:', error);
    }
  };

  const extractFileName = (uri: string) => {
    return uri.split('/').pop() || 'receipt.pdf';
  };

  const goBackToScan = () => {
    navigation.navigate('Scan');
  };

  const goToCart = () => {
    navigation.navigate('Cart' as never, {
      items: [],
      setItems: () => {},
    } as never);
  };

  if (isCheckingFile) {
    return (
      <View style={styles.container}>
        <ActivityIndicator animating={true} size="large" color="#10B981" />
        <Text style={styles.loadingText}>Checking receipt file...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Receipt Generated!</Text>
      
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>🧾</Text>
          </View>
          
          {fileExists ? (
            <>
              <Text style={styles.successText}>
                Your receipt has been successfully generated and saved!
              </Text>
              
              <Text style={styles.fileInfo}>
                File: {extractFileName(pdfUri)}
              </Text>
              
              <Text style={styles.instructions}>
                You can share it with others or view it in your files.
              </Text>
            </>
          ) : (
            <>
              <Text style={styles.errorText}>
                Receipt file not found.
              </Text>
              <Text style={styles.instructions}>
                The receipt may not have been saved correctly.
              </Text>
            </>
          )}
        </Card.Content>
      </Card>

      <View style={styles.buttonsContainer}>
        {fileExists && (
          <>
            <Button
              mode="contained"
              onPress={openFileLocation}
              style={styles.button}
              icon="folder-open"
            >
              View File Location
            </Button>
            
            <Button
              mode="contained"
              onPress={shareReceipt}
              style={styles.button}
              loading={isSharing}
              disabled={isSharing}
              icon="share"
            >
              {isSharing ? 'Sharing...' : 'Share Receipt'}
            </Button>
          </>
        )}
        
        <Button
          mode="outlined"
          onPress={goToCart}
          style={styles.button}
          icon="cart"
        >
          View Cart
        </Button>
        
        <Button
          mode="contained"
          onPress={goBackToScan}
          style={styles.button}
          icon="camera"
        >
          Back to Scanner
        </Button>
      </View>
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
  card: {
    marginBottom: 30,
    elevation: 4,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  icon: {
    fontSize: 60,
  },
  successText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
    color: '#333',
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
    color: '#ef4444',
  },
  fileInfo: {
    fontSize: 14,
    textAlign: 'center',
    color: '#666',
    marginBottom: 16,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  instructions: {
    fontSize: 14,
    textAlign: 'center',
    color: '#999',
  },
  buttonsContainer: {
    flex: 1,
    justifyContent: 'center',
    gap: 12,
  },
  button: {
    paddingVertical: 8,
  },
  loadingText: {
    color: '#666',
    fontSize: 14,
    marginTop: 10,
    textAlign: 'center',
  },
});

export default ReceiptScreen;
