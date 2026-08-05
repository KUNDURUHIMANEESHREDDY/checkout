import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PaperProvider } from 'react-native-paper';
import ScanScreen from './src/screens/ScanScreen';
import CartScreen from './src/screens/CartScreen';
import ReceiptScreen from './src/screens/ReceiptScreen';
import ProductListScreen from './src/screens/ProductListScreen';
import { Product } from './src/types';

// Define navigation types
export type RootStackParamList = {
  Scan: undefined;
  Cart: {
    items: Product[];
    setItems: (items: Product[]) => void;
  };
  Receipt: {
    pdfUri: string;
  };
  Products: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const App = () => {
  return (
    <SafeAreaProvider>
      <PaperProvider>
        <NavigationContainer>
          <Stack.Navigator
            initialRouteName="Scan"
            screenOptions={{
              headerStyle: {
                backgroundColor: '#10B981',
              },
              headerTintColor: '#fff',
              headerTitleStyle: {
                fontWeight: 'bold',
              },
              animation: 'slide_from_right',
              contentStyle: {
                backgroundColor: '#f5f5f5',
              },
            }}
          >
            <Stack.Screen
              name="Scan"
              component={ScanScreen}
              options={{ 
                title: 'AI Scanner',
                headerBackVisible: false,
              }}
            />
            <Stack.Screen
              name="Cart"
              component={CartScreen}
              options={{ 
                title: 'Your Cart',
                headerBackTitle: 'Back',
              }}
            />
            <Stack.Screen
              name="Receipt"
              component={ReceiptScreen}
              options={{ 
                title: 'Receipt',
                headerBackTitle: 'Back',
              }}
            />
            <Stack.Screen
              name="Products"
              component={ProductListScreen}
              options={{ 
                title: 'Products',
                headerBackTitle: 'Back',
              }}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </PaperProvider>
    </SafeAreaProvider>
  );
};

export default App;
