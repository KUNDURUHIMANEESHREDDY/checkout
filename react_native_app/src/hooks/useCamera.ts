import { useState, useEffect, useRef } from 'react';
import { Camera, CameraType, CameraRecordingOptions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';

export interface CameraHookResult {
  hasPermission: boolean | null;
  cameraRef: React.RefObject<Camera>;
  type: CameraType;
  isPreviewVisible: boolean;
  capturedImage: string | null;
  takePicture: () => Promise<void>;
  pickFromGallery: () => Promise<void>;
  switchCamera: () => void;
  dismissPreview: () => void;
}

export const useCamera = (): CameraHookResult => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [type, setType] = useState<CameraType>(CameraType.back);
  const [isPreviewVisible, setIsPreviewVisible] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const cameraRef = useRef<Camera>(null);

  useEffect(() => {
    (async () => {
      const { status: cameraStatus } = await Camera.requestCameraPermissionsAsync();
      const { status: mediaStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      setHasPermission(cameraStatus === 'granted' && mediaStatus === 'granted');
    })();
  }, []);

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          base64: true,
          exif: false,
        });
        
        setCapturedImage(photo.uri);
        setIsPreviewVisible(true);
      } catch (error) {
        console.error('Error taking picture:', error);
      }
    }
  };

  const pickFromGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setCapturedImage(result.assets[0].uri);
        setIsPreviewVisible(true);
      }
    } catch (error) {
      console.error('Error picking from gallery:', error);
    }
  };

  const switchCamera = () => {
    setType(current => 
      current === CameraType.back ? CameraType.front : CameraType.back
    );
  };

  const dismissPreview = () => {
    setIsPreviewVisible(false);
    setCapturedImage(null);
  };

  return {
    hasPermission,
    cameraRef,
    type,
    isPreviewVisible,
    capturedImage,
    takePicture,
    pickFromGallery,
    switchCamera,
    dismissPreview,
  };
};

export default useCamera;
