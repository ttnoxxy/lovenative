import React, { useState, useMemo, useCallback, useRef } from 'react';
import { 
  View, 
  Text, 
  Pressable, 
  StyleSheet, 
  useWindowDimensions,
  Platform,
  Modal,
  ImageBackground
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
import { useCameraPermissions } from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

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
  { id: 'dates', icon: 'heart-outline', label: 'Галерея' },
  { id: 'settings', icon: 'settings-outline', label: 'Настройки' },
] as const;

// логируем загрузку модуля (поможет понять, импортируется ли файл вообще)
console.log('[MENU] module loaded');

interface TelegramStyleMenuProps {
  onTabChange?: (index: number) => void;
}

export const TelegramStyleMenu = ({ onTabChange }: TelegramStyleMenuProps) => {
  const { width: windowWidth } = useWindowDimensions(); 
  const insets = useSafeAreaInsets();
  const wrapperStyle = [
    styles.menuWrapper,
    { bottom: Math.max(insets.bottom, 20), paddingBottom: Platform.OS === 'ios' ? 0 : 20 },
  ];

  // отладочные логи: показываем insets, ширину окна и т.д.
  React.useEffect(() => {
    console.log('[MENU] mount/update', {
      insets,
      windowWidth,
      dims: undefined, // dims ещё не определены на этом этапе — будет лог ниже
    });
  }, [insets, windowWidth]);

  const [activeTab, setActiveTab] = useState(0);
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  // логируем dims и активный таб при их изменении
  React.useEffect(() => {
    console.log('[MENU] state', { activeTab, isCameraOpen });
  }, [activeTab, isCameraOpen]);

  const navigation = useNavigation<NativeStackNavigationProp<any>>(); // навигация

  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<any>(null);
  const [cameraType, setCameraType] = useState<'back' | 'front'>('back');
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [CameraLoaded, setCameraLoaded] = useState<any>(null); // загруженный компонент камеры
  const [CameraConstants, setCameraConstants] = useState<any>(null); // возможно содержит .Type

  const dims = useMemo(() => {
    const cameraBtnSize = MENU_CONFIG.BAR_HEIGHT;
    const mainBarWidth = windowWidth - (MENU_CONFIG.SIDE_PADDING * 2) - cameraBtnSize - MENU_CONFIG.GAP;
    const tabWidth = (mainBarWidth - (MENU_CONFIG.INNER_PADDING * 2)) / TABS.length;
    // логируем размеры
    console.log('[MENU] dims calculated', { cameraBtnSize, mainBarWidth, tabWidth, windowWidth });
    return { cameraBtnSize, mainBarWidth, tabWidth };
  }, [windowWidth]);

  const handleTabPress = useCallback((index: number) => {
    setActiveTab(index);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  
    // Теперь мы просто уведомляем родителя о смене индекса
    onTabChange?.(index); 
    
    // Убираем или комментируем:
    // if (selectedTab.id === 'settings') { navigation.navigate('Settings'); }
  }, [onTabChange]);

  const handleCameraPress = useCallback(async () => {
    console.log('[MENU] camera button pressed');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // корректно запрашиваем/проверяем разрешения — используем результат requestPermission
    let currentPerm = permission;
    if (!currentPerm) {
      const res = await requestPermission();
      currentPerm = res;
      console.log('[MENU] requestPermission result', res);
    } else if (!currentPerm.granted) {
      const res = await requestPermission();
      currentPerm = res;
      console.log('[MENU] re-requestPermission result', res);
    }

    if (!currentPerm?.granted) {
      alert('Нет доступа к камере');
      return;
    }

    setPreviewUri(null);

    // динамически импортируем модуль камеры при первом открытии
    if (!CameraLoaded) {
      try {
        console.log('[MENU] importing expo-camera module...');
        const mod = await import('expo-camera');
        console.log('[MENU] expo-camera module keys:', Object.keys(mod));

        // выбор корректного компонента Camera из разных форм экспорта
        let Comp: any = null;
        if (typeof mod.Camera === 'function' || typeof mod.Camera === 'object') Comp = mod.Camera;
        else if (mod.default && (typeof mod.default === 'function' || typeof mod.default === 'object')) {
          // иногда экспорт по умолчанию содержит Camera внутри
          Comp = (mod.default.Camera) ? mod.default.Camera : mod.default;
        } else if (typeof mod === 'function' || typeof mod === 'object') {
          Comp = (mod as any).Camera ?? (mod as any).default ?? mod;
        }

        const Consts = (mod.Camera && (mod.Camera as any).Constants) ?? (mod.default && (mod.default as any).Constants) ?? (mod as any).Constants ?? null;
        console.log('[MENU] determined Camera component:', !!Comp, 'Constants:', !!Consts);

        if (!Comp) {
          throw new Error('Camera component not found in expo-camera module');
        }

        setCameraLoaded(() => Comp);
        setCameraConstants(() => Consts);
      } catch (err) {
        console.error('[MENU] failed to import expo-camera', err);
        alert('Не удалось загрузить камеру');
        return;
      }
    }
    setIsCameraOpen(true);
  }, [permission, requestPermission, CameraLoaded]);

  const handleTakePhoto = useCallback(async () => {
    if (!cameraRef.current) return;
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.7, skipProcessing: true });
      console.log('[MENU] photo taken', photo.uri);
      setPreviewUri(photo.uri);
      // Сохраняем автоматически
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status === 'granted') {
        setSaving(true);
        await MediaLibrary.createAssetAsync(photo.uri);
        setSaving(false);
        alert('Фото сохранено в галерею');
      } else {
        alert('Нет доступа к галерее');
      }
    } catch (err) {
      console.error(err);
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
      <View
        style={wrapperStyle}
        onLayout={(e) => {
          console.log('[MENU] layout', e.nativeEvent.layout);
        }}
      >
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
        <View style={{ flex: 1, backgroundColor: '#000' }}>
          {/* Верхняя панель: Закрыть и Переключить */}
          <View style={{ position: 'absolute', top: 40, left: 16, right: 16, zIndex: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Pressable onPress={() => setIsCameraOpen(false)} style={{ padding: 8 }}>
              <Ionicons name="close" size={32} color="#fff" />
            </Pressable>
            <Pressable onPress={handleFlipCamera} style={{ padding: 8 }}>
              <Ionicons name="camera-reverse" size={32} color="#fff" />
            </Pressable>
          </View>

          {/* Видоискатель */}
          <View style={{ flex: 1 }}>
            {!permission?.granted ? (
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <Ionicons name="camera" size={48} color="#888" />
                <Text style={{ color: '#fff', marginTop: 12 }}>Требуется доступ к камере</Text>
                <Pressable onPress={async () => { await requestPermission(); }} style={{ marginTop: 12 }}>
                  <Text style={{ color: '#fff', textDecorationLine: 'underline' }}>Запросить разрешение</Text>
                </Pressable>
              </View>
            ) : (
              // рендерим только если динамический компонент успешно загружен
              CameraLoaded ? (
                (() => {
                  // вычисляем корректный проп type: используем Constants.Type если доступно
                  const typeProp = CameraConstants && CameraConstants.Type
                    ? (cameraType === 'back' ? CameraConstants.Type.back : CameraConstants.Type.front)
                    : (cameraType as any);

                  return (
                    <CameraLoaded
                      style={{ flex: 1 }}
                      ref={cameraRef as any}
                      type={typeProp}
                    />
                  );
                })()
              ) : (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                  <Text style={{ color: '#fff' }}>Загрузка камеры...</Text>
                </View>
              )
            )}
          </View>

          {/* Нижняя панель: превью и кнопка съемки */}
          <View style={{ position: 'absolute', bottom: 30, left: 16, right: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ width: 60, height: 60, borderRadius: 8, backgroundColor: '#222', overflow: 'hidden' }}>
              {previewUri ? <ImageBackground source={{ uri: previewUri }} style={{ flex: 1 }} /> : null}
            </View>

            <Pressable onPress={handleTakePhoto} style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }, styles.captureButton]}>
              <View style={styles.innerCapture} />
            </Pressable>

            <View style={{ width: 60 }} />
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
    bottom: 0,
    alignItems: 'center',
    zIndex: 1000,
    elevation: 20,
    paddingBottom: 0, // динамический bottom/paddingBottom задаём внутри компонента
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
