import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { BlurView } from 'expo-blur';
import { Tab, Language } from '../types';
import { Camera, Settings as SettingsIcon, History } from 'lucide-react-native';
import { translations } from '../utils/translations';

interface NavigationProps {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  onCameraClick: () => void;
  language?: Language;
}

const Navigation: React.FC<NavigationProps> = ({ 
  activeTab, 
  setActiveTab, 
  onCameraClick, 
  language = 'en' 
}) => {
  const t = translations[language];
  const slideAnim = useRef(new Animated.Value(100)).current; // Начальная позиция (скрыто внизу)

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: 0,
      friction: 8,
      tension: 40,
      useNativeDriver: true,
    }).start();
  }, []);

  const getNavState = () => {
    switch (activeTab) {
      case Tab.TIMELINE:
        return { label: t.navHome, action: () => setActiveTab(Tab.HOME) };
      case Tab.CALENDAR:
        return { label: t.navHome, action: () => setActiveTab(Tab.HOME) };
      case Tab.SETTINGS:
        return { label: t.navBack, action: () => setActiveTab(Tab.HOME) };
      case Tab.HOME:
      default:
        return { label: t.navChronology, action: () => setActiveTab(Tab.TIMELINE) };
    }
  };

  const { label, action } = getNavState();

  return (
    <Animated.View style={[styles.container, { transform: [{ translateY: slideAnim }] }]}>
      {/* Тень вынесена на отдельный View, чтобы не конфликтовать с overflow: hidden */}
      <View style={styles.shadowWrapper}>
        <View style={styles.navContainer}>
          <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
          
          <TouchableOpacity
            onPress={action}
            style={styles.navButton}
            activeOpacity={0.7}
          >
            {activeTab === Tab.HOME && <History size={18} color="rgba(255, 255, 255, 0.8)" />}
            <Text style={styles.navButtonText}>{label}</Text>
          </TouchableOpacity>

          {activeTab === Tab.HOME && (
            <>
              <TouchableOpacity
                onPress={() => setActiveTab(Tab.SETTINGS)}
                style={styles.settingsButton}
                activeOpacity={0.7}
              >
                <SettingsIcon size={18} color="rgba(255, 255, 255, 0.8)" />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={onCameraClick}
                style={styles.cameraButton}
                activeOpacity={0.8}
              >
                <Camera size={22} color="#2d2a29" strokeWidth={2.5} />
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 40, // Отступ от низа для iPhone (Safe Area)
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 100,
  },
  shadowWrapper: {
    // Тень теперь "живет" здесь
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 20,
  },
  navContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(45, 42, 41, 0.85)',
    paddingLeft: 20,
    paddingRight: 8,
    paddingVertical: 8,
    borderRadius: 35, // Глубокое закругление
    overflow: 'hidden', // Обрезает BlurView точно по границам
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  navButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: 'white',
  },
  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
});

export default Navigation;
