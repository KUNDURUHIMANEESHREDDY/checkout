/**
 * Jest setup file for React Native testing
 * 
 * This file is run before each test file.
 * Use it to configure mocks, global variables, etc.
 */

import { configure } from '@testing-library/react-native';

// Mock expo modules that aren't available in test environment
jest.mock('expo-camera', () => ({
  Camera: 'Camera',
  useCameraPermissions: () => [true, {}],
  requestCameraPermissionsAsync: () => Promise.resolve({ status: 'granted' }),
}));

jest.mock('expo-file-system', () => ({
  documentDirectory: '/mock/directory/',
  getInfoAsync: jest.fn().mockResolvedValue({ exists: true, isDirectory: false }),
  writeAsStringAsync: jest.fn().mockResolvedValue(undefined),
  readAsStringAsync: jest.fn().mockResolvedValue('mock content'),
}));

jest.mock('expo-sharing', () => ({
  shareAsync: jest.fn().mockResolvedValue({}),
}));

jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: () => Promise.resolve({ status: 'granted' }),
  launchImageLibraryAsync: jest.fn().mockResolvedValue({
    canceled: false,
    assets: [{ uri: 'mock-uri', type: 'image' }],
  }),
}));

jest.mock('expo-image-manipulator', () => ({
  manipulateAsync: jest.fn().mockResolvedValue({ uri: 'mock-processed-uri' }),
}));

// Mock react-native-paper components
jest.mock('react-native-paper', () => {
  const { View, Text, TouchableOpacity } = require('react-native');
  return {
    ...jest.requireActual('react-native-paper'),
    Button: ({ children, onPress, ...props }) => (
      <TouchableOpacity onPress={onPress} {...props}>
        <Text>{children}</Text>
      </TouchableOpacity>
    ),
    Card: ({ children, ...props }) => <View {...props}>{children}</View>,
    TextInput: ({ value, onChangeText, ...props }) => (
      <Text {...props} onPress={() => onChangeText && onChangeText('test')}>
        {value}
      </Text>
    ),
    Dialog: ({ visible, children, ...props }) => visible ? <View {...props}>{children}</View> : null,
    Portal: ({ children }) => children,
    ActivityIndicator: () => <View testID="activity-indicator" />,
    Avatar: ({ children }) => <View>{children}</View>,
    List: { Icon: () => <View /> },
  };
});

// Mock react-navigation
jest.mock('@react-navigation/native', () => {
  return {
    ...jest.requireActual('@react-navigation/native'),
    useNavigation: () => ({
      navigate: jest.fn(),
      goBack: jest.fn(),
      replace: jest.fn(),
      push: jest.fn(),
    }),
    useRoute: () => ({
      params: {},
    }),
  };
});

jest.mock('@react-navigation/native-stack', () => {
  return {
    ...jest.requireActual('@react-navigation/native-stack'),
    createNativeStackNavigator: () => ({
      Navigator: ({ children }) => children,
      Screen: ({ children }) => children,
    }),
  };
});

// Mock react-native-safe-area-context
jest.mock('react-native-safe-area-context', () => {
  return {
    SafeAreaProvider: ({ children }) => children,
    useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
    useSafeAreaFrame: () => ({ x: 0, y: 0, width: 375, height: 812 }),
  };
});

// Configure testing library
configure({ testIDAttribute: 'testID' });

// Global mock for console methods to reduce noise in tests
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

beforeAll(() => {
  // Suppress console.error and console.warn during tests
  // Comment this out if you want to see warnings/errors
  console.error = jest.fn();
  console.warn = jest.fn();
});

afterAll(() => {
  // Restore console methods
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
});

// Mock Platform for testing
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  return {
    ...RN,
    Platform: {
      ...RN.Platform,
      OS: 'ios', // Default to iOS for tests
      select: jest.fn((objs) => objs.ios),
    },
    Alert: {
      alert: jest.fn(),
    },
  };
});
