import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
} from 'react-native';
import { LoveSpaceScreen } from './Main/Dashboard';
import SettingsScreen from './Main/SettingsScreen';
import { TelegramStyleMenu } from '../components/menu';

export default function MainLayout() {
  console.log('[MainLayout] render start');
  const [activeTabIndex, setActiveTabIndex] = useState(0);

  React.useEffect(() => {
    console.log('[MainLayout] activeTabIndex:', activeTabIndex, 'isCameraOpen:', undefined);
  }, [activeTabIndex]);

  const renderContent = () => {
    switch (activeTabIndex) {
      case 0:
        return (
          <LoveSpaceScreen
            route={{ params: { startDate: '2023-05-12' } } as any}
          />
        );
      case 2:
        return <SettingsScreen />;
      default:
        return <View style={{ flex: 1, backgroundColor: '#FDF7F2' }} />;
    }
  };

  return (
    <View
      style={styles.container}
      onLayout={(e) => console.log('[MainLayout] container layout', e.nativeEvent.layout)}
    >
      {/* 1. Контент — абсолютный, заполняет экран */}
      <View style={StyleSheet.absoluteFill}>
        {renderContent()}
      </View>

      {/* 2. Меню — ПОСЛЕДНИЙ элемент, всегда выше */}
      <TelegramStyleMenu
        onTabChange={(index) => {
          console.log('[MainLayout] onTabChange from menu:', index);
          setActiveTabIndex(index)
        }}
      />

      {/* 3. Модальные окна камеры управляет меню */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FDF7F2',
  },
});
