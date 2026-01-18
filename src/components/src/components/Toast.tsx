import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { BlurView } from 'expo-blur';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  visible: boolean;
  onHide: () => void;
  duration?: number;
}

export const Toast: React.FC<ToastProps> = ({ 
  message, 
  type = 'info', 
  visible, 
  onHide,
  duration = 3000 
}) => {
  const opacity = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();

      const timer = setTimeout(() => {
        Animated.timing(opacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }).start(() => {
          onHide();
        });
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [visible, duration, onHide, opacity]);

  if (!visible) return null;

  const getBackgroundColor = () => {
    switch (type) {
      case 'success': return 'rgba(34, 197, 94, 0.9)';
      case 'error': return 'rgba(239, 68, 68, 0.9)';
      default: return 'rgba(45, 42, 41, 0.9)';
    }
  };

  return (
    <Animated.View 
      style={[
        styles.container,
        { opacity }
      ]}
      pointerEvents="none"
    >
      <BlurView intensity={80} style={styles.blur}>
        <View style={[styles.toast, { backgroundColor: getBackgroundColor() }]}>
          <Text style={styles.text}>{message}</Text>
        </View>
      </BlurView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 1000,
  },
  blur: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  toast: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    minWidth: 200,
    maxWidth: '80%',
  },
  text: {
    color: 'white',
    fontSize: 14,
    fontFamily: 'System',
    fontWeight: '500',
    textAlign: 'center',
  },
});

// Hook для использования Toast
export const useToast = () => {
  const [toast, setToast] = React.useState<{
    message: string;
    type?: 'success' | 'error' | 'info';
    visible: boolean;
  }>({
    message: '',
    type: 'info',
    visible: false,
  });

  const show = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type, visible: true });
  };

  const hide = () => {
    setToast(prev => ({ ...prev, visible: false }));
  };

  return {
    toast,
    show,
    hide,
    success: (message: string) => show(message, 'success'),
    error: (message: string) => show(message, 'error'),
    info: (message: string) => show(message, 'info'),
  };
};

