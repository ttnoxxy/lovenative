import 'react-native-gesture-handler';
import React, { useState, useMemo, useRef, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet, ImageBackground, Dimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
// Добавлен импорт BottomSheetBackdropProps для типизации
import BottomSheet, { BottomSheetBackdrop, BottomSheetBackdropProps } from '@gorhom/bottom-sheet';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

const { width, height } = Dimensions.get('window');

LocaleConfig.locales['ru'] = {
  monthNames: ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'],
  monthNamesShort: ['Янв.','Фев.','Мар.','Апр.','Май','Июн.','Июл.','Авг.','Сен.','Окт.','Ноя.','Дек.'],
  dayNames: ['Воскресенье','Понедельник','Вторник','Среда','Четверг','Пятница','Суббота'],
  dayNamesShort: ['Вс','Пн','Вт','Ср','Чт','Пт','Сб'],
  today: 'Сегодня',
};
LocaleConfig.defaultLocale = 'ru';

export default function RegistrationScreen() {
  const [date, setDate] = useState<string | null>(null);
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['75%'], []);

  // --- ФУНКЦИИ (Объявлены ПЕРЕД использованием в return) ---

  const openCalendar = useCallback(() => {
    bottomSheetRef.current?.snapToIndex(0);
  }, []);

  const closeCalendar = useCallback(() => {
    bottomSheetRef.current?.close();
  }, []);

  // Типизированный рендер затемнения фона
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
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={styles.container}>
        {/* ФОН */}
        <LinearGradient
          colors={['#FDFCFB', '#F2E2D2', '#E2D1C3']}
          style={StyleSheet.absoluteFill}
        />
        <ImageBackground
          source={{ uri: 'https://www.transparenttextures.com/patterns/tactile-noise-light.png' }}
          style={styles.noiseOverlay}
          resizeMode="repeat"
        />

        <View style={styles.content}>
          <Text style={styles.appName}>LOVE APP</Text>

          <View style={styles.centerBlock}>
            <Text style={styles.mainTitle}>Начало истории</Text>

            <View style={styles.glassWrapper}>
              <BlurView intensity={90} tint="light" style={styles.liquidGlassCard}>
                <Text style={styles.label}>ДАТА ВСТРЕЧИ</Text>

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

          <Pressable style={styles.partnerCodeBtn}>
            <BlurView intensity={30} tint="default" style={styles.partnerBlur}>
              <Text style={styles.partnerText}>У меня есть код партнера</Text>
            </BlurView>
          </Pressable>
        </View>

        {/* BOTTOM SHEET */}
        <BottomSheet
          ref={bottomSheetRef}
          index={-1}
          snapPoints={snapPoints}
          enablePanDownToClose
          backdropComponent={renderBackdrop}
          backgroundStyle={styles.sheetBackground}
          handleIndicatorStyle={styles.handle}
          // Убрали zIndex, так как портал BottomSheet сам управляет слоями в GestureHandlerRootView
        >
          <View style={styles.sheetContent}>
            <Text style={styles.modalTitle}>Когда всё началось?</Text>

            <Calendar
              onDayPress={(day) => setDate(day.dateString)}
              markedDates={
                date ? { [date]: { selected: true, selectedColor: '#FF9A9E' } } : {}
              }
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
        </BottomSheet>
      </View>
    </GestureHandlerRootView>
  );
}

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
    backgroundColor: '#111',
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