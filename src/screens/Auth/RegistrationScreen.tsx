import React, { useState, useMemo, useRef, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet, Dimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { BottomSheetModal, BottomSheetBackdrop, BottomSheetBackdropProps, BottomSheetView } from '@gorhom/bottom-sheet';
import * as Haptics from 'expo-haptics';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing } from 'react-native-reanimated';
import { Image } from 'react-native';

const { width, height } = Dimensions.get('window');

// Настройка русской локали для календаря
LocaleConfig.locales['ru'] = {
  monthNames: ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'],
  monthNamesShort: ['Янв.','Фев.','Мар.','Апр.','Май','Июн.','Июл.','Авг.','Сен.','Окт.','Ноя.','Дек.'],
  dayNames: ['Воскресенье','Понедельник','Вторник','Среда','Четверг','Пятница','Суббота'],
  dayNamesShort: ['Вс','Пн','Вт','Ср','Чт','Пт','Сб'],
  today: 'Сегодня',
};
LocaleConfig.defaultLocale = 'ru';

// Тип навигации
type RootStackParamList = {
  Registration: undefined;
  PartnerScreen: undefined;
  LoveSpaceScreen: { startDate: string };
};
type RegistrationScreenProp = NativeStackNavigationProp<RootStackParamList, 'Registration'>;

// ===== LAVA LAMP COMPONENT =====
const LavaBlob = ({ size, colors, startX, startY }: { size: number; colors: string[]; startX: number; startY: number; }) => {
  const x = useSharedValue(startX);
  const y = useSharedValue(startY);

  React.useEffect(() => {
    x.value = withRepeat(
      withTiming(startX + (Math.random() * 160 - 80), { duration: 14000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
    y.value = withRepeat(
      withTiming(startY + (Math.random() * 180 - 90), { duration: 16000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value }, { translateY: y.value }],
  }));

  return (
    <Animated.View style={[styles.blob, animatedStyle]}>
      <LinearGradient colors={colors} style={{ width: size, height: size, borderRadius: size / 2 }} />
    </Animated.View>
  );
};

export default function RegistrationScreen() {
  const [date, setDate] = useState<string | null>(null);
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);
  const snapPoints = useMemo(() => ['90%'], []);
  const lastHaptic = useRef<number>(0);
  const navigation = useNavigation<RegistrationScreenProp>();

  // ===== HAPTICS =====
  const hapticSelection = useCallback(() => {
    const now = Date.now();
    if (now - lastHaptic.current > 250) {
      lastHaptic.current = now;
      Haptics.selectionAsync();
    }
  }, []);

  const hapticLightImpact = useCallback(() => {
    const now = Date.now();
    if (now - lastHaptic.current > 250) {
      lastHaptic.current = now;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, []);

  const closeCalendar = useCallback(() => { bottomSheetModalRef.current?.dismiss(); }, []);
  const openCalendar = useCallback(() => { bottomSheetModalRef.current?.present(); }, []);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} pressBehavior="close" />
    ),
    []
  );

  const displayDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }, []);

  // ===== ANIMATED NOISE =====
  const noiseOpacity = useSharedValue(0.35);
  React.useEffect(() => {
    noiseOpacity.value = withRepeat(withTiming(0.5, { duration: 3000, easing: Easing.linear }), -1, true);
  }, []);
  const noiseAnimatedStyle = useAnimatedStyle(() => ({ opacity: noiseOpacity.value }));

  return (
    <View style={styles.container}>
      {/* LAVA LAMP BACKGROUND */}
      <Animated.View style={styles.lavaContainer} pointerEvents="none">
        <LavaBlob size={340} startX={-120} startY={120} colors={['#FFD1A1', '#FF9A9E']} />
        <LavaBlob size={280} startX={width - 180} startY={height * 0.45} colors={['#E2D1C3', '#FAD0C4']} />
        <LavaBlob size={220} startX={60} startY={height * 0.7} colors={['#FBC2EB', '#A6C1EE']} />
      </Animated.View>

      {/* LINEAR GRADIENT */}
      <LinearGradient colors={['#FDFCFB', '#F2E2D2', '#E2D1C3']} style={StyleSheet.absoluteFill} pointerEvents="none" />

      {/* ANIMATED NOISE */}
      <Animated.Image
        source={{ uri: 'https://www.transparenttextures.com/patterns/noisy-net.png' }}
        resizeMode="repeat"
        style={[styles.noiseOverlay, noiseAnimatedStyle]}
      />

      <View style={styles.content}>
        <Text style={styles.appName}>LOVE APP</Text>
        <View style={styles.centerBlock}>
          <Text style={styles.mainTitle}>Начало истории</Text>
          <View style={styles.glassWrapper}>
            <BlurView intensity={90} tint="light" style={styles.liquidGlassCard}>
              <Text style={styles.label}>ДАТА НАЧАЛА ОТНОШЕНИЙ</Text>
              <Pressable
                style={({ pressed }) => [styles.dateSelectBtn, pressed && { opacity: 0.7 }]}
                onPress={openCalendar}
              >
                <Text style={styles.dateSelectText}>{date ? displayDate(date) : 'Выбрать дату'}</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.continueBtn,
                  !date && styles.disabledBtn,
                  pressed && date && { transform: [{ scale: 0.98 }] },
                ]}
                disabled={!date}
                onPress={() => { 
                  if (date) {
                    hapticLightImpact();
                    navigation.navigate('LoveSpace', { startDate: date });
                  }
                }}
              >
                <Text style={styles.continueText}>Продолжить</Text>
                <Ionicons name="arrow-forward" size={20} color={date ? '#FFF' : '#AAA'} />
              </Pressable>
            </BlurView>
          </View>
        </View>

        <Pressable style={styles.partnerCodeBtn} onPress={() => navigation.navigate('PartnerScreen')}>
          <BlurView intensity={30} tint="default" style={styles.partnerBlur}>
            <Text style={styles.partnerText}>У меня есть код партнера</Text>
          </BlurView>
        </Pressable>
      </View>

      {/* BOTTOM SHEET */}
      <BottomSheetModal
        ref={bottomSheetModalRef}
        index={0}
        snapPoints={snapPoints}
        backdropComponent={renderBackdrop}
        backgroundStyle={styles.sheetBackground}
        handleIndicatorStyle={styles.handle}
        enablePanDownToClose
      >
        <BottomSheetView style={styles.sheetContent}>
          <Text style={styles.modalTitle}>Когда всё началось?</Text>
          <Calendar
            onDayPress={(day) => { setDate(day.dateString); hapticSelection(); }}
            markedDates={date ? { [date]: { selected: true, selectedColor: '#FF9A9E' } } : {}}
            maxDate={todayStr}
            theme={{
              backgroundColor: 'transparent',
              calendarBackground: 'transparent',
              textSectionTitleColor: '#999',
              selectedDayBackgroundColor: '#FF9A9E',
              selectedDayTextColor: '#ffffff',
              todayTextColor: '#FF9A9E',
              dayTextColor: '#2d4150',
              textDisabledColor: '#d9e1e8',
              arrowColor: '#FF9A9E',
              monthTextColor: '#111',
              textDayFontWeight: '500',
              textMonthFontWeight: '700',
              textDayHeaderFontWeight: '600',
            }}
          />
          <Pressable style={styles.modalConfirmBtn} onPress={closeCalendar}>
            <Text style={styles.modalConfirmText}>Готово</Text>
          </Pressable>
        </BottomSheetView>
      </BottomSheetModal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, paddingHorizontal: 30, justifyContent: 'space-between', paddingVertical: 80, zIndex: 2 },
  appName: { fontSize: 12, fontWeight: '900', color: 'rgba(0,0,0,0.25)', letterSpacing: 4, textAlign: 'center' },
  centerBlock: { alignItems: 'center', width: '100%' },
  mainTitle: { fontSize: 28, fontWeight: '200', color: '#1a1a1a', marginBottom: 40 },
  glassWrapper: { width: '100%', borderRadius: 45, overflow: 'hidden', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.6)' },
  liquidGlassCard: { width: '100%', padding: 30, alignItems: 'center' },
  label: { fontSize: 10, fontWeight: '800', color: 'rgba(0,0,0,0.3)', letterSpacing: 2, marginBottom: 20 },
  dateSelectBtn: { width: '100%', backgroundColor: 'rgba(255,255,255,0.5)', paddingVertical: 18, borderRadius: 22, alignItems: 'center', marginBottom: 15 },
  dateSelectText: { fontSize: 16, color: '#333' },
  continueBtn: { width: '100%', paddingVertical: 18, borderRadius: 22, backgroundColor: '#2e1e00', flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  disabledBtn: { backgroundColor: 'rgba(0,0,0,0.1)' },
  continueText: { color: '#FFF', fontSize: 17, fontWeight: '700', marginRight: 10 },
  partnerCodeBtn: { borderRadius: 22, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.8)' },
  partnerBlur: { paddingVertical: 18, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)' },
  partnerText: { fontSize: 14, color: '#444', fontWeight: '600' },
  sheetBackground: { backgroundColor: '#FFF', borderTopLeftRadius: 40, borderTopRightRadius: 40 },
  sheetContent: { flex: 1, padding: 24 },
  handle: { backgroundColor: 'rgba(0,0,0,0.1)', width: 40 },
  modalTitle: { fontSize: 20, fontWeight: '400', textAlign: 'center', marginBottom: 20, color: '#333' },
  modalConfirmBtn: { marginTop: 20, paddingVertical: 18, borderRadius: 22, backgroundColor: '#111', alignItems: 'center' },
  modalConfirmText: { fontSize: 16, fontWeight: '700', color: '#FFF' },

  // ===== LAVA LAMP & NOISE =====
  lavaContainer: { ...StyleSheet.absoluteFillObject, zIndex: 0, overflow: 'hidden' },
  blob: { position: 'absolute', opacity: 0.65, filter: 'blur(70px)' },
  noiseOverlay: { ...StyleSheet.absoluteFillObject, zIndex: 2, tintColor: '#000', mixBlendMode: 'overlay' },
});
