import React, { useState, useMemo, useRef, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ImageBackground,
  Dimensions,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import BottomSheet, { BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming, FadeInDown, FadeOutUp } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

// Локализация RU
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
  const snapPoints = useMemo(() => ['70%'], []);

  const openCalendar = () => {
    bottomSheetRef.current?.expand();
  };

  const closeCalendar = () => {
    bottomSheetRef.current?.close();
  };

  const renderBackdrop = useCallback(
    (props) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        pressBehavior="close"
      />
    ),
    []
  );

  const displayDate = (dateString: string) => {
    return new Date(dateString + 'T00:00:00').toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  return (
    <View style={styles.container}>
      {/* ФОН */}
      <LinearGradient
        colors={['#FDFCFB', '#F2E2D2', '#E2D1C3']}
        style={StyleSheet.absoluteFill}
      />

      <ImageBackground
        source={{ uri: 'https://www.transparenttextures.com/patterns/tactile-noise-light.png' }}
        style={[StyleSheet.absoluteFill, { opacity: 0.3 }]}
        resizeMode="repeat"
      />

      <View style={styles.content}>
        <Text style={styles.appName}>LOVE APP</Text>

        <View style={styles.centerBlock}>
          <Text style={styles.mainTitle}>Начало истории</Text>

          <BlurView intensity={90} tint="light" style={styles.liquidGlassCard}>
            <Text style={styles.label}>Дата встречи</Text>

            <Pressable
              style={({ pressed }) => [
                styles.dateSelectBtn,
                pressed && { opacity: 0.85 },
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
                pressed && date && { transform: [{ scale: 0.97 }] },
              ]}
              disabled={!date}
            >
              <Text style={styles.continueText}>Продолжить</Text>
              <Ionicons name="arrow-forward" size={20} color={date ? '#FFF' : '#AAA'} />
            </Pressable>
          </BlurView>
        </View>

        <Pressable style={styles.partnerCodeBtn}>
          <BlurView intensity={30} tint="default" style={styles.partnerBlur}>
            <Text style={styles.partnerText}>У меня есть код партнера</Text>
          </BlurView>
        </Pressable>
      </View>

      {/* BOTTOM SHEET С КАЛЕНДАРЕМ */}
      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        backgroundStyle={styles.sheetBackground}
        handleIndicatorStyle={styles.handle}
      >
        <BlurView intensity={100} tint="light" style={styles.sheetContent}>
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
              dayTextColor: '#333',
              todayTextColor: '#FF9A9E',
              monthTextColor: '#111',
              textDisabledColor: '#B5B5B5',
              selectedDayTextColor: '#FFF',
              selectedDayBackgroundColor: '#FF9A9E',
              arrowColor: '#FF9A9E',
              textSectionTitleColor: '#999',
              textDayFontWeight: '500',
              textMonthFontWeight: '700',
              textDayHeaderFontWeight: '600',
            }}
          />

          <Pressable style={styles.modalConfirmBtn} onPress={closeCalendar}>
            <Text style={styles.modalConfirmText}>Готово</Text>
          </Pressable>
        </BlurView>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    flex: 1,
    paddingHorizontal: 30,
    justifyContent: 'space-between',
    paddingVertical: 80,
  },
  appName: {
    fontSize: 12,
    fontWeight: '900',
    color: 'rgba(0,0,0,0.15)',
    letterSpacing: 4,
    textAlign: 'center',
  },
  centerBlock: { alignItems: 'center' },
  mainTitle: {
    fontSize: 28,
    fontWeight: '200',
    color: '#1a1a1a',
    marginBottom: 40,
  },
  liquidGlassCard: {
    width: '100%',
    padding: 30,
    borderRadius: 45,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.8)',
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
    backgroundColor: 'rgba(255,255,255,0.4)',
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
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  continueText: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: '700',
    marginRight: 10,
  },
  partnerCodeBtn: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#FFF',
  },
  partnerBlur: {
    paddingVertical: 16,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  partnerText: { fontSize: 14, color: '#666', fontWeight: '600' },

  // Bottom Sheet
  sheetBackground: {
    backgroundColor: 'transparent',
    borderTopLeftRadius: 50,
    borderTopRightRadius: 50,
  },
  sheetContent: {
    flex: 1,
    padding: 30,
  },
  handle: {
    backgroundColor: 'rgba(0,0,0,0.15)',
    width: 50,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '300',
    textAlign: 'center',
    marginBottom: 25,
  },
  modalConfirmBtn: {
    marginTop: 'auto',
    paddingVertical: 20,
    borderRadius: 30,
    backgroundColor: '#FFF',
    alignItems: 'center',
  },
  modalConfirmText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111',
  },
});
