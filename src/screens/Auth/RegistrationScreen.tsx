import React, { useState, useMemo, useRef, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet, ImageBackground, Dimensions, Modal, Platform, Animated } from 'react-native';
import { BlurView } from 'expo-blur';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { BottomSheetModal, BottomSheetBackdrop, BottomSheetBackdropProps } from '@gorhom/bottom-sheet';
import * as Haptics from 'expo-haptics';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

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
};
type RegistrationScreenProp = NativeStackNavigationProp<RootStackParamList, 'Registration'>;

export default function RegistrationScreen() {
  const [date, setDate] = useState<string | null>(null);
  const [showCalendar, setShowCalendar] = useState(false);

  const bottomSheetModalRef = useRef<BottomSheetModal>(null);
  const snapPoints = useMemo(() => ['75%'], []);
  const lastHaptic = useRef<number>(0);

  const navigation = useNavigation<RegistrationScreenProp>();

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

  // --- Анимация для iOS ---
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const dragY = useRef(new Animated.Value(0)).current;

  const onGestureEvent = useCallback((e: any) => {
    const t = e?.nativeEvent?.translationY ?? 0;
    dragY.setValue(Math.max(0, t));
  }, [dragY]);

  const closeCalendar = useCallback(() => {
    if (Platform.OS === 'ios') {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(dragY, {
          toValue: 400,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setShowCalendar(false);
        dragY.setValue(0);
      });
    } else {
      bottomSheetModalRef.current?.dismiss();
    }
  }, [fadeAnim]);

  const onHandlerStateChange = useCallback((e: any) => {
    const { state, translationY, velocityY } = e.nativeEvent || {};
    if (state === State.END) {
      if (translationY > 60 || velocityY > 1200) {
        closeCalendar();
      } else {
        Animated.spring(dragY, {
          toValue: 0,
          useNativeDriver: true,
          bounciness: 0,
        }).start();
      }
    }
  }, [closeCalendar, dragY]);

  const openCalendar = useCallback(() => {
    if (Platform.OS === 'ios') {
      setShowCalendar(true);
      dragY.setValue(0);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }).start();
    } else {
      bottomSheetModalRef.current?.present();
    }
  }, [fadeAnim]);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        pressBehavior="close"
      />
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

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#FDFCFB', '#F2E2D2', '#E2D1C3']}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      <ImageBackground
        source={{ uri: 'https://www.transparenttextures.com/patterns/tactile-noise-light.png' }}
        style={styles.noiseOverlay}
        resizeMode="repeat"
        pointerEvents="none"
      />

      <View style={styles.content}>
        <Text style={styles.appName}>LOVE APP</Text>

        <View style={styles.centerBlock}>
          <Text style={styles.mainTitle}>Начало истории</Text>

          <View style={styles.glassWrapper}>
            <BlurView intensity={90} tint="light" style={styles.liquidGlassCard}>
              <Text style={styles.label}>ДАТА НАЧАЛА ОТНОШЕНИЙ</Text>

              <Pressable
                style={({ pressed }) => [
                  styles.dateSelectBtn,
                  pressed && { opacity: 0.7 },
                ]}
                onPress={openCalendar}
              >
                <Text style={styles.dateSelectText}>
                  {date ? displayDate(date) : 'Выбрать дату'}
                </Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.continueBtn,
                  !date && styles.disabledBtn,
                  pressed && date && { transform: [{ scale: 0.98 }] },
                ]}
                disabled={!date}
                onPress={() => {
                  if (date) hapticLightImpact();
                }}
              >
                <Text style={styles.continueText}>Продолжить</Text>
                <Ionicons 
                  name="arrow-forward" 
                  size={20} 
                  color={date ? '#FFF' : '#AAA'} 
                />
              </Pressable>
            </BlurView>
          </View>
        </View>

        {/* Кнопка перехода на PartnerScreen */}
        <Pressable
          style={styles.partnerCodeBtn}
          onPress={() => navigation.navigate('PartnerScreen')}
        >
          <BlurView intensity={30} tint="default" style={styles.partnerBlur}>
            <Text style={styles.partnerText}>У меня есть код партнера</Text>
          </BlurView>
        </Pressable>
      </View>

      {/* iOS Modal с плавным Fade */}
      {Platform.OS === 'ios' ? (
        <Modal
          visible={showCalendar}
          animationType="none"
          transparent
          onRequestClose={closeCalendar}
        >
          <Animated.View style={[styles.modalOverlay, { opacity: fadeAnim }]}>
            <BlurView intensity={25} tint="light" style={StyleSheet.absoluteFill} />
            <PanGestureHandler onGestureEvent={onGestureEvent} onHandlerStateChange={onHandlerStateChange}>
              <Animated.View style={[styles.modalCard, { transform: [{ translateY: dragY }] }]}>
                <View style={styles.dragHandle} />
                <Text style={styles.modalTitle}>Когда всё началось?</Text>

                <Calendar
                  onDayPress={(day) => {
                    setDate(day.dateString);
                    hapticSelection();
                  }}
                  markedDates={date ? { [date]: { selected: true, selectedColor: '#FF9A9E' } } : {}}
                  maxDate={new Date().toISOString().split('T')[0]}
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
              </Animated.View>
            </PanGestureHandler>
          </Animated.View>
        </Modal>
      ) : (
        <BottomSheetModal
          ref={bottomSheetModalRef}
          index={0}
          snapPoints={snapPoints}
          backdropComponent={renderBackdrop}
          backgroundStyle={styles.sheetBackground}
          handleIndicatorStyle={styles.handle}
          enablePanDownToClose
        >
          <View style={styles.sheetContent}>
            <Text style={styles.modalTitle}>Когда всё началось?</Text>

            <Calendar
              onDayPress={(day) => {
                setDate(day.dateString);
                hapticSelection();
              }}
              markedDates={date ? { [date]: { selected: true, selectedColor: '#FF9A9E' } } : {}}
              maxDate={new Date().toISOString().split('T')[0]}
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
          </View>
        </BottomSheetModal>
      )}
    </View>
  );
}

// Стили оставлены без изменений
const styles = StyleSheet.create({
  container: { flex: 1 },
  noiseOverlay: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.2,
    zIndex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 30,
    justifyContent: 'space-between',
    paddingVertical: 80,
    zIndex: 2,
  },
  appName: {
    fontSize: 12,
    fontWeight: '900',
    color: 'rgba(0,0,0,0.25)',
    letterSpacing: 4,
    textAlign: 'center',
  },
  centerBlock: { alignItems: 'center', width: '100%' },
  mainTitle: {
    fontSize: 28,
    fontWeight: '200',
    color: '#1a1a1a',
    marginBottom: 40,
  },
  glassWrapper: {
    width: '100%',
    borderRadius: 45,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.6)',
  },
  liquidGlassCard: {
    width: '100%',
    padding: 30,
    alignItems: 'center',
  },
  label: {
    fontSize: 10,
    fontWeight: '800',
    color: 'rgba(0,0,0,0.3)',
    letterSpacing: 2,
    marginBottom: 20,
  },
  dateSelectBtn: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.5)',
    paddingVertical: 18,
    borderRadius: 22,
    alignItems: 'center',
    marginBottom: 15,
  },
  dateSelectText: { fontSize: 16, color: '#333' },
  continueBtn: {
    width: '100%',
    paddingVertical: 18,
    borderRadius: 22,
    backgroundColor: '#2e1e00ff',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledBtn: {
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  continueText: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: '700',
    marginRight: 10,
  },
  partnerCodeBtn: {
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.8)',
  },
  partnerBlur: {
    paddingVertical: 18,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  partnerText: { fontSize: 14, color: '#444', fontWeight: '600' },

  sheetBackground: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    padding: 24,
    maxHeight: '80%',
  },
  dragHandle: {
    alignSelf: 'center',
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(0,0,0,0.15)',
    marginBottom: 8,
  },
  sheetContent: {
    flex: 1,
    padding: 24,
  },
  handle: {
    backgroundColor: 'rgba(0,0,0,0.1)',
    width: 40,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '400',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  modalConfirmBtn: {
    marginTop: 20,
    paddingVertical: 18,
    borderRadius: 22,
    backgroundColor: '#111',
    alignItems: 'center',
  },
  modalConfirmText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
});
