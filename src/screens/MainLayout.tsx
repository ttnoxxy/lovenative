import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LoveSpaceScreen } from './Main/Dashboard';
import SettingsScreen from './Main/SettingsScreen';
import MemoriesScreen from './Main/Memories';
import { TelegramStyleMenu } from '../components/menu';

export default function MainLayout() {
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const [startDate, setStartDate] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadSavedDate = async () => {
      try {
        const savedDate = await AsyncStorage.getItem('user_start_date');
        if (savedDate) setStartDate(savedDate);
      } catch (e) {
        console.error('Ошибка загрузки даты:', e);
      } finally {
        setIsLoading(false);
      }
    };
    loadSavedDate();
  }, []);

  const handleDateChange = useCallback((newDate: string) => {
    setStartDate(newDate);
  }, []);

  if (isLoading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#5C3A3A" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Все три экрана всегда в памяти, скрываем через display */}

      <View style={[styles.screen, activeTabIndex !== 0 && styles.hidden]}>
        <LoveSpaceScreen
          route={{
            params: { startDate: startDate || '2024-01-01' },
          } as any}
        />
      </View>

      <View style={[styles.screen, activeTabIndex !== 1 && styles.hidden]}>
        <MemoriesScreen />
      </View>

      <View style={[styles.screen, activeTabIndex !== 2 && styles.hidden]}>
        <SettingsScreen
          startDate={startDate}
          onDateChange={handleDateChange}
        />
      </View>

      <TelegramStyleMenu
        onTabChange={(index) => setActiveTabIndex(index)}
        activeTab={activeTabIndex}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FDF7F2',
  },
  screen: {
    ...StyleSheet.absoluteFillObject,
  },
  hidden: {
    display: 'none',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FDF7F2',
  },
});
