import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Animated, Share, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { UserSettings, Milestone } from '../types';
import { calculateDaysTogether, getNextMilestone, getDaysUntil, isBigMilestone, getTodayCustomEvent } from '../utils/dateLogic';
import { translations } from '../utils/translations';
import { Check, ChevronRight, Copy, Share2, Star, Heart, Plane, Sparkles, X } from 'lucide-react-native';
import { getInviteLink } from '../utils/inviteLink';
import * as Clipboard from 'expo-clipboard';
import NoiseOverlay from './NoiseOverlay';

interface DashboardProps {
  settings: UserSettings;
  userUid: string | null;
  onSettingsClick: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ settings, userUid, onSettingsClick }) => {
  const [days, setDays] = useState<number>(0);
  const [showMilestoneOverlay, setShowMilestoneOverlay] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [copiedInvite, setCopiedInvite] = useState(false);
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const backdropFadeAnim = React.useRef(new Animated.Value(0)).current;
  
  const t = useMemo(() => translations[settings.language], [settings.language]);

  const inviteLabel = useMemo(() => settings.language === 'ru' ? 'Пригласить' : 'Invite', [settings.language]);
  const inviteTitle = useMemo(() => settings.language === 'ru' ? 'Приглашение' : 'Invite', [settings.language]);
  const inviteCopy = useMemo(() => settings.language === 'ru' ? 'Копировать код' : 'Copy code', [settings.language]);
  const inviteShare = useMemo(() => settings.language === 'ru' ? 'Поделиться' : 'Share', [settings.language]);
  const inviteHint = useMemo(() => settings.language === 'ru'
    ? 'Поделитесь кодом или ссылкой — партнёр сможет подключиться.'
    : 'Share the code or link — your partner can connect.', [settings.language]);
  const inviteNoCode = useMemo(() => settings.language === 'ru'
    ? 'Код ещё не создан. Откройте настройки, чтобы создать пару.'
    : 'No invite code yet. Open Settings to create a pair.', [settings.language]);

  const inviteLink = useMemo(() => (settings.inviteCode ? getInviteLink(settings.inviteCode) : ''), [settings.inviteCode]);

  const handleCopyInvite = async () => {
    if (!settings.inviteCode) return;
    try {
      await Clipboard.setStringAsync(settings.inviteCode);
      setCopiedInvite(true);
      setTimeout(() => setCopiedInvite(false), 1600);
    } catch {
      // no-op
    }
  };

  const handleShareInvite = async () => {
    if (!settings.inviteCode) return;
    const link = inviteLink || settings.inviteCode;
    try {
      if (Platform.OS !== 'web') {
        await Share.share({
          message: `${inviteTitle}: ${settings.inviteCode}\n${link}`,
          title: 'Love App Invite',
        });
      } else {
        await Clipboard.setStringAsync(link);
        setCopiedInvite(true);
        setTimeout(() => setCopiedInvite(false), 1600);
      }
    } catch {
      // Fallback to clipboard if share fails
      await Clipboard.setStringAsync(link);
      setCopiedInvite(true);
      setTimeout(() => setCopiedInvite(false), 1600);
    }
  };

  useEffect(() => {
    if (settings.startDate) {
      try {
        const d = calculateDaysTogether(settings.startDate);
        if (isNaN(d) || !isFinite(d)) {
          console.error("Ошибка расчета дней: невалидная дата", settings.startDate);
          setDays(0);
        } else {
          setDays(d);
        }
      } catch (error) {
        console.error("Ошибка при обработке даты:", error);
        setDays(0);
      }
    } else {
      setDays(0);
    }
  }, [settings.startDate]);

  useEffect(() => {
    if (showMilestoneOverlay) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [showMilestoneOverlay, fadeAnim]);

  const nextMilestone = useMemo(() => {
    return settings.startDate && !isNaN(days) && isFinite(days)
      ? getNextMilestone(days, settings.startDate, settings.customEvents) 
      : { day: 100, title: '...', description: '', type: 'small' } as Milestone;
  }, [days, settings.startDate, settings.customEvents]);

  const daysUntil = useMemo(() => {
    return !isNaN(nextMilestone.day) && !isNaN(days) && isFinite(nextMilestone.day) && isFinite(days)
      ? Math.max(0, getDaysUntil(nextMilestone.day, days))
      : 0;
  }, [nextMilestone.day, days]);
  
  const previousMilestoneDay = useMemo(() => {
    return days > 10 && !isNaN(days) && isFinite(days) ? days - (days % 10) : 0;
  }, [days]);
  
  const totalRange = useMemo(() => {
    return !isNaN(nextMilestone.day) && isFinite(nextMilestone.day) 
      ? Math.max(1, nextMilestone.day - previousMilestoneDay)
      : 1;
  }, [nextMilestone.day, previousMilestoneDay]);
  
  const progressPercent = useMemo(() => {
    return !isNaN(days) && isFinite(days)
      ? Math.min(100, Math.max(0, ((days - previousMilestoneDay) / totalRange) * 100))
      : 0;
  }, [days, previousMilestoneDay, totalRange]);

  const isTodayBig = useMemo(() => isBigMilestone(days), [days]);
  const todayCustomEvent = useMemo(() => getTodayCustomEvent(settings.customEvents), [settings.customEvents]);

  const getEventStyle = useMemo(() => (type?: string) => {
      switch(type) {
          case 'anniversary': return { bg: '#f43f5e', icon: Heart };
          case 'vacation': return { bg: '#0ea5e9', icon: Plane };
          case 'holiday': return { bg: '#10b981', icon: Sparkles };
          default: return { bg: '#9c88ff', icon: Star };
      }
  }, []);

  const eventStyle = useMemo(() => {
    return todayCustomEvent ? getEventStyle(todayCustomEvent.type) : getEventStyle();
  }, [todayCustomEvent, getEventStyle]);
  
  const EventIcon = useMemo(() => eventStyle.icon, [eventStyle]);

  if (!settings.startDate) return null;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
      <LinearGradient
        colors={['#f5ede4', '#f0d4c4', '#e8ddd4']}
        style={StyleSheet.absoluteFill}
      />
      <NoiseOverlay />

      {/* Milestone Overlay */}
      {(isTodayBig || todayCustomEvent) && showMilestoneOverlay && (
        <Modal
          visible={showMilestoneOverlay}
          transparent
          animationType="fade"
          onRequestClose={() => setShowMilestoneOverlay(false)}
        >
          <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
            <LinearGradient
              colors={[eventStyle.bg, eventStyle.bg + 'dd']}
              style={StyleSheet.absoluteFill}
            />
            <TouchableOpacity
              style={styles.closeOverlayButton}
              onPress={() => setShowMilestoneOverlay(false)}
            >
              <X size={24} color="white" />
            </TouchableOpacity>
            
            <View style={styles.overlayContent}>
              <EventIcon size={80} color="white" />
              
              <Text style={styles.overlayTitle}>
                {todayCustomEvent ? t.todayIs : t.bigDayTitle}
              </Text>
              
              {todayCustomEvent ? (
                <View style={styles.eventContent}>
                  <Text style={styles.eventTitle}>{todayCustomEvent.title}</Text>
                  <View style={styles.yearBadge}>
                    <Text style={styles.yearText}>
                      {new Date(todayCustomEvent.date).getFullYear()}
                    </Text>
                  </View>
                </View>
              ) : (
                <View style={styles.daysContent}>
                  <Text style={styles.daysNumber}>{days}</Text>
                  <View style={styles.daysBadge}>
                    <Text style={styles.daysLabel}>
                      {settings.language === 'ru' ? 'Дней' : 'Days'}
                    </Text>
                  </View>
                </View>
              )}

              <TouchableOpacity
                onPress={() => setShowMilestoneOverlay(false)}
                style={styles.continueButton}
                activeOpacity={0.8}
              >
                <Text style={styles.continueButtonText}>
                  {t.navHome || (settings.language === 'ru' ? 'Продолжить' : 'Continue')}
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </Modal>
      )}

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.appLabel}>LOVE APP</Text>
          <Text style={styles.spaceLabel}>
            {settings.isConnected ? 'Shared Space' : 'Personal Space'}
          </Text>
        </View>
        
        <View style={styles.headerRight}>
          {!settings.isConnected && (
            <TouchableOpacity
              style={styles.waitingButton}
              activeOpacity={0.8}
            >
              <Star size={14} color="#2d2a29" fill="#2d2a29" />
              <Text style={styles.waitingButtonText}>
                {settings.language === 'ru' ? 'ЖДЁ ПАРТНЁРА' : 'WAITING PARTNER'}
              </Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            onPress={() => setIsInviteOpen(true)}
            style={styles.inviteButton}
            activeOpacity={0.8}
          >
            <Text style={styles.inviteButtonText}>
              {settings.language === 'ru' ? 'ПРИГЛАСИТЬ' : 'INVITE'}
            </Text>
            <ChevronRight size={16} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Hero Section */}
      <View style={styles.heroSection}>
        <Text style={styles.daysNumber} numberOfLines={1} adjustsFontSizeToFit>
          {days}
        </Text>
        <Text style={styles.daysLabelHero}>{t.daysOfLove}</Text>
      </View>

      {/* Next Milestone Card */}
      <View style={styles.milestoneCard}>
        <BlurView intensity={80} style={styles.milestoneCardBlur}>
          <View style={styles.milestoneHeader}>
            <Text style={styles.milestoneLabel}>{t.nextMilestone}</Text>
            <View style={styles.milestoneIcon}>
              {nextMilestone.eventType === 'anniversary' ? (
                <Heart size={16} color="#9c88ff" />
              ) : (
                <Star size={16} color="#9c88ff" />
              )}
            </View>
          </View>

          <Text style={styles.milestoneTitle}>{nextMilestone.title}</Text>
          
          {/* Progress Track */}
          <View style={styles.progressTrack}>
            <LinearGradient
              colors={['#e59aa0', '#e8b4a2', '#f2c2b2']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.progressBar, { width: `${progressPercent}%` }]}
            />
          </View>
          
          <View style={styles.progressInfo}>
            <Text style={styles.progressText}>
              {daysUntil} {settings.language === 'ru' ? 'ДНЕЙ ОСТАЛОСЬ' : 'DAYS LEFT'}
            </Text>
            <Text style={styles.progressText}>
              {Math.round(progressPercent)}%
            </Text>
          </View>
        </BlurView>
      </View>

      {/* Invite Bottom Sheet */}
      <Modal
        visible={isInviteOpen}
        transparent
        animationType="none"
        onRequestClose={() => setIsInviteOpen(false)}
        onShow={() => {
          Animated.timing(backdropFadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }).start();
        }}
      >
        <Animated.View style={[styles.modalBackdrop, { opacity: backdropFadeAnim }]}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => {
              Animated.timing(backdropFadeAnim, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
              }).start(() => setIsInviteOpen(false));
            }}
          />
          <TouchableOpacity
            style={styles.inviteSheet}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <BlurView intensity={80} style={styles.inviteSheetBlur}>
              <View style={styles.inviteSheetContent}>
                <View style={styles.inviteSheetHeader}>
                  <View>
                    <Text style={styles.inviteSheetTitle}>{inviteTitle}</Text>
                    <Text style={styles.inviteSheetHint}>{inviteHint}</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => setIsInviteOpen(false)}
                    style={styles.inviteCloseButton}
                  >
                    <X size={18} color="#2d2a29" />
                  </TouchableOpacity>
                </View>

                <View style={styles.inviteCodeContainer}>
                  {settings.inviteCode ? (
                    <View style={styles.inviteCodeBox}>
                      <View style={styles.inviteCodeLabel}>
                        <Text style={styles.inviteCodeLabelText}>
                          {settings.language === 'ru' ? 'Код' : 'Code'}
                        </Text>
                        <Text style={styles.inviteCodeValue}>
                          {settings.inviteCode}
                        </Text>
                      </View>
                      <TouchableOpacity
                        onPress={handleCopyInvite}
                        style={styles.copyButton}
                        activeOpacity={0.8}
                      >
                        {copiedInvite ? (
                          <Check size={18} color="white" />
                        ) : (
                          <Copy size={18} color="white" />
                        )}
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View style={styles.noCodeBox}>
                      <Text style={styles.noCodeText}>{inviteNoCode}</Text>
                    </View>
                  )}
                </View>

                <View style={styles.inviteActions}>
                  <TouchableOpacity
                    onPress={handleShareInvite}
                    disabled={!settings.inviteCode}
                    style={[styles.shareButton, !settings.inviteCode && styles.shareButtonDisabled]}
                    activeOpacity={0.8}
                  >
                    <Share2 size={18} color="white" />
                    <Text style={styles.shareButtonText}>{inviteShare}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      setIsInviteOpen(false);
                      onSettingsClick();
                    }}
                    style={styles.settingsButton}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.settingsButtonText}>
                      {settings.language === 'ru' ? 'Настройки' : 'Settings'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </BlurView>
          </TouchableOpacity>
        </Animated.View>
      </Modal>
    </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 112,
    flexGrow: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 40,
  },
  appLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: 'rgba(45, 42, 41, 0.6)',
  },
  spaceLabel: {
    fontSize: 16,
    fontFamily: 'System',
    fontStyle: 'italic',
    color: '#2d2a29',
    marginTop: 4,
    opacity: 0.9,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  waitingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f4d03f',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 24,
    shadowColor: '#f4d03f',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  waitingButtonText: {
    fontSize: 9,
    fontFamily: 'monospace',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    fontWeight: 'bold',
    color: '#2d2a29',
  },
  statusCapsule: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.7)',
  },
  greenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#22c55e',
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
  },
  statusText: {
    fontSize: 10,
    fontFamily: 'monospace',
    textTransform: 'uppercase',
    color: 'rgba(45, 42, 41, 0.7)',
  },
  inviteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#e8b4a2',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 24,
    shadowColor: '#e8b4a2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  inviteButtonText: {
    fontSize: 9,
    fontFamily: 'monospace',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    fontWeight: 'bold',
    color: 'white',
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 48,
    minHeight: 150,
  },
  daysNumber: {
    fontSize: 120,
    fontWeight: 'bold',
    lineHeight: 130,
    letterSpacing: -6,
    color: '#2d2a29',
    includeFontPadding: false,
  },
  daysLabelHero: {
    fontSize: 16,
    fontFamily: 'monospace',
    color: 'rgba(45, 42, 41, 0.8)',
    marginTop: 12,
    letterSpacing: 3.5,
    textTransform: 'uppercase',
  },
  milestoneCard: {
    marginBottom: 48,
    borderRadius: 32,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 32,
  },
  milestoneCardBlur: {
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    padding: 24,
  },
  milestoneHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  milestoneLabel: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 2,
    color: 'rgba(45, 42, 41, 0.75)',
    fontWeight: 'bold',
  },
  milestoneIcon: {
    padding: 8,
    backgroundColor: 'rgba(156, 136, 255, 0.1)',
    borderRadius: 20,
  },
  milestoneTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2d2a29',
    marginBottom: 24,
  },
  progressTrack: {
    height: 10,
    width: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
    borderRadius: 5,
    marginBottom: 16,
    overflow: 'hidden',
  },
  progressBar: {
    flex: 1,
    borderRadius: 5,
    shadowColor: '#e8b4a2',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.55,
    shadowRadius: 14,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressText: {
    fontSize: 11,
    fontFamily: 'monospace',
    color: 'rgba(45, 42, 41, 0.8)',
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeOverlayButton: {
    position: 'absolute',
    top: 40,
    right: 24,
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
  },
  overlayContent: {
    alignItems: 'center',
    padding: 32,
    width: '100%',
    maxWidth: 400,
  },
  overlayTitle: {
    fontSize: 24,
    fontFamily: 'System',
    fontStyle: 'italic',
    color: 'white',
    marginTop: 32,
    marginBottom: 24,
    textAlign: 'center',
  },
  eventContent: {
    alignItems: 'center',
  },
  eventTitle: {
    fontSize: 48,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  yearBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderRadius: 20,
    marginTop: 16,
  },
  yearText: {
    fontSize: 14,
    fontFamily: 'monospace',
    color: 'white',
  },
  daysContent: {
    position: 'relative',
    alignItems: 'center',
  },
  daysBadge: {
    position: 'absolute',
    bottom: -8,
    right: 0,
    backgroundColor: 'white',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  daysLabel: {
    fontSize: 12,
    fontFamily: 'monospace',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    color: '#9c88ff',
  },
  continueButton: {
    marginTop: 48,
    paddingHorizontal: 32,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.28,
    shadowRadius: 28,
  },
  continueButtonText: {
    fontSize: 12,
    fontFamily: 'monospace',
    textTransform: 'uppercase',
    letterSpacing: 2,
    fontWeight: 'bold',
    color: '#2d2a29',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'flex-end',
  },
  inviteSheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
  },
  inviteSheetBlur: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
  },
  inviteSheetContent: {
    padding: 20,
  },
  inviteSheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 16,
    marginBottom: 20,
  },
  inviteSheetTitle: {
    fontSize: 20,
    fontFamily: 'System',
    fontStyle: 'italic',
    color: '#2d2a29',
  },
  inviteSheetHint: {
    fontSize: 14,
    color: 'rgba(45, 42, 41, 0.7)',
    marginTop: 4,
  },
  inviteCloseButton: {
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.7)',
  },
  inviteCodeContainer: {
    marginBottom: 16,
  },
  inviteCodeBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  inviteCodeLabel: {
    flex: 1,
  },
  inviteCodeLabelText: {
    fontSize: 10,
    fontFamily: 'monospace',
    textTransform: 'uppercase',
    letterSpacing: 2,
    color: 'rgba(45, 42, 41, 0.6)',
  },
  inviteCodeValue: {
    fontSize: 24,
    fontFamily: 'monospace',
    letterSpacing: 3.5,
    color: '#2d2a29',
    marginTop: 4,
  },
  copyButton: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: '#9c88ff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#9c88ff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  noCodeBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 16,
    padding: 16,
  },
  noCodeText: {
    fontSize: 14,
    color: 'rgba(45, 42, 41, 0.7)',
  },
  inviteActions: {
    flexDirection: 'row',
    gap: 12,
  },
  shareButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#2d2a29',
    paddingVertical: 12,
    borderRadius: 16,
  },
  shareButtonDisabled: {
    opacity: 0.4,
  },
  shareButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: 'white',
  },
  settingsButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    paddingVertical: 12,
    borderRadius: 16,
  },
  settingsButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2d2a29',
  },
});

export default Dashboard;
