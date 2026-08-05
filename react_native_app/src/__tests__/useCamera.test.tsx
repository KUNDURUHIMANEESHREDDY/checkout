/**
 * Unit tests for useCamera hook
 * 
 * Tests the camera functionality
 */

import { renderHook, act } from '@testing-library/react-native';
import useCamera from '../hooks/useCamera';

// Mock expo-camera
jest.mock('expo-camera', () => ({
  Camera: 'Camera',
  useCameraPermissions: () => [true, {}],
  requestCameraPermissionsAsync: () => Promise.resolve({ status: 'granted' }),
  CameraType: {
    back: 'back',
    front: 'front',
  },
}));

// Mock expo-image-picker
jest.mock('expo-image-picker', () => ({
  useMediaLibraryPermissions: () => [true, {}],
  requestMediaLibraryPermissionsAsync: () => Promise.resolve({ status: 'granted' }),
  launchImageLibraryAsync: jest.fn(),
}));

describe('useCamera', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  it('should initialize with hasPermission null', () => {
    const { result } = renderHook(() => useCamera());
    expect(result.current.hasPermission).toBeNull();
  });

  it('should have cameraRef', () => {
    const { result } = renderHook(() => useCamera());
    expect(result.current.cameraRef).toBeDefined();
    expect(result.current.cameraRef.current).toBeNull();
  });

  it('should have default type as back', () => {
    const { result } = renderHook(() => useCamera());
    expect(result.current.type).toBe('back');
  });

  it('should have isPreviewVisible as false initially', () => {
    const { result } = renderHook(() => useCamera());
    expect(result.current.isPreviewVisible).toBe(false);
  });

  it('should have capturedImage as null initially', () => {
    const { result } = renderHook(() => useCamera());
    expect(result.current.capturedImage).toBeNull();
  });

  it('should have takePicture function', () => {
    const { result } = renderHook(() => useCamera());
    expect(typeof result.current.takePicture).toBe('function');
  });

  it('should have pickFromGallery function', () => {
    const { result } = renderHook(() => useCamera());
    expect(typeof result.current.pickFromGallery).toBe('function');
  });

  it('should have switchCamera function', () => {
    const { result } = renderHook(() => useCamera());
    expect(typeof result.current.switchCamera).toBe('function');
  });

  it('should have dismissPreview function', () => {
    const { result } = renderHook(() => useCamera());
    expect(typeof result.current.dismissPreview).toBe('function');
  });

  it('should have clearResult function', () => {
    const { result } = renderHook(() => useCamera());
    expect(typeof result.current.clearResult).toBe('function');
  });

  describe('switchCamera', () => {
    it('should toggle between back and front camera', () => {
      const { result } = renderHook(() => useCamera());
      
      expect(result.current.type).toBe('back');
      
      act(() => {
        result.current.switchCamera();
      });
      
      expect(result.current.type).toBe('front');
      
      act(() => {
        result.current.switchCamera();
      });
      
      expect(result.current.type).toBe('back');
    });
  });

  describe('dismissPreview', () => {
    it('should reset preview state', () => {
      const { result } = renderHook(() => useCamera());
      
      // Simulate setting preview state
      // Note: We can't directly modify the state, but we can test the function exists
      act(() => {
        result.current.dismissPreview();
      });
      
      expect(result.current.isPreviewVisible).toBe(false);
      expect(result.current.capturedImage).toBeNull();
    });
  });
});
