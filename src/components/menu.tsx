import React, { useState, useMemo, useCallback, useRef } from 'react';
import { 
  View, 
  Text, 
  Pressable, 
  StyleSheet, 
  useWindowDimensions,
  Platform,
  Modal
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { 
  useAnimatedStyle, 
  withSpring,
  withTiming
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions, CameraType, takePictureAsync } from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';

const MENU_CONFIG = {
  SIDE_PADDING: 16,
  GAP: 12,
  BAR_HEIGHT: 72,
  INNER_PADDING: 5,
  ACTIVE_COLOR: '#1a1a1a',
  INACTIVE_OPACITY: 0.4,
};

const TABS = [
  { id: 'history', icon: 'book-outline', label: 'История' },
  { id: 'dates', icon: 'heart-outline', label: 'Свидания' },
  { id: 'settings', icon: 'settings-outline', label: 'Настройки' },
] as const;

interface TelegramStyleMenuProps {
  onTabChange?: (index: number) => void;
}

export const TelegramStyleMenu = ({ onTabChange }: TelegramStyleMenuProps) => {
  const { width: windowWidth } = useWindowDimensions(); 
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState(0);
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView | null>(null);
  const [cameraType, setCameraType] = useState<'back' | 'front'>('back');

  const dims = useMemo(() => {
    const cameraBtnSize = MENU_CONFIG.BAR_HEIGHT;
    const mainBarWidth = windowWidth - (MENU_CONFIG.SIDE_PADDING * 2) - cameraBtnSize - MENU_CONFIG.GAP;
    const tabWidth = (mainBarWidth - (MENU_CONFIG.INNER_PADDING * 2)) / TABS.length;
    return { cameraBtnSize, mainBarWidth, tabWidth };
  }, [windowWidth]);

  const handleTabPress = useCallback((index: number) => {
    setActiveTab(index);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onTabChange?.(index);
  }, [onTabChange]);

  const handleCameraPress = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (!permission?.granted) {
      const { granted } = await requestPermission();
      if (!granted) {
        alert('Нет доступа к камере');
        return;
      }
    }
    setIsCameraOpen(true);
  }, [permission, requestPermission]);

  const handleTakePhoto = useCallback(async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync();
        const { status } = await MediaLibrary.requestPermissionsAsync();
        if (status === 'granted') {
          await MediaLibrary.createAssetAsync(photo.uri);
          alert('Фото сохранено в галерею');
        } else {
          alert('Нет доступа к галерее');
        }
      } catch (err) {
        console.error(err);
      }
    }
  }, []);

  const handleFlipCamera = useCallback(() => {
    setCameraType(prev => prev === 'back' ? 'front' : 'back');
  }, []);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ 
      translateX: withSpring(
        MENU_CONFIG.INNER_PADDING + activeTab * dims.tabWidth, 
        { damping: 15, stiffness: 150 }
      ) 
    }],
  }));

  return (
    <>
      <View style={[styles.menuWrapper, { bottom: Math.max(insets.bottom, 20) }]}>
        <View style={styles.contentContainer}>
          
          <View style={[styles.mainIsland, { width: dims.mainBarWidth }]}>
            <BlurView intensity={80} tint="extraLight" style={styles.blurContainer}>
              <View style={styles.innerTrack}>
                <Animated.View 
                  style={[styles.activePill, indicatorStyle, { width: dims.tabWidth }]} 
                />
                {TABS.map((tab, index) => (
                  <TabButton
                    key={tab.id}
                    icon={tab.icon}
                    label={tab.label}
                    isActive={activeTab === index}
                    onPress={() => handleTabPress(index)}
                  />
                ))}
              </View>
            </BlurView>
          </View>

          <Pressable 
            onPress={handleCameraPress}
            style={({ pressed }) => [
              styles.cameraButton, 
              { 
                width: dims.cameraBtnSize, 
                height: dims.cameraBtnSize, 
                opacity: pressed ? 0.8 : 1,
                transform: [{ scale: pressed ? 0.95 : 1 }]
              }
            ]}
          >
            <BlurView intensity={90} tint="extraLight" style={styles.cameraBlur}>
              <Ionicons name="camera" size={28} color={MENU_CONFIG.ACTIVE_COLOR} />
            </BlurView>
          </Pressable>

        </View>
      </View>

      {/* Камера */}
      <Modal visible={isCameraOpen} animationType="slide">
        <View style={{ flex: 1 }}>
          <CameraView 
            style={{ flex: 1 }} 
            ref={cameraRef}
            facing={cameraType}
          />

          {/* Кнопка закрытия */}
          <View style={{ position: 'absolute', top: 40, left: 20 }}>
            <Pressable onPress={() => setIsCameraOpen(false)}>
              <Ionicons name="close-circle-outline" size={36} color="#fff" />
            </Pressable>
          </View>

          {/* Кнопка переключения камеры */}
          <View style={{ position: 'absolute', bottom: 100, right: 30 }}>
            <Pressable onPress={handleFlipCamera}>
              <Ionicons name="camera-reverse-outline" size={36} color="#fff" />
            </Pressable>
          </View>

          {/* Кнопка съемки */}
          <View style={{ position: 'absolute', bottom: 50, alignSelf: 'center' }}>
            <Pressable onPress={handleTakePhoto} style={styles.captureButton}>
              <View style={styles.innerCapture} />
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
};

const TabButton = ({ icon, label, isActive, onPress }: any) => {
  const animatedTextStyle = useAnimatedStyle(() => ({
    opacity: withTiming(isActive ? 1 : MENU_CONFIG.INACTIVE_OPACITY),
    transform: [{ scale: withTiming(isActive ? 1 : 0.95) }]
  }));

  return (
    <Pressable onPress={onPress} style={styles.tabItem}>
      <Animated.View style={[styles.tabContent, animatedTextStyle]}>
        <Ionicons 
          name={isActive ? icon.replace('-outline', '') : icon} 
          size={22} 
          color={MENU_CONFIG.ACTIVE_COLOR} 
        />
        <Text style={styles.tabLabel}>{label}</Text>
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  menuWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 100,
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: MENU_CONFIG.SIDE_PADDING,
  },
  mainIsland: {
    height: MENU_CONFIG.BAR_HEIGHT,
    borderRadius: 35,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20 },
      android: { elevation: 8 },
    }),
  },
  blurContainer: {
    flex: 1,
    padding: MENU_CONFIG.INNER_PADDING,
  },
  innerTrack: {
    flex: 1,
    flexDirection: 'row',
  },
  activePill: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    backgroundColor: '#FFF',
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  tabItem: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabContent: {
    alignItems: 'center',
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: MENU_CONFIG.ACTIVE_COLOR,
    marginTop: 2,
  },
  cameraButton: {
    marginLeft: MENU_CONFIG.GAP,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20 },
      android: { elevation: 8 },
    }),
  },
  cameraBlur: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 5,
    borderColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  innerCapture: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#fff',
  },
});
