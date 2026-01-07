import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, ImageBackground, TextInput, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard, Animated } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useNavigation } from '@react-navigation/native';

export default function PartnerCodeScreen() {
  const [code, setCode] = useState('');
  const navigation = useNavigation();

  // --- Animated values ---
  const colorAnim = useRef(new Animated.Value(0)).current; // 0 = серый, 1 = насыщенный
  const heartAnim = useRef(new Animated.Value(1)).current; // масштаб сердца

  // --- эффект на изменение длины кода ---
  useEffect(() => {
    const isActive = code.length >= 8;

    Animated.timing(colorAnim, {
      toValue: isActive ? 1 : 0,
      duration: 400,
      useNativeDriver: false,
    }).start();

    if (isActive) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(heartAnim, { toValue: 1.3, duration: 300, useNativeDriver: true }),
          Animated.timing(heartAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
        ])
      ).start();
    } else {
      heartAnim.setValue(1);
    }
  }, [code]);

  const handleConnect = useCallback(() => {
    if (code.length >= 8) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      console.log('Connecting with code:', code);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }, [code]);

  const handleCopyCode = useCallback(() => {
    const myCode = 'LOVE-8821';
    navigator.clipboard.writeText(myCode); // для web
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const backgroundColor = colorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#AAA', '#FF4D6D'] // серый → насыщенный
  });

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        <LinearGradient
          colors={['#FDFCFB', '#F2E2D2', '#E2D1C3']}
          style={StyleSheet.absoluteFill}
        />
        <ImageBackground
          source={{ uri: 'https://www.transparenttextures.com/patterns/tactile-noise-light.png' }}
          style={styles.noiseOverlay}
          resizeMode="repeat"
          pointerEvents="none"
        />

        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
          style={styles.content}
        >
          {/* Кнопка назад */}
          <Pressable style={styles.backButton} onPress={() => { Haptics.selectionAsync(); navigation.goBack(); }}>
            <Ionicons name="chevron-back" size={24} color="rgba(0,0,0,0.5)" />
          </Pressable>

          <View style={styles.centerBlock}>
            <Text style={styles.mainTitle}>Связь с партнером</Text>
            
            <View style={styles.glassWrapper}>
              <BlurView intensity={90} tint="light" style={styles.liquidGlassCard}>
                <Text style={styles.label}>ВВЕДИТЕ УНИКАЛЬНЫЙ КОД</Text>
                
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    placeholder="XXXX-XXXX"
                    placeholderTextColor="rgba(0,0,0,0.2)"
                    value={code}
                    onChangeText={(text) => setCode(text.toUpperCase())}
                    autoCapitalize="characters"
                    autoCorrect={false}
                    maxLength={12}
                  />
                </View>

                <Text style={styles.helperText}>
                  Попросите партнера отправить вам код из его приложения, чтобы объединить ваши аккаунты.
                </Text>

                <Animated.View style={[styles.connectBtn, { backgroundColor }]}>
                  <Pressable
                    style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', width: '100%' }}
                    disabled={code.length < 8}
                    onPress={handleConnect}
                  >
                    <Text style={styles.connectText}>Связаться</Text>
                    <Animated.View style={{ transform: [{ scale: heartAnim }] }}>
                      <Ionicons 
                        name="heart" 
                        size={20} 
                        color="#FFF" 
                        style={{ marginLeft: 8 }}
                      />
                    </Animated.View>
                  </Pressable>
                </Animated.View>
              </BlurView>
            </View>
          </View>

          {/* Футер: информация о своем коде */}
          <View style={styles.footer}>
            <Text style={styles.myCodeLabel}>Ваш код для партнера:</Text>
            <Pressable style={styles.myCodeBadge} onPress={handleCopyCode}>
              <Text style={styles.myCodeText}>LOVE-8821</Text>
              <Ionicons name="copy-outline" size={16} color="#444" style={{ marginLeft: 10 }} />
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </View>
    </TouchableWithoutFeedback>
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
    justifyContent: 'center',
    zIndex: 2,
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: 20,
    padding: 10,
    zIndex: 10,
  },
  centerBlock: { alignItems: 'center', width: '100%' },
  mainTitle: {
    fontSize: 28,
    fontWeight: '200',
    color: '#1a1a1a',
    marginBottom: 40,
    textAlign: 'center',
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
  inputContainer: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderRadius: 22,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.8)',
  },
  input: {
    paddingVertical: 18,
    paddingHorizontal: 20,
    fontSize: 18,
    textAlign: 'center',
    color: '#333',
    fontWeight: '600',
    letterSpacing: 2,
  },
  helperText: {
    fontSize: 13,
    color: 'rgba(0,0,0,0.4)',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 25,
    paddingHorizontal: 10,
  },
  connectBtn: {
    width: '100%',
    paddingVertical: 18,
    borderRadius: 22,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  connectText: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: '700',
  },
  footer: {
    marginTop: 40,
    alignItems: 'center',
  },
  myCodeLabel: {
    fontSize: 12,
    color: 'rgba(0,0,0,0.4)',
    marginBottom: 10,
  },
  myCodeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.4)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  myCodeText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#444',
    letterSpacing: 1,
  },
});
