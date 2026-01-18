import React from 'react';
import { 
  View, Text, StyleSheet, ScrollView, Pressable, Switch, 
  Dimensions, Platform 
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

// Компонент отдельного пункта настройки
const SettingItem = ({ icon, title, value, type = 'chevron', onValueChange, onPress, color = '#5C3A3A' }: any) => (
  <Pressable 
    onPress={() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onPress?.();
    }}
    style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}
  >
    <View style={[styles.iconContainer, { backgroundColor: color + '15' }]}>
      <Ionicons name={icon} size={20} color={color} />
    </View>
    <Text style={styles.itemTitle}>{title}</Text>
    
    {type === 'chevron' && (
      <View style={styles.rightContent}>
        {value && <Text style={styles.itemValue}>{value}</Text>}
        <Ionicons name="chevron-forward" size={18} color="#CCC" />
      </View>
    )}
    
    {type === 'switch' && (
      <Switch 
        value={value} 
        onValueChange={onValueChange}
        trackColor={{ false: '#DDD', true: '#5C3A3A' }}
        thumbColor={Platform.OS === 'ios' ? undefined : '#FFF'}
      />
    )}
  </Pressable>
);

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const [notifications, setNotifications] = React.useState(true);

  return (
    <View style={styles.container}>
      <ScrollView 
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.header}>Настройки</Text>

        {/* Блок: Пара */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Наша пара</Text>
          <BlurView intensity={30} tint="light" style={styles.card}>
            <SettingItem 
              icon="person-outline" 
              title="Имя партнера" 
              value="Александра" 
            />
            <View style={styles.separator} />
            <SettingItem 
              icon="calendar-outline" 
              title="Дата начала" 
              value="12.05.2023" 
            />
            <View style={styles.separator} />
            <SettingItem 
              icon="heart-dislike-outline" 
              title="Разорвать связь" 
              color="#FF4B4B" 
            />
          </BlurView>
        </View>

        {/* Блок: Приложение */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Приложение</Text>
          <BlurView intensity={30} tint="light" style={styles.card}>
            <SettingItem 
              icon="notifications-outline" 
              title="Уведомления" 
              type="switch"
              value={notifications}
              onValueChange={setNotifications}
            />
            <View style={styles.separator} />
            <SettingItem 
              icon="lock-closed-outline" 
              title="Код-пароль / FaceID" 
              value="Выкл"
            />
            <View style={styles.separator} />
            <SettingItem 
              icon="color-palette-outline" 
              title="Тема оформления" 
              value="Кофейная"
            />
          </BlurView>
        </View>

        {/* Блок: Поддержка */}
        <View style={styles.section}>
          <BlurView intensity={30} tint="light" style={styles.card}>
            <SettingItem icon="help-circle-outline" title="Помощь" />
            <View style={styles.separator} />
            <SettingItem icon="star-outline" title="Оценить нас" />
          </BlurView>
        </View>

        <Text style={styles.version}>LoveNative v1.0.0 — Сделано с любовью</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FDF7F2' },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 120 },
  header: { 
    fontSize: 34, 
    fontWeight: '700', 
    color: '#1a1a1a', 
    marginBottom: 30,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'InterBold' 
  },
  section: { marginBottom: 25 },
  sectionTitle: { 
    fontSize: 13, 
    fontWeight: '700', 
    color: 'rgba(0,0,0,0.3)', 
    textTransform: 'uppercase', 
    letterSpacing: 1,
    marginLeft: 10,
    marginBottom: 10 
  },
  card: { 
    borderRadius: 24, 
    overflow: 'hidden', 
    backgroundColor: 'rgba(255,255,255,0.4)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.7)'
  },
  item: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 16,
  },
  itemPressed: { backgroundColor: 'rgba(0,0,0,0.03)' },
  iconContainer: { 
    width: 36, 
    height: 36, 
    borderRadius: 10, 
    justifyContent: 'center', 
    alignItems: 'center',
    marginRight: 15 
  },
  itemTitle: { flex: 1, fontSize: 16, color: '#2A2A2A', fontWeight: '500' },
  rightContent: { flexDirection: 'row', alignItems: 'center' },
  itemValue: { fontSize: 15, color: '#888', marginRight: 8 },
  separator: { height: 1, backgroundColor: 'rgba(0,0,0,0.05)', marginLeft: 65 },
  version: { 
    textAlign: 'center', 
    color: '#BBB', 
    fontSize: 12, 
    marginTop: 20 
  }
});