import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { BlurView } from 'expo-blur';
import { StoryFilter } from '../../types';
import { ChevronRight } from 'lucide-react-native';

interface StoryHeaderProps {
  activeFilter: StoryFilter;
  onFilterChange: (filter: StoryFilter) => void;
  language: 'en' | 'ru';
  isConnected?: boolean;
  onInviteClick?: () => void;
  settings?: any;
}

const StoryHeader: React.FC<StoryHeaderProps> = ({ 
  activeFilter, 
  onFilterChange, 
  language,
  isConnected = false,
  onInviteClick,
  settings
}) => {
  const filters: { key: StoryFilter; label: { en: string; ru: string } }[] = [
    { key: 'all', label: { en: 'All', ru: 'Все' } },
    { key: 'photos', label: { en: 'Photos', ru: 'Фото' } },
    { key: 'notes', label: { en: 'Notes', ru: 'Заметки' } },
    { key: 'milestones', label: { en: 'Milestones', ru: 'Вехи' } },
  ];

  return (
    <View style={styles.container}>
      <BlurView intensity={80} style={styles.blurContainer}>
        <View style={styles.content}>
          {/* Статус и кнопка приглашения */}
          {!isConnected && (
            <View style={styles.statusRow}>
              <View style={styles.statusCapsule}>
                <View style={styles.yellowDot} />
                <Text style={styles.statusText}>
                  {language === 'ru' ? 'ЖДЕМ ПАРТНЕРА' : 'WAITING FOR PARTNER'}
                </Text>
              </View>
              
              {onInviteClick && (
                <TouchableOpacity onPress={onInviteClick} style={styles.inviteButton}>
                  <Text style={styles.inviteText}>
                    {language === 'ru' ? 'ПРИГЛАСИТЬ' : 'INVITE'}
                  </Text>
                  <ChevronRight size={14} color="#2d2a29" />
                </TouchableOpacity>
              )}
            </View>
          )}
          
          {isConnected && (
            <View style={styles.statusRow}>
              <View style={styles.statusCapsule}>
                <View style={styles.greenDot} />
                <Text style={styles.statusText}>
                  {language === 'ru' ? 'ВМЕСТЕ' : 'TOGETHER'}
                </Text>
              </View>
            </View>
          )}

          {/* Заголовок */}
          <Text style={styles.title}>
            {language === 'ru' ? 'Наша история' : 'Our Story'}
          </Text>
          
          {/* Фильтры */}
          <View style={styles.filtersContainer}>
            {filters.map((filter) => (
              <TouchableOpacity
                key={filter.key}
                onPress={() => onFilterChange(filter.key)}
                style={styles.filterButton}
              >
                <Text style={[
                  styles.filterText,
                  activeFilter === filter.key && styles.filterTextActive
                ]}>
                  {filter.label[language]}
                </Text>
                {activeFilter === filter.key && <View style={styles.filterUnderline} />}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </BlurView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 40,
    paddingBottom: 16, // Добавлен отступ снизу
  },
  blurContainer: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 32, // Увеличен отступ сверху
    paddingBottom: 24, // Увеличен отступ снизу
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  statusCapsule: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  yellowDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ffcc00',
  },
  greenDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22c55e',
  },
  statusText: {
    fontSize: 10,
    fontFamily: 'System',
    fontWeight: '300',
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: '#2d2a29',
  },
  inviteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  inviteText: {
    fontSize: 10,
    fontFamily: 'System',
    fontWeight: '300',
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: '#2d2a29',
  },
  title: {
    fontSize: 20, // Увеличен размер шрифта
    fontFamily: 'System',
    fontWeight: '500', // Сделан более жирным
    textAlign: 'center',
    color: '#2d2a29',
    letterSpacing: 3,
    textTransform: 'uppercase',
    marginBottom: 24,
  },
  filtersContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  filterButton: {
    position: 'relative',
  },
  filterText: {
    fontSize: 12, // Увеличен размер шрифта
    fontFamily: 'System',
    fontWeight: '400', // Сделан более жирным
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: 'rgba(45, 42, 41, 0.6)', // Сделан более заметным
  },
  filterTextActive: {
    color: '#2d2a29',
  },
  filterUnderline: {
    position: 'absolute',
    bottom: -4,
    left: 0,
    right: 0,
    height: 2, // Увеличена толщина линии
    backgroundColor: '#2d2a29', // Сделана более заметной
  },
});

export default StoryHeader;

