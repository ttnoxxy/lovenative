import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { ArrowRight, Mail, Lock, User } from 'lucide-react-native';
import { translations } from '../utils/translations';
import { api } from '../services/api';
import NoiseOverlay from './NoiseOverlay';

interface AuthProps {
  language: 'en' | 'ru';
  onAuthSuccess: (userId: string) => void | Promise<void>;
}

const Auth: React.FC<AuthProps> = ({ language, onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const t = translations[language];

  // Auto-check session on mount
  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const session = await api.getCurrentSession();
      if (session) {
        await onAuthSuccess(session.userId);
      }
    } catch (e) {
      // No session, stay on Auth screen
    }
  };

  const handleSubmit = async () => {
    if (!email || !password) {
      setError(language === 'ru' ? 'Заполните все поля' : 'Fill all fields');
      return;
    }
    
    if (!isLogin && !name) {
      setError(language === 'ru' ? 'Введите имя' : 'Enter your name');
      return;
    }

    if (password.length < 8) {
        setError(language === 'ru' ? 'Пароль должен быть не менее 8 символов' : 'Password must be at least 8 characters');
        return;
    }

    setIsLoading(true);
    setError(null);

    try {
      let result;
      if (isLogin) {
        result = await api.loginWithEmail(email, password);
      } else {
        result = await api.registerWithEmail(email, password, name);
      }
      
      await onAuthSuccess(result.userId);
    } catch (err: any) {
      console.error(err);
      setError(err.message || (language === 'ru' ? 'Ошибка авторизации' : 'Auth failed'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <LinearGradient
        colors={['#fef2f2', '#ffffff', '#fff7ed']}
        style={StyleSheet.absoluteFill}
      />
      <NoiseOverlay />
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <BlurView intensity={80} style={styles.card}>
            <Text style={styles.welcomeTitle}>
              {isLogin 
                ? (language === 'ru' ? 'С возвращением' : 'Welcome back') 
                : (language === 'ru' ? 'Создать аккаунт' : 'Create account')}
            </Text>
            <Text style={styles.welcomeSubtitle}>
              {isLogin 
                ? (language === 'ru' ? 'Войдите, чтобы продолжить' : 'Sign in to continue') 
                : (language === 'ru' ? 'Зарегистрируйтесь, чтобы начать' : 'Sign up to get started')}
            </Text>

            {!isLogin && (
              <View style={styles.inputContainer}>
                <User size={20} color="#2d2a29" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder={language === 'ru' ? 'Имя' : 'Name'}
                  placeholderTextColor="rgba(45, 42, 41, 0.4)"
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                />
              </View>
            )}

            <View style={styles.inputContainer}>
              <Mail size={20} color="#2d2a29" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder={language === 'ru' ? 'Email' : 'Email'}
                placeholderTextColor="rgba(45, 42, 41, 0.4)"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputContainer}>
              <Lock size={20} color="#2d2a29" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder={language === 'ru' ? 'Пароль' : 'Password'}
                placeholderTextColor="rgba(45, 42, 41, 0.4)"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            <TouchableOpacity
              onPress={handleSubmit}
              disabled={isLoading}
              style={[styles.button, isLoading && styles.buttonDisabled]}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <Text style={styles.buttonText}>
                    {isLogin 
                      ? (language === 'ru' ? 'Войти' : 'Sign In') 
                      : (language === 'ru' ? 'Создать аккаунт' : 'Create Account')}
                  </Text>
                  <ArrowRight size={20} color="white" />
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.switchButton}
              onPress={() => {
                setIsLogin(!isLogin);
                setError(null);
              }}
            >
              <Text style={styles.switchButtonText}>
                {isLogin 
                  ? (language === 'ru' ? 'Нет аккаунта? Зарегистрироваться' : 'No account? Sign up') 
                  : (language === 'ru' ? 'Уже есть аккаунт? Войти' : 'Have an account? Sign in')}
              </Text>
            </TouchableOpacity>

            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}
          </BlurView>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 32,
    padding: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 24 },
    shadowOpacity: 0.28,
    shadowRadius: 80,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.6)',
  },
  welcomeTitle: {
    fontSize: 28,
    fontFamily: 'System',
    fontWeight: '600',
    color: '#2d2a29',
    marginBottom: 8,
    textAlign: 'center',
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: 'rgba(45, 42, 41, 0.6)',
    marginBottom: 32,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
    height: 56,
  },
  inputIcon: {
    marginRight: 12,
    opacity: 0.5,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#2d2a29',
    height: '100%',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2d2a29',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  switchButton: {
    marginTop: 24,
    alignItems: 'center',
  },
  switchButtonText: {
    fontSize: 14,
    color: '#2d2a29',
    textDecorationLine: 'underline',
  },
  errorContainer: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 12,
    padding: 12,
    marginTop: 16,
  },
  errorText: {
    fontSize: 14,
    color: '#dc2626',
    textAlign: 'center',
  },
});

export default Auth;
