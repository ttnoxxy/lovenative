import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Memory } from '../../types';
import PhotoMomentCard from './PhotoMomentCard';
import SharedMomentCard from './SharedMomentCard';
import LockedMomentCard from './LockedMomentCard';

interface MonthSectionProps {
  monthKey: string;
  memories: Memory[];
  language: 'en' | 'ru';
  userUid: string | null;
  isConnected: boolean;
  onPhotoClick: (imageUrl: string) => void;
  onAddPartnerNote: (memoryId: string, text: string) => Promise<void>;
  onDelete?: (id: string) => void;
}

const MonthSection: React.FC<MonthSectionProps> = ({ 
  monthKey, 
  memories, 
  language,
  userUid,
  isConnected,
  onPhotoClick,
  onAddPartnerNote,
  onDelete
}) => {
  const isLocked = (memory: Memory): boolean => {
    if (!memory.isPrivate || !memory.lockedUntil) return false;
    return new Date(memory.lockedUntil) > new Date();
  };

  return (
    <View style={styles.container}>
      {/* Вертикальная линия Timeline */}
      <View style={styles.timelineLine} />
      
      {/* Month Divider */}
      <View style={styles.monthDivider}>
        <BlurView intensity={20} style={styles.monthDividerBlur}>
          <LinearGradient
            colors={['rgba(245, 237, 228, 0.8)', 'rgba(245, 237, 228, 0.95)', 'transparent']}
            style={styles.monthDividerGradient}
          >
            <View style={styles.monthDot} />
            <Text style={styles.monthText}>
              {monthKey} {/* Теперь отображает месяц и год */}
            </Text>
          </LinearGradient>
        </BlurView>
      </View>
      
      {/* Воспоминания */}
      <View style={styles.memoriesContainer}>
        {memories.map((memory) => {
          if (isLocked(memory)) {
            return (
              <View key={memory.id} style={styles.memoryWrapper}>
                <View style={styles.memoryDot} />
                <LockedMomentCard
                  memory={memory}
                  language={language}
                  userUid={userUid}
                  onDelete={onDelete}
                />
              </View>
            );
          }
          
          if (isConnected && memory.authorA && (memory.noteA || memory.noteB || memory.note)) {
            return (
              <View key={memory.id} style={styles.memoryWrapper}>
                <View style={styles.memoryDot} />
                <SharedMomentCard
                  memory={memory}
                  language={language}
                  userUid={userUid}
                  isConnected={isConnected}
                  onAddPartnerNote={onAddPartnerNote}
                  onPhotoClick={onPhotoClick}
                  onDelete={onDelete}
                />
              </View>
            );
          }
          
          return (
            <View key={memory.id} style={styles.memoryWrapper}>
              <View style={styles.memoryDot} />
              <PhotoMomentCard
                memory={memory}
                language={language}
                userUid={userUid}
                onPhotoClick={onPhotoClick}
                onDelete={onDelete}
              />
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    marginBottom: 48,
  },
  timelineLine: {
    position: 'absolute',
    left: 20,
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  monthDivider: {
    position: 'sticky',
    top: 80,
    zIndex: 30,
    marginBottom: 24,
    paddingLeft: 48,
    marginLeft: -24,
    marginRight: -24,
    paddingHorizontal: 24,
  },
  monthDividerBlur: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  monthDividerGradient: {
    paddingVertical: 8,
    paddingRight: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  monthDot: {
    position: 'absolute',
    left: 16,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  monthText: {
    marginLeft: 32,
    fontSize: 14, // Увеличен размер шрифта
    fontFamily: 'System',
    fontWeight: '400', // Сделан более жирным
    color: '#2d2a29',
    letterSpacing: 0.5,
    textAlign: 'center', // Исправлено выравнивание
  },
  memoriesContainer: {
    paddingLeft: 48,
    gap: 32,
  },
  memoryWrapper: {
    position: 'relative',
  },
  memoryDot: {
    position: 'absolute',
    left: -44,
    top: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
});

export default MonthSection;

