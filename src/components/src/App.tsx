import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Alert, ActivityIndicator, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { UserSettings, Memory, Tab } from './types';
import { translations } from './utils/translations';
import { api } from './services/api';
import { storage, loadCachedJson, saveCachedJson } from './utils/storage';
import * as Localization from 'expo-localization';
import NetInfo from '@react-native-community/netinfo';
import { useSocket } from './hooks/useSocket';
import * as Linking from 'expo-linking';
import * as Clipboard from 'expo-clipboard';
import * as Sharing from 'expo-sharing';

import Dashboard from './components/Dashboard';
import StoryTimeline from './components/story/StoryTimeline';
import Navigation from './components/Navigation';
import Auth from './components/Auth';
import Onboarding from './components/Onboarding';
import Calendar from './components/Calendar';
import Settings from './components/Settings';
import CameraModal from './components/CameraModal';
import { Toast } from './components/Toast';

const detectBrowserLanguage = (): 'en' | 'ru' => {
  const locales = Localization.getLocales();
  const langCode = locales[0]?.languageCode ?? 'en';
  if (langCode === 'ru') {
    return 'ru';
  }
  return 'en';
};

const App: React.FC = () => {
  // Аутентификация
  const [userUid, setUserUid] = useState<string | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [authProfile, setAuthProfile] = useState<{ email?: string | null; phone?: string | null; name?: string | null } | null>(null);
  const [pendingStartDate, setPendingStartDate] = useState<string | null>(null);
  const [pendingJoinCode, setPendingJoinCode] = useState<string | null>(null);
  const [authRequired, setAuthRequired] = useState(false);
  const [pendingInvite, setPendingInvite] = useState<{ code: string; startDate: string } | null>(null);
  const [inviteFromUrl, setInviteFromUrl] = useState<string | null>(null);
  const [isLoadingUserData, setIsLoadingUserData] = useState(false);

  const getInitialLanguage = (): 'en' | 'ru' => {
    return detectBrowserLanguage();
  };

  const getInitialSettings = async (): Promise<UserSettings> => {
    const savedDate = await storage.getItem('start_date');
    const savedCode = await storage.getItem('invite_code');
    const savedLang = await storage.getItem('app_language') as 'en' | 'ru' | null;
    
    return {
      startDate: savedDate,
      language: savedLang || getInitialLanguage(),
      customEvents: [],
      coupleMode: savedDate ? 'SOLO' : 'SOLO',
      inviteCode: savedCode,
      isConnected: false,
    };
  };

  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>(Tab.HOME);
  const [isLoaded, setIsLoaded] = useState(false);
  const [booted, setBooted] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const isAnonymousUser = !!userUid && !authProfile?.email && !authProfile?.phone;
  const t = settings ? translations[settings.language || 'en'] : translations.en;

  // Инициализация настроек
  useEffect(() => {
    const init = async () => {
      const initialSettings = await getInitialSettings();
      setSettings(initialSettings);
      setIsLoaded(true);
    };
    init();
  }, []);

  // Проверка invite кода из URL
  useEffect(() => {
    const checkUrl = async () => {
      const url = await Linking.getInitialURL();
      if (url) {
        const parsed = Linking.parse(url);
        if (parsed.queryParams?.invite) {
          setInviteFromUrl(parsed.queryParams.invite as string);
        }
      }
    };
    checkUrl();
  }, []);

  // Проверка онлайн статуса
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(state.isConnected ?? false);
    });
    return () => unsubscribe();
  }, []);

  // Проверка сессии
  useEffect(() => {
    let cancelled = false;
    api.getCurrentSession()
      .then((session) => {
        if (cancelled) return;
        setUserUid(session?.userId || null);
        setAuthProfile(session ? { email: session.email, phone: session.phone, name: session.name } : null);
      })
      .finally(() => {
        if (!cancelled) setIsCheckingAuth(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setBooted(true);
  }, []);

  // Если требовался логин для join — выполняем join сразу после успешной авторизации
  useEffect(() => {
    if (!userUid) return;
    if (!pendingJoinCode) return;
    const code = pendingJoinCode;
    setPendingJoinCode(null);
    setAuthRequired(false);
    handleJoinByCode(code);
  }, [userUid, pendingJoinCode]);

  const refreshMemories = useCallback(async (uid: string | null) => {
    // ВАЖНО: Если пользователь не авторизован (uid === null), мы не должны делать запрос к базе.
    // Это предотвращает ошибку "AppwriteException: User (role: guests) missing scope (documents.read)"
    if (!uid) {
        console.log("Пользователь не авторизован, пропускаем загрузку воспоминаний.");
        return;
    }
    
    if (!settings) return;
    const cacheKey = `memories_cache_${uid}`;

    if (!isOnline) {
      const cached = await loadCachedJson<Memory[]>(cacheKey);
      if (cached) setMemories(cached);
      return;
    }

    try {
      setIsSyncing(true);
      const freshMemories = await api.getMemories(uid);
      setMemories(freshMemories);
      await saveCachedJson(cacheKey, freshMemories);
    } catch (err) {
      console.error("Ошибка загрузки воспоминаний:", err);
      const cached = await loadCachedJson<Memory[]>(cacheKey);
      if (cached) {
        setMemories(cached);
      }
    } finally {
      setIsSyncing(false);
    }
  }, [isOnline, settings]);


  const handleRealtimeMessage = useCallback(async (message: any) => {
    console.log("Сигнал получен!", message);

    if (message.type !== 'updated') return;
    const payload = message.payload;

    const collectionId = payload.$collectionId || payload.collectionId ||
      (message.events && message.events[0]?.includes('pairs') ? 'pairs' :
        message.events && message.events[0]?.includes('memories') ? 'memories' : null);

    if (collectionId === 'pairs' || (!collectionId && payload.startDate)) {
      if (payload.users && Array.isArray(payload.users) && payload.users.includes(userUid)) {
        if (payload.status === 'active' || payload.status === 'together') {
          if (payload.startDate) {
            await storage.setItem('start_date', payload.startDate);

            setSettings(prev => {
              const newSettings = {
                ...prev!,
                startDate: payload.startDate,
                inviteCode: payload.inviteCode || prev?.inviteCode,
                isConnected: true,
                coupleMode: 'TOGETHER' as const
              };

              // Устранение бесконечных ререндеров: глубокое сравнение
              if (JSON.stringify(prev) === JSON.stringify(newSettings)) {
                return prev;
              }
              
              return newSettings;
            });
          }
        }
        await refreshMemories(userUid);
      }
    }

    if (collectionId === 'memories' || (!collectionId && payload.content)) {
      await refreshMemories(userUid);
    }
  }, [refreshMemories, userUid]);

  useSocket(userUid, handleRealtimeMessage);

  // Первичная загрузка данных
  useEffect(() => {
    const initApp = async () => {
      try {
        if (!userUid) return;

        setIsLoadingUserData(true);
        const pairCacheKey = `pair_cache_${userUid}`;
        if (!isOnline) {
          const cachedPair = await loadCachedJson<any>(pairCacheKey);
          if (cachedPair?.start_date) {
            setSettings(prev => ({
              ...prev!,
              startDate: cachedPair.start_date,
              inviteCode: cachedPair.invite_code || prev?.inviteCode,
              isConnected: true,
              coupleMode: 'TOGETHER'
            }));
          }
          await refreshMemories(userUid);
          return;
        }

        try {
          const pair = await api.getPairData(userUid);
          if (pair?.start_date) {
            await storage.setItem('start_date', pair.start_date);
            await storage.setItem('invite_code', pair.invite_code || '');
            await saveCachedJson(pairCacheKey, pair);

            setSettings(prev => {
              const newSettings = {
                ...prev!,
                startDate: pair.start_date,
                inviteCode: pair.invite_code || prev?.inviteCode,
                isConnected: true,
                coupleMode: 'TOGETHER' as const
              };

              // Устранение бесконечных ререндеров: глубокое сравнение
              if (JSON.stringify(prev) === JSON.stringify(newSettings)) {
                return prev;
              }
              
              return newSettings;
            });
          }
        } catch (err: any) {
          if (err.code !== 404) {
            console.error("Ошибка загрузки пары:", err);
          }
        }

        await refreshMemories(userUid);
      } catch (err) {
        console.error("Ошибка инициализации:", err);
      } finally {
        setIsLoadingUserData(false);
      }
    };
    initApp();
  }, [userUid, isOnline, refreshMemories]);

  const handleDeleteMemory = async (id: string) => {
    if (!id || !userUid) return;
    
    try {
      setMemories(prev => prev.filter(m => m.id !== id));
      await api.deleteMemory(userUid, id);
      const cacheKey = `memories_cache_${userUid}`;
      await storage.removeItem(cacheKey);
      await refreshMemories(userUid);
    } catch (error: any) {
      console.error('Ошибка удаления воспоминания:', error);
      Alert.alert(
        settings?.language === 'ru' ? 'Ошибка' : 'Error',
        settings?.language === 'ru' ? 'Не удалось удалить воспоминание' : 'Failed to delete memory'
      );
      await refreshMemories(userUid);
    }
  };

  const handleAddPartnerNote = async (memoryId: string, text: string) => {
    if (!userUid) return;
    try {
      await api.updateMemory(userUid, memoryId, {
        noteB: text,
        authorB: userUid
      });

      setMemories(prev => prev.map(m => 
        m.id === memoryId 
          ? { ...m, noteB: text, authorB: userUid }
          : m
      ));
    } catch (error) {
      console.error("Ошибка добавления заметки партнера:", error);
      Alert.alert(
        settings?.language === 'ru' ? 'Ошибка' : 'Error',
        settings?.language === 'ru' ? 'Не удалось добавить заметку' : 'Failed to add note'
      );
    }
  };

  const handleCopyCode = async () => {
    if (settings?.inviteCode) {
      await Clipboard.setStringAsync(settings.inviteCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleShareInviteCode = async () => {
    if (!settings?.inviteCode) return;
    try {
      const link = `https://lovetracker.app/invite/${settings.inviteCode}`;
      await Share.share({
        message: settings.language === 'ru' 
          ? `Присоединяйся ко мне в Love App с кодом: ${settings.inviteCode}\n${link}`
          : `Join me in Love App with code: ${settings.inviteCode}\n${link}`,
        url: link,
      });
    } catch (e) {
      console.error('Share failed', e);
    }
  };

  const handleExportData = async () => {
    if (!userUid || !settings) return;
    setIsExporting(true);
    try {
      // Экспорт данных - функция может быть не реализована в API
      console.log('Export data requested for user:', userUid);
      
      Alert.alert(
        settings.language === 'ru' ? 'Успех' : 'Success',
        settings.language === 'ru' ? 'Экспорт данных в разработке' : 'Data export in development'
      );
    } catch (err) {
      console.error("Ошибка экспорта:", err);
      Alert.alert(
        settings?.language === 'ru' ? 'Ошибка' : 'Error',
        settings?.language === 'ru' ? 'Ошибка экспорта данных' : 'Export failed'
      );
    } finally {
      setIsExporting(false);
    }
  };

  const handleReset = async () => {
    if (!settings) return;
    const currentLang = settings.language;
    
    try {
      await api.logout();
    } catch (e) {
      console.error('Logout error:', e);
    }

    await storage.removeItem('start_date');
    await storage.removeItem('invite_code');

    setSettings({
      startDate: null,
      language: currentLang,
      customEvents: [],
      coupleMode: 'SOLO',
      inviteCode: null,
      isConnected: false
    });
    setMemories([]);
    setUserUid(null);
    setAuthProfile(null);
    setActiveTab(Tab.HOME);
  };

  const handleDeleteAllData = async () => {
    if (!userUid || !settings) return;
    
    setIsDeleting(true);
    try {
      // Удаление всех данных - функция может быть не реализована в API
      console.log('Delete all data requested for user:', userUid);
      
      await handleReset();
      
      Alert.alert(
        settings.language === 'ru' ? 'Успех' : 'Success',
        settings.language === 'ru' 
          ? 'Данные сброшены' 
          : 'Data reset successfully'
      );
    } catch (err: any) {
      console.error("Ошибка удаления:", err);
      Alert.alert(
        settings.language === 'ru' ? 'Ошибка' : 'Error',
        err.message || (settings.language === 'ru' ? 'Ошибка удаления данных' : 'Failed to delete data')
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteEvent = useCallback((id: string) => {
    if (!settings) return;
    setSettings(prev => ({
      ...prev!,
      customEvents: prev!.customEvents.filter(e => e.id !== id)
    }));
  }, [settings]);

  const handleLanguageChange = useCallback(async (lang: 'en' | 'ru') => {
    if (!settings) return;
    await storage.setItem('app_language', lang);
    setSettings(prev => {
      if (prev?.language === lang) return prev;
      return { ...prev!, language: lang };
    });
  }, [settings]);

  const handleJoinByCode = useCallback(async (code: string) => {
    if (!userUid || isAnonymousUser) {
      setPendingJoinCode(code);
      setAuthRequired(true);
      return;
    }
    try {
      const result = await api.joinPair(userUid, code);
      
      if (!result.start_date) {
        console.error("Ошибка: start_date не получен от сервера");
        Alert.alert(
          settings?.language === 'ru' ? 'Ошибка' : 'Error',
          settings?.language === 'ru' ? 'Ошибка синхронизации данных. Попробуйте снова.' : 'Data sync error. Please try again.'
        );
        return;
      }
      
      await storage.setItem('start_date', result.start_date);
      await storage.setItem('invite_code', code);

      setSettings(prev => ({
        ...prev!,
        startDate: result.start_date,
        isConnected: true,
        coupleMode: 'TOGETHER',
        inviteCode: code 
      }));

      await refreshMemories(userUid);
      
      Alert.alert(
        settings?.language === 'ru' ? 'Успех' : 'Success',
        settings?.language === 'ru' ? 'Успешное подключение!' : 'Successfully connected!'
      );
    } catch (err) {
      console.error("Ошибка присоединения:", err);
      Alert.alert(
        settings?.language === 'ru' ? 'Ошибка' : 'Error',
        settings?.language === 'ru' ? 'Код неверный или пара уже заполнена' : 'Invalid code or pair is full'
      );
    }
  }, [userUid, isAnonymousUser, settings, refreshMemories]);

  const requestInviteCode = useCallback(async (selectedDate: string) => {
    if (!userUid || isAnonymousUser) {
      setPendingStartDate(selectedDate);
      setAuthRequired(true);
      throw new Error('AUTH_REQUIRED');
    }
    if (pendingInvite && pendingInvite.startDate === selectedDate && pendingInvite.code) {
      return pendingInvite.code;
    }

    const dateToUse = selectedDate || new Date().toISOString();
    const result = await api.createPair(userUid, dateToUse);
    const inviteCode = result.invite_code;
    const startDate = result.start_date || dateToUse;

    setPendingInvite({ code: inviteCode, startDate });
    await storage.setItem('invite_code', inviteCode);
    await storage.setItem('start_date', startDate);
    return inviteCode;
  }, [userUid, isAnonymousUser, pendingInvite]);

  const handleOnboardingComplete = useCallback(async (newSettings: Partial<UserSettings>) => {
    if (newSettings.startDate) {
      await storage.setItem('start_date', newSettings.startDate);
    }
    setSettings(prev => {
      const updated = { ...prev!, ...newSettings };
      if (JSON.stringify(prev) === JSON.stringify(updated)) return prev;
      return updated;
    });
  }, []);

  const openAddModal = useCallback(() => {
    setIsCameraOpen(true);
  }, []);

  const handlePhotoTaken = useCallback(async (uri: string) => {
    setIsCameraOpen(false);
    setIsUploadingPhoto(true);
    
    try {
      await api.uploadMemory(userUid, uri);
      
      setToastMessage(settings?.language === 'ru' ? 'История сохранена!' : 'Memory saved!');
      setTimeout(() => setToastMessage(null), 3000);
      
      // Обновляем список воспоминаний
      await refreshMemories(userUid);
    } catch (error: any) {
      console.error('Ошибка загрузки фото:', error);
      
      // Показываем понятное сообщение об ошибке
      let errorMessage = settings?.language === 'ru' 
        ? 'Не удалось сохранить историю' 
        : 'Failed to save memory';
      
      if (!isOnline) {
        errorMessage = settings?.language === 'ru' 
          ? 'Ошибка сети. Проверьте подключение к интернету.' 
          : 'Network error. Check your internet connection.';
      } else if (error.message?.includes('Файл не найден')) {
        errorMessage = settings?.language === 'ru' 
          ? 'Ошибка доступа к файлу' 
          : 'File access error';
      } else if (error.message?.includes('Storage')) {
        errorMessage = settings?.language === 'ru' 
          ? 'Ошибка загрузки на сервер' 
          : 'Server upload error';
      }
      
      // Показываем Alert с подробной информацией
      Alert.alert(
        settings?.language === 'ru' ? 'Ошибка загрузки' : 'Upload Error',
        errorMessage,
        [{ text: 'OK' }]
      );
      
      setToastMessage(errorMessage);
      setTimeout(() => setToastMessage(null), 3000);
    } finally {
      setIsUploadingPhoto(false);
    }
  }, [userUid, settings, isOnline, refreshMemories]);

  if (!booted || !settings || isCheckingAuth || isLoadingUserData) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <StatusBar style="auto" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2d2a29" />
        </View>
      </SafeAreaView>
    );
  }

  // Если требуется авторизация
  if (authRequired && !userUid) {
    return (
      <Auth
        language={settings.language}
        onAuthSuccess={async () => {
          const session = await api.getCurrentSession();
          setUserUid(session?.userId || null);
          setAuthProfile(session ? { email: session.email, phone: null, name: session.name } : null);
          setAuthRequired(false);
        }}
      />
    );
  }

  // Если нет даты начала - показываем Onboarding
  if (!settings.startDate) {
    return (
      <Onboarding 
        language={settings.language}
        onComplete={handleOnboardingComplete} 
        onJoin={handleJoinByCode}
        onRequestInviteCode={requestInviteCode}
        onCheckPartnerCode={async (code) => {
          const res = await api.checkInviteCode(code);
          return !!res?.exists;
        }}
        initialInviteCode={pendingInvite?.code}
        initialStep={pendingStartDate && userUid ? 2 : (inviteFromUrl ? 2 : 1)}
        prefillPartnerCode={inviteFromUrl || undefined}
        prefillDate={pendingStartDate || undefined}
        onDateSelected={(date) => {
          if (!userUid || isAnonymousUser) {
            setPendingStartDate(date);
            setAuthRequired(true);
            return true;
          }
          return false;
        }}
      />
    );
  }

  // После выбора даты требуем реальную авторизацию
  if (!userUid || isAnonymousUser) {
    return (
      <Auth
        language={settings.language}
        onAuthSuccess={async () => {
          const session = await api.getCurrentSession();
          setUserUid(session?.userId || null);
          setAuthProfile(session ? { email: session.email, phone: null, name: session.name } : null);
        }}
      />
    );
  }

const renderContent = () => {
  // Добавляем обертку с отступом сверху, чтобы контент не залезал под челку
  return (
    <View style={{ flex: 1, paddingTop: 20 }}> 
      {(() => {
        switch (activeTab) {
          case Tab.HOME:
            return <Dashboard settings={settings} userUid={userUid} onSettingsClick={() => setActiveTab(Tab.SETTINGS)} />;
          case Tab.TIMELINE:
            return (
              <StoryTimeline 
                memories={memories} 
                language={settings.language}
                userUid={userUid}
                isConnected={settings.isConnected}
                onAddClick={openAddModal} 
                onAddPartnerNote={handleAddPartnerNote}
                onInviteClick={() => setActiveTab(Tab.SETTINGS)}
                onDeleteMemory={handleDeleteMemory}
                settings={settings}
              />
            );
          case Tab.CALENDAR:
            return <Calendar settings={settings} onEventClick={(event) => console.log(event)} />;
          case Tab.SETTINGS:
            return (
              <Settings
                settings={settings}
                userUid={userUid}
                onLanguageChange={handleLanguageChange}
                onDeleteEvent={handleDeleteEvent}
                onExportData={handleExportData}
                onReset={handleReset}
                onLogout={handleReset} 
                onDeleteAllData={handleDeleteAllData}
                onCopyCode={handleCopyCode}
                onShareCode={handleShareInviteCode}
                copiedCode={copiedCode}
                isExporting={isExporting}
                isDeleting={isDeleting}
              />
            );
          default:
            return <Dashboard settings={settings} userUid={userUid} onSettingsClick={() => setActiveTab(Tab.SETTINGS)} />;
        }
      })()}
    </View>
  );
};

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar style="auto" />
      <View style={styles.mainContent}>
        {renderContent()}
      </View>
      
      {/* Navigation - скрывается когда камера открыта */}
      {!isCameraOpen && (
        <Navigation 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          onCameraClick={openAddModal} 
          language={settings.language} 
        />
      )}
      
      {/* Camera Modal - полноэкранный режим */}
      {isCameraOpen && (
        <View style={[StyleSheet.absoluteFill, { zIndex: 9999 }]}>
          <CameraModal
            onPhotoTaken={handlePhotoTaken}
            onClose={() => setIsCameraOpen(false)}
            language={settings.language}
          />
        </View>
      )}
      
      {/* Upload Indicator */}
      {isUploadingPhoto && (
        <View style={styles.uploadOverlay}>
          <View style={styles.uploadContainer}>
            <ActivityIndicator size="large" color="#e8b4a2" />
            <Text style={styles.uploadText}>
              {settings.language === 'ru' ? 'Сохранение...' : 'Saving...'}
            </Text>
          </View>
        </View>
      )}
      
      {/* Toast */}
      {toastMessage && (
        <Toast
          message={toastMessage}
          onDismiss={() => setToastMessage(null)}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5ede4',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainContent: {
    flex: 1,
  },
  uploadOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  uploadContainer: {
    backgroundColor: 'white',
    padding: 32,
    borderRadius: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
  },
  uploadText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '600',
    color: '#2d2a29',
  },
});

export default App;