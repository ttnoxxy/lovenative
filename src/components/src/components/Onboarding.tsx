import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Share, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Heart, Copy, Check, ArrowRight, Users, Sparkles, Share2 } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { translations } from '../utils/translations';
import { UserSettings } from '../types';
import { getInviteLink } from '../utils/inviteLink';
import * as Clipboard from 'expo-clipboard';
import NoiseOverlay from './NoiseOverlay';

interface OnboardingProps {
  language: 'en' | 'ru';
  onComplete: (settings: Partial<UserSettings>) => void;
  onJoin: (code: string) => void;
  onRequestInviteCode: (date: string) => Promise<string>;
  onCheckPartnerCode?: (code: string) => Promise<boolean>;
  initialInviteCode?: string;
  initialStep?: 1 | 2 | 3;
  prefillPartnerCode?: string;
  prefillDate?: string;
  onDateSelected?: (date: string) => boolean;
}

const Onboarding: React.FC<OnboardingProps> = ({ 
  language, 
  onComplete, 
  onJoin, 
  onRequestInviteCode, 
  onCheckPartnerCode, 
  initialInviteCode, 
  initialStep = 1, 
  prefillPartnerCode, 
  prefillDate, 
  onDateSelected 
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(initialStep);
  const [date, setDate] = useState(prefillDate || '');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [myCode, setMyCode] = useState(initialInviteCode || '');
  const [partnerCode, setPartnerCode] = useState((prefillPartnerCode || '').toUpperCase());
  const [copied, setCopied] = useState(false);
  const [isLoadingCode, setIsLoadingCode] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);
  const [isCheckingPartner, setIsCheckingPartner] = useState(false);
  const [partnerError, setPartnerError] = useState<string | null>(null);
  
  const t = translations[language];

  useEffect(() => {
    if (prefillDate && !date) setDate(prefillDate);
  }, [prefillDate]);

  const handleDateSubmit = () => {
    if (!date) return;
    const intercepted = onDateSelected?.(date);
    if (intercepted) return;
    setStep(2);
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDate(selectedDate.toISOString().split('T')[0]);
    }
  };

  const handleCopy = async () => {
    if (!myCode) return;
    await Clipboard.setStringAsync(myCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (!myCode) return;
    setShareError(null);
    try {
      const link = getInviteLink(myCode);
      if (Platform.OS !== 'web') {
        await Share.share({
          message: `Join me in Love App with code: ${myCode}\n${link}`,
          title: 'Love App Invite',
        });
      } else {
        await Clipboard.setStringAsync(link || myCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (e: any) {
      setShareError(e?.message || 'Cannot share right now');
    }
  };

  const handleConnect = () => {
    if (partnerCode.length < 4) return;
    setPartnerError(null);

    const run = async () => {
      if (!onCheckPartnerCode) {
        onJoin(partnerCode);
        return;
      }

      setIsCheckingPartner(true);
      try {
        const exists = await onCheckPartnerCode(partnerCode);
        if (!exists) {
          setPartnerError(language === 'ru' ? 'Код не найден' : 'Code not found');
          return;
        }
        onJoin(partnerCode);
      } catch (e) {
        setPartnerError(language === 'ru' ? 'Не удалось проверить код. Попробуйте позже.' : 'Cannot verify code right now. Please try again.');
      } finally {
        setIsCheckingPartner(false);
      }
    };

    run();
  };

  const handleSkip = () => {
    setStep(3);
  };

  const handleFinish = () => {
    onComplete({
      startDate: date,
      coupleMode: 'SOLO',
      isConnected: false,
    });
  };

  useEffect(() => {
    if (step !== 2 || !date || myCode) return;
    let cancelled = false;
    const fetchCode = async () => {
      setIsLoadingCode(true);
      try {
        const code = await onRequestInviteCode(date);
        if (!cancelled) setMyCode(code);
      } catch (e) {
        console.error('Не удалось получить invite code', e);
      } finally {
        if (!cancelled) setIsLoadingCode(false);
      }
    };
    fetchCode();
    return () => { cancelled = true; };
  }, [step, date, myCode, onRequestInviteCode]);

  // STEP 1: DATE
  if (step === 1) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <LinearGradient
          colors={['#f5ede4', '#f0d4c4', '#e8ddd4']}
          style={StyleSheet.absoluteFill}
        />
        <NoiseOverlay />
        
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.iconContainer}>
            <BlurView intensity={80} style={styles.iconBlur}>
              <Heart size={48} color="#9c88ff" fill="#9c88ff" />
            </BlurView>
          </View>

          <Text style={styles.title}>{t.step1Title}</Text>
          <Text style={styles.description}>{t.step1Desc}</Text>

          <View style={styles.form}>
            <TouchableOpacity
              style={styles.dateInput}
              onPress={() => setShowDatePicker(true)}
              activeOpacity={0.8}
            >
              <Text style={[styles.dateText, !date && styles.placeholderText]}>
                {date || 'YYYY-MM-DD'}
              </Text>
            </TouchableOpacity>

            {showDatePicker && (
              <DateTimePicker
                value={date ? new Date(date) : new Date()}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={onDateChange}
                maximumDate={new Date()}
              />
            )}
            
            <TouchableOpacity
              onPress={handleDateSubmit}
              disabled={!date}
              style={[styles.button, styles.primaryButton, !date && styles.buttonDisabled]}
              activeOpacity={0.8}
            >
              <Text style={styles.buttonText}>Next</Text>
              <ArrowRight size={18} color="white" />
            </TouchableOpacity>
            
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity
              onPress={() => setStep(2)}
              style={styles.linkButton}
            >
              <Text style={styles.linkButtonText}>
                {language === 'ru' ? 'У меня уже есть код партнёра' : 'I already have a partner code'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // STEP 2: INVITE
  if (step === 2) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <LinearGradient
          colors={['#f5ede4', '#f0d4c4', '#e8ddd4']}
          style={StyleSheet.absoluteFill}
        />
        <NoiseOverlay />
        
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.iconContainer}>
            <BlurView intensity={80} style={styles.iconBlur}>
              <Users size={48} color="#9c88ff" />
            </BlurView>
          </View>

          <Text style={styles.title}>{t.step2Title}</Text>
          
          <View style={styles.inviteSection}>
            <BlurView intensity={80} style={styles.inviteCard}>
              <Text style={styles.inviteLabel}>{t.yourCode}</Text>
              <View style={styles.codeContainer}>
                <TouchableOpacity
                  onPress={handleCopy}
                  style={styles.codeBox}
                  activeOpacity={0.8}
                >
                  <Text style={styles.codeText}>
                    {isLoadingCode ? '••••••' : (myCode || '— — —')}
                  </Text>
                  {copied ? (
                    <Check size={18} color="#22c55e" />
                  ) : (
                    <Copy size={18} color="rgba(45, 42, 41, 0.6)" />
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleShare}
                  disabled={!myCode}
                  style={[styles.shareButton, !myCode && styles.buttonDisabled]}
                  activeOpacity={0.8}
                >
                  <Share2 size={18} color="#2d2a29" />
                </TouchableOpacity>
              </View>
              {shareError && (
                <Text style={styles.errorText}>{shareError}</Text>
              )}
            </BlurView>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>PARTNER'S CODE</Text>
              <View style={styles.dividerLine} />
            </View>

            <TextInput
              style={styles.partnerInput}
              value={partnerCode}
              onChangeText={(text) => setPartnerCode(text.toUpperCase())}
              placeholder={t.enterCode}
              placeholderTextColor="rgba(45, 42, 41, 0.4)"
              maxLength={10}
              textAlign="center"
            />

            <View style={styles.actions}>
              <TouchableOpacity
                onPress={handleConnect}
                disabled={partnerCode.length < 4 || isCheckingPartner}
                style={[styles.button, styles.connectButton, (partnerCode.length < 4 || isCheckingPartner) && styles.buttonDisabled]}
                activeOpacity={0.8}
              >
                <Text style={styles.buttonText}>
                  {isCheckingPartner 
                    ? (language === 'ru' ? 'Проверяю…' : 'Checking…')
                    : t.connectBtn}
                </Text>
              </TouchableOpacity>
              {partnerError && (
                <Text style={styles.errorText}>{partnerError}</Text>
              )}
              <TouchableOpacity
                onPress={handleSkip}
                style={styles.skipButton}
              >
                <Text style={styles.skipButtonText}>{t.skipBtn}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // STEP 3: FINISH
  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <LinearGradient
        colors={['#f5ede4', '#f0d4c4', '#e8ddd4']}
        style={StyleSheet.absoluteFill}
      />
      <NoiseOverlay />
      
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.iconContainer}>
          <BlurView intensity={80} style={styles.iconBlur}>
            <Sparkles size={48} color="#9c88ff" />
          </BlurView>
        </View>

        <Text style={styles.title}>{t.step3Title}</Text>
        <Text style={styles.description}>{t.step3Desc}</Text>

        <TouchableOpacity
          onPress={handleFinish}
          style={[styles.button, styles.primaryButton]}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>{t.letsGo}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  iconContainer: {
    marginBottom: 32,
  },
  iconBlur: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    shadowColor: '#9c88ff',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
  },
  title: {
    fontSize: 24,
    fontFamily: 'System',
    fontStyle: 'italic',
    color: '#2d2a29',
    marginBottom: 16,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    color: 'rgba(45, 42, 41, 0.6)',
    marginBottom: 48,
    textAlign: 'center',
    maxWidth: 300,
  },
  form: {
    width: '100%',
    maxWidth: 300,
    gap: 24,
  },
  dateInput: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#9c88ff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  dateText: {
    fontSize: 18,
    fontFamily: 'monospace',
    color: '#2d2a29',
  },
  placeholderText: {
    color: 'rgba(45, 42, 41, 0.4)',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
  },
  primaryButton: {
    backgroundColor: '#9c88ff',
    shadowColor: '#9c88ff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  connectButton: {
    backgroundColor: '#2d2a29',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '500',
    color: 'white',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  dividerText: {
    fontSize: 10,
    fontFamily: 'monospace',
    textTransform: 'uppercase',
    color: 'rgba(45, 42, 41, 0.6)',
  },
  linkButton: {
    paddingVertical: 12,
  },
  linkButtonText: {
    fontSize: 14,
    color: 'rgba(45, 42, 41, 0.7)',
    textAlign: 'center',
  },
  inviteSection: {
    width: '100%',
    maxWidth: 300,
    gap: 24,
  },
  inviteCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.6)',
  },
  inviteLabel: {
    fontSize: 10,
    fontFamily: 'monospace',
    textTransform: 'uppercase',
    letterSpacing: 2,
    color: 'rgba(45, 42, 41, 0.6)',
    marginBottom: 8,
  },
  codeContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  codeBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  codeText: {
    fontSize: 20,
    fontFamily: 'monospace',
    fontWeight: 'bold',
    letterSpacing: 3.5,
    color: '#2d2a29',
  },
  shareButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  partnerInput: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: 12,
    padding: 16,
    fontSize: 18,
    fontFamily: 'monospace',
    color: '#2d2a29',
  },
  actions: {
    gap: 12,
  },
  skipButton: {
    paddingVertical: 12,
  },
  skipButtonText: {
    fontSize: 14,
    color: 'rgba(45, 42, 41, 0.6)',
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
  errorText: {
    fontSize: 12,
    color: '#dc2626',
    marginTop: 8,
  },
});

export default Onboarding;
