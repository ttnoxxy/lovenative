import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { UserSettings } from '../types';
import { translations } from '../utils/translations';
import { Link, Globe, Calendar, Download, LogOut, X, Check, Copy, Share2 } from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import NoiseOverlay from './NoiseOverlay';

interface SettingsProps {
  settings: UserSettings;
  userUid: string | null;
  onLanguageChange: (lang: 'en' | 'ru') => void;
  onDeleteEvent: (id: string) => void;
  onExportData: () => Promise<void>;
  onReset: () => void;
  onLogout: () => void;
  onDeleteAllData: () => void;
  onCopyCode: () => void;
  onShareCode: () => void;
  copiedCode: boolean;
  isExporting: boolean;
  isDeleting: boolean;
}

const Settings: React.FC<SettingsProps> = ({
  settings,
  userUid,
  onLanguageChange,
  onDeleteEvent,
  onExportData,
  onReset,
  onLogout,
  onDeleteAllData,
  onCopyCode,
  onShareCode,
  copiedCode,
  isExporting,
  isDeleting,
}) => {
  const t = translations[settings.language];

  const handleDeleteEventConfirm = (eventId: string) => {
    Alert.alert(
      settings.language === 'ru' ? 'Удалить событие?' : 'Delete event?',
      settings.language === 'ru' ? 'Это действие нельзя отменить.' : 'This action cannot be undone.',
      [
        {
          text: settings.language === 'ru' ? 'Отмена' : 'Cancel',
          style: 'cancel',
        },
        {
          text: settings.language === 'ru' ? 'Удалить' : 'Delete',
          style: 'destructive',
          onPress: () => onDeleteEvent(eventId),
        },
      ]
    );
  };

  const handleResetConfirm = () => {
    Alert.alert(
      settings.language === 'ru' ? 'Покинуть пространство?' : 'Leave space?',
      settings.language === 'ru' 
        ? 'Вы выйдете из общего пространства. Ваши данные останутся, но вы больше не будете видеть данные партнера.'
        : 'You will leave the shared space. Your data will remain, but you will no longer see your partner\'s data.',
      [
        {
          text: settings.language === 'ru' ? 'Отмена' : 'Cancel',
          style: 'cancel',
        },
        {
          text: settings.language === 'ru' ? 'Покинуть' : 'Leave',
          style: 'destructive',
          onPress: onReset,
        },
      ]
    );
  };

  const handleLogoutConfirm = () => {
    Alert.alert(
      settings.language === 'ru' ? 'Выйти из аккаунта?' : 'Log out?',
      settings.language === 'ru' 
        ? 'Вы вернетесь на экран входа.'
        : 'You will be returned to the login screen.',
      [
        {
          text: settings.language === 'ru' ? 'Отмена' : 'Cancel',
          style: 'cancel',
        },
        {
          text: settings.language === 'ru' ? 'Выйти' : 'Log out',
          style: 'destructive',
          onPress: onLogout,
        },
      ]
    );
  };

  const handleDeleteAllConfirm = () => {
    Alert.alert(
      settings.language === 'ru' ? 'Удалить все данные?' : 'Delete all data?',
      settings.language === 'ru' 
        ? 'Это действие необратимо. Все ваши воспоминания, фотографии и данные будут удалены навсегда.'
        : 'This action is irreversible. All your memories, photos, and data will be permanently deleted.',
      [
        {
          text: settings.language === 'ru' ? 'Отмена' : 'Cancel',
          style: 'cancel',
        },
        {
          text: settings.language === 'ru' ? 'Удалить всё' : 'Delete All',
          style: 'destructive',
          onPress: onDeleteAllData,
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <LinearGradient
        colors={['#f5ede4', '#f0d4c4', '#e8ddd4']}
        style={StyleSheet.absoluteFill}
      />
      <NoiseOverlay />
      
      <ScrollView 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>{t.settings}</Text>
        
        <View style={styles.card}>
          {/* Connection Status */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Link size={18} color="#2d2a29" />
              <Text style={styles.sectionTitle}>{t.connection}</Text>
            </View>
            
            {settings.isConnected ? (
              <View style={styles.statusConnected}>
                <View style={styles.statusRow}>
                  <View style={styles.greenDot} />
                  <Text style={styles.statusText}>{t.statusTogether}</Text>
                </View>
                <Text style={styles.inviteCode}>{settings.inviteCode || '—'}</Text>
              </View>
            ) : (
              <View style={styles.statusWaiting}>
                <View style={styles.statusRow}>
                  <View style={styles.yellowDotContainer}>
                    <View style={styles.yellowDotPing} />
                    <View style={styles.yellowDot} />
                  </View>
                  <Text style={styles.statusText}>{t.waitingForPartner}</Text>
                </View>
                <Text style={styles.statusHint}>{t.step2Desc}</Text>
                
                {settings.inviteCode ? (
                  <View style={styles.inviteCodeRow}>
                    <TouchableOpacity
                      style={styles.inviteCodeBox}
                      onPress={onCopyCode}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.inviteCodeValue}>{settings.inviteCode}</Text>
                      {copiedCode ? (
                        <Check size={14} color="#22c55e" />
                      ) : (
                        <Copy size={14} color="rgba(45, 42, 41, 0.6)" />
                      )}
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.shareButton}
                      onPress={onShareCode}
                      activeOpacity={0.8}
                    >
                      <Share2 size={14} color="rgba(45, 42, 41, 0.6)" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.noCodeBox}>
                    <Text style={styles.noCodeText}>
                      {settings.language === 'ru' ? 'Создайте пару, чтобы получить код' : 'Create a pair to get code'}
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>

          {/* Language Selector */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Globe size={18} color="#2d2a29" />
              <Text style={styles.sectionTitle}>{t.language}</Text>
            </View>
            
            <View style={styles.languageSelector}>
              <TouchableOpacity
                style={[styles.languageButton, settings.language === 'en' && styles.languageButtonActive]}
                onPress={() => onLanguageChange('en')}
                activeOpacity={0.8}
              >
                <Text style={[styles.languageButtonText, settings.language === 'en' && styles.languageButtonTextActive]}>
                  EN
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.languageButton, settings.language === 'ru' && styles.languageButtonActive]}
                onPress={() => onLanguageChange('ru')}
                activeOpacity={0.8}
              >
                <Text style={[styles.languageButtonText, settings.language === 'ru' && styles.languageButtonTextActive]}>
                  RU
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Custom Events List */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Calendar size={18} color="#2d2a29" />
              <Text style={styles.sectionTitle}>{t.specialDates}</Text>
            </View>
            
            {settings.customEvents.length === 0 ? (
              <Text style={styles.emptyEventsText}>{t.addEventDesc}</Text>
            ) : (
              <View style={styles.eventsList}>
                {settings.customEvents.map(event => (
                  <View key={event.id} style={styles.eventItem}>
                    <View style={styles.eventContent}>
                      <Text style={styles.eventTitle}>
                        {event.type === 'anniversary' && '💍 '}
                        {event.type === 'vacation' && '✈️ '}
                        {event.type === 'holiday' && '🎄 '}
                        {event.title}
                      </Text>
                      <Text style={styles.eventDate}>
                        {new Date(event.date).toLocaleDateString()}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.deleteEventButton}
                      onPress={() => handleDeleteEventConfirm(event.id)}
                      activeOpacity={0.8}
                    >
                      <X size={14} color="rgba(45, 42, 41, 0.6)" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Actions */}
          <View style={styles.actionsSection}>
            <TouchableOpacity
              style={[styles.actionButton, styles.exportButton]}
              onPress={onExportData}
              disabled={isExporting}
              activeOpacity={0.8}
            >
              {isExporting ? (
                <>
                  <Text style={styles.actionButtonText}>
                    {settings.language === 'ru' ? 'Экспорт...' : 'Exporting...'}
                  </Text>
                </>
              ) : (
                <>
                  <Download size={16} color="#2d2a29" />
                  <Text style={styles.actionButtonText}>{t.exportBackup}</Text>
                </>
              )}
            </TouchableOpacity>

            <View style={styles.dangerActions}>
              <TouchableOpacity
                style={[styles.actionButton, styles.leaveButton]}
                onPress={handleLogoutConfirm}
                activeOpacity={0.8}
              >
                <LogOut size={16} color="#ea580c" />
                <Text style={[styles.actionButtonText, styles.leaveButtonText]}>
                  {settings.language === 'ru' ? 'Выйти' : 'Log out'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.leaveButton]}
                onPress={handleResetConfirm}
                activeOpacity={0.8}
              >
                <LogOut size={16} color="#ea580c" />
                <Text style={[styles.actionButtonText, styles.leaveButtonText]}>
                  {t.leaveSpace}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.deleteButton]}
                onPress={handleDeleteAllConfirm}
                disabled={isDeleting}
                activeOpacity={0.8}
              >
                <X size={16} color="#dc2626" />
                <Text style={[styles.actionButtonText, styles.deleteButtonText]}>
                  {settings.language === 'ru' ? 'Удалить все данные' : 'Delete All Data'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5ede4',
  },
  content: {
    paddingHorizontal: 32,
    paddingTop: 48,
    paddingBottom: 112,
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
    color: '#2d2a29',
    marginBottom: 32,
    textAlign: 'center',
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: 32,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.6)',
  },
  section: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
    paddingBottom: 24,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2d2a29',
  },
  statusConnected: {
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  greenDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22c55e',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2d2a29',
  },
  inviteCode: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: 'rgba(45, 42, 41, 0.7)',
    textTransform: 'uppercase',
  },
  statusWaiting: {
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: 12,
    padding: 16,
  },
  yellowDotContainer: {
    width: 8,
    height: 8,
    position: 'relative',
  },
  yellowDotPing: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#facc15',
    opacity: 0.6,
  },
  yellowDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#facc15',
  },
  statusHint: {
    fontSize: 12,
    color: 'rgba(45, 42, 41, 0.7)',
    marginTop: 8,
    marginBottom: 12,
  },
  inviteCodeRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  inviteCodeBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  inviteCodeValue: {
    fontSize: 14,
    fontFamily: 'monospace',
    letterSpacing: 2,
    color: '#2d2a29',
  },
  shareButton: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  noCodeBox: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  noCodeText: {
    fontSize: 12,
    color: 'rgba(45, 42, 41, 0.7)',
  },
  languageSelector: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 24,
    padding: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.6)',
  },
  languageButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    alignItems: 'center',
  },
  languageButtonActive: {
    backgroundColor: '#2d2a29',
  },
  languageButtonText: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: 'rgba(45, 42, 41, 0.7)',
  },
  languageButtonTextActive: {
    color: 'white',
  },
  emptyEventsText: {
    fontSize: 12,
    fontStyle: 'italic',
    color: 'rgba(45, 42, 41, 0.7)',
  },
  eventsList: {
    gap: 12,
  },
  eventItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 12,
    padding: 12,
  },
  eventContent: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2d2a29',
    marginBottom: 4,
  },
  eventDate: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: 'rgba(45, 42, 41, 0.7)',
  },
  deleteEventButton: {
    padding: 8,
  },
  actionsSection: {
    paddingTop: 16,
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
  },
  exportButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2d2a29',
  },
  dangerActions: {
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
    gap: 12,
  },
  leaveButton: {
    backgroundColor: 'rgba(234, 88, 12, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(234, 88, 12, 0.2)',
  },
  leaveButtonText: {
    color: '#ea580c',
  },
  deleteButton: {
    backgroundColor: 'rgba(220, 38, 38, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(220, 38, 38, 0.2)',
  },
  deleteButtonText: {
    color: '#dc2626',
  },
});

export default Settings;
