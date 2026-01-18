import React, { useRef, useEffect, useMemo } from 'react';
import { 
  View, Text, Pressable, StyleSheet, ImageBackground, 
  Animated, Dimensions, Platform 
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RouteProp } from '@react-navigation/native';

const { width } = Dimensions.get('window');

// Типы для навигации
type RootStackParamList = {
  LoveSpace: { startDate: string };
};

type LoveSpaceScreenRouteProp = RouteProp<RootStackParamList, 'LoveSpace'>;

// Компонент прогресс-бара
const ProgressBar = ({ progress = 0.18 }) => {
  const widthAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(widthAnim, {
      toValue: progress,
      duration: 1000,
      useNativeDriver: false, // width не поддерживается native driver
    }).start();
  }, []);

  const widthInterpolated = widthAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%']
  });

  return (
    <View style={styles.progressContainer}>
      <Animated.View style={[styles.progressBar, { width: widthInterpolated }]}>
        <LinearGradient
           // Градиент внутри полоски прогресса
           colors={['#fae1dd', '#e5e6ea']} 
           start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
           style={StyleSheet.absoluteFill} 
        />
      </Animated.View>
    </View>
  );
};

export function LoveSpaceScreen({ route }: { route: LoveSpaceScreenRouteProp }) {
  const insets = useSafeAreaInsets();
  const { startDate } = route.params;
  
  // Рассчитываем количество дней любви
  const loveDays = useMemo(() => {
    const start = new Date(startDate);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }, [startDate]);

  // New: compute next milestone (next multiple of 50 after current days), days left and progress
  const { nextMilestone, daysLeftToMilestone, milestoneProgress } = useMemo(() => {
    const next = Math.ceil((loveDays + 1) / 50) * 50; // ensures next > loveDays and rounds to 50s
    const left = Math.max(next - loveDays, 0);
    const progress = Math.min(loveDays / next, 1);
    return { nextMilestone: next, daysLeftToMilestone: left, milestoneProgress: progress };
  }, [loveDays]);
  
  // Анимации появления
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  // Убраны numberAnim и displayNumber state — отображаем loveDays напрямую
  const displayNumber = loveDays;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 800, useNativeDriver: true }),
    ]).start();
  }, [loveDays]);

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  return (
    <View style={styles.container}>
      {/* Фон: теплый терракотовый градиент как на фото */}
      <LinearGradient 
        colors={['#FDFCFB', '#F2E2D2', '#E2D1C3']} 
        style={StyleSheet.absoluteFill} 
      />
      
      {/* Текстура шума для "тактильности" */}
      <ImageBackground
        source={{ uri: 'https://www.transparenttextures.com/patterns/tactile-noise-light.png' }}
        style={{ opacity: 0.15, zIndex: 1, ...StyleSheet.absoluteFillObject }}
        resizeMode="repeat" 
      />

      <View style={[styles.content, { paddingTop: insets.top + 10, paddingBottom: insets.bottom + 20 }]}>
        
        {/* --- HEADER --- */}
        <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
          <View>
            <Text style={styles.appName}>LOVE APP</Text>
            <Text style={styles.appSubName}>Personal Space</Text>
          </View>
          
          <View style={styles.headerRight}>
            <View style={styles.statusBadge}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>ЖДЕМ ПАРТНЕРА</Text>
            </View>
            <Pressable onPress={handlePress} style={styles.inviteButton}>
              <Text style={styles.inviteText}>ПРИГЛАСИТЬ</Text>
              <Ionicons name="chevron-forward" size={12} color="#000000" style={{marginLeft: 4}}/>
            </Pressable>
          </View>
        </Animated.View>

        {/* --- MAIN COUNTER --- */}
        <Animated.View style={[styles.counterContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <Text style={styles.mainNumber}>{displayNumber}</Text>
          <Text style={styles.mainLabel}>ДНЕЙ ЛЮБВИ</Text>
        </Animated.View>

        {/* --- GLASS CARD --- */}
        <Animated.View style={[styles.glassWrapper, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <BlurView intensity={70} tint="light" style={styles.cardContent}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardLabel}>СЛЕДУЮЩИЙ ЮБИЛЕЙ</Text>
              <Ionicons name="star-outline" size={18} color="rgba(0,0,0,0.3)" />
            </View>
            
            <Text style={styles.cardTitle}>{nextMilestone} Дней</Text>
            
            <ProgressBar progress={milestoneProgress} />

            <View style={styles.cardFooter}>
              <Text style={styles.footerText}>{daysLeftToMilestone} ДНЕЙ ОСТАЛОСЬ</Text>
              <Text style={styles.footerPercent}>{Math.round(milestoneProgress * 100)}%</Text>
            </View>
          </BlurView>
        </Animated.View>

        <View style={{ flex: 1 }} />


      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, paddingHorizontal: 24, zIndex: 2 },
  
  // Header
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 40 },
  appName: { fontSize: 10, fontWeight: '800', color: '#5C3A3A', letterSpacing: 1.5, opacity: 0.7 },
  appSubName: { fontSize: 20, fontWeight: '400', fontStyle: 'italic', color: '#3A2A2A', marginTop: 2 },
  headerRight: { alignItems: 'flex-end', gap: 8 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.4)', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20 },
  statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#FFD700', marginRight: 6 },
  statusText: { fontSize: 10, fontWeight: '700', color: '#5C3A3A', letterSpacing: 0.5 },
  inviteButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.25)', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20 },
  inviteText: { fontSize: 10, fontWeight: '700', color: '#5C3A3A', letterSpacing: 0.5 },

  // Counter
  counterContainer: { alignItems: 'center', marginTop: 20, marginBottom: 50 },
  mainNumber: { fontSize: 140, fontWeight: '200', color: '#2A2A2A', lineHeight: 150, includeFontPadding: false },
  mainLabel: { fontSize: 12, fontWeight: '600', color: '#5C3A3A', letterSpacing: 4, textTransform: 'uppercase', opacity: 0.7 },
  smallHint: { fontSize: 12, color: 'rgba(0,0,0,0.45)', marginTop: 6 },

  // Card
  glassWrapper: { width: '100%', borderRadius: 32, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 20, shadowOffset: {width: 0, height: 10} },
  cardContent: { padding: 24 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  cardLabel: { fontSize: 11, fontWeight: '800', color: '#5C3A3A', letterSpacing: 1.5, opacity: 0.6 },
  cardTitle: { fontSize: 22, fontWeight: '600', color: '#2A2A2A', marginBottom: 20 },
  
  // Progress Bar
  progressContainer: { height: 8, backgroundColor: 'rgba(0,0,0,0.08)', borderRadius: 4, width: '100%', overflow: 'hidden', marginBottom: 16 },
  progressBar: { height: '100%', borderRadius: 4, overflow: 'hidden' },
  
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between' },
  footerText: { fontSize: 12, color: '#5C3A3A', opacity: 0.6 },
  footerPercent: { fontSize: 12, color: '#5C3A3A', fontWeight: '700', opacity: 0.8 },

  // Bottom Bar
  bottomBarWrapper: { alignItems: 'center', width: '100%' },
  bottomBar: { 
    flexDirection: 'row', 
    backgroundColor: '#222', 
    borderRadius: 35, 
    paddingVertical: 8, 
    paddingHorizontal: 8, 
    width: '100%', 
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 10, shadowOffset: {width: 0, height: 5}
  },
  timelineBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12 },
  timelineText: { color: '#FFF', fontSize: 16, fontWeight: '500' },
  bottomIcons: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#333', justifyContent: 'center', alignItems: 'center' },
  cameraBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center' },
  startDateText: { fontSize: 12, color: 'rgba(0,0,0,0.45)', marginTop: 4 },
});