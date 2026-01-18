import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { X, Camera as CameraIcon } from 'lucide-react-native';
import { Language } from '../types';

interface CameraModalProps {
  onPhotoTaken: (uri: string) => void;
  onClose: () => void;
  language?: Language;
}

const CameraModal: React.FC<CameraModalProps> = ({ onPhotoTaken, onClose, language = 'ru' }) => {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  if (!permission) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionTitle}>
            {language === 'ru' ? 'Нужен доступ к камере' : 'Camera access required'}
          </Text>
          <Text style={styles.permissionText}>
            {language === 'ru' 
              ? 'Разрешите доступ к камере, чтобы делать фото' 
              : 'Allow camera access to take photos'}
          </Text>
          <TouchableOpacity
            onPress={requestPermission}
            style={styles.permissionButton}
            activeOpacity={0.8}
          >
            <Text style={styles.permissionButtonText}>
              {language === 'ru' ? 'Разрешить' : 'Allow'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onClose}
            style={styles.cancelButton}
            activeOpacity={0.8}
          >
            <Text style={styles.cancelButtonText}>
              {language === 'ru' ? 'Отмена' : 'Cancel'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const takePhoto = async () => {
    if (cameraRef.current && !isCapturing) {
      try {
        setIsCapturing(true);
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          base64: false,
        });
        
        if (photo && photo.uri) {
          onPhotoTaken(photo.uri);
        }
      } catch (error) {
        console.error('Ошибка съемки:', error);
        Alert.alert(
          language === 'ru' ? 'Ошибка' : 'Error',
          language === 'ru' ? 'Не удалось сделать фото' : 'Failed to take photo'
        );
      } finally {
        setIsCapturing(false);
      }
    }
  };

  return (
    <View style={styles.fullScreen}>
      <CameraView style={StyleSheet.absoluteFill} ref={cameraRef} facing="back" />
      
      {/* Controls overlay */}
      <View style={styles.controls}>
        <TouchableOpacity
          onPress={onClose}
          style={styles.closeButton}
          activeOpacity={0.8}
        >
          <X size={28} color="white" strokeWidth={2.5} />
        </TouchableOpacity>

        <View style={styles.bottomControls}>
          <TouchableOpacity
            onPress={takePhoto}
            style={styles.captureButton}
            activeOpacity={0.8}
            disabled={isCapturing}
          >
            {isCapturing ? (
              <ActivityIndicator size="large" color="#fff" />
            ) : (
              <View style={styles.captureButtonInner}>
                <CameraIcon size={32} color="#2d2a29" strokeWidth={2} />
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
    backgroundColor: '#000',
  },
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  controls: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
    zIndex: 10,
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 24,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  bottomControls: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  captureButtonInner: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  permissionContainer: {
    padding: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 24,
    alignItems: 'center',
    maxWidth: 320,
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 16,
    textAlign: 'center',
  },
  permissionText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 32,
    textAlign: 'center',
    lineHeight: 24,
  },
  permissionButton: {
    backgroundColor: '#e8b4a2',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 24,
    width: '100%',
    marginBottom: 12,
  },
  permissionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    textAlign: 'center',
  },
  cancelButton: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 24,
    width: '100%',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
  },
});

export default CameraModal;
