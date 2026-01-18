import React, { useMemo, useState } from 'react';
import { View, StyleSheet, ScrollView, Modal, TouchableOpacity, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Memory, StoryFilter, Language } from '../../types';
import StoryHeader from './StoryHeader';
import MonthSection from './MonthSection';
import { X } from 'lucide-react-native';
import { Image as ExpoImage } from 'expo-image';
import NoiseOverlay from '../NoiseOverlay';
import { formatDateBadge } from '../../utils/dateUtils';

interface StoryTimelineProps {
  memories: Memory[];
  language: Language;
  userUid: string | null;
  isConnected: boolean;
  onAddClick: () => void;
  onAddPartnerNote: (memoryId: string, text: string) => Promise<void>;
  onInviteClick?: () => void;
  onDeleteMemory?: (id: string) => void;
  settings?: any;
}

const StoryTimeline: React.FC<StoryTimelineProps> = ({
  memories,
  language,
  userUid,
  isConnected,
  onAddClick,
  onAddPartnerNote,
  onInviteClick,
  onDeleteMemory,
  settings,
}) => {
  const [activeFilter, setActiveFilter] = useState<StoryFilter>('all');
  const [fullscreenPhotoUrl, setFullscreenPhotoUrl] = useState<string | null>(null);

  const groupedMemories = useMemo(() => {
    const filtered = memories.filter((memory) => {
      switch (activeFilter) {
        case 'photos': return !!memory.imageUrl;
        case 'notes': return !!(memory.noteA || memory.noteB || memory.note);
        case 'milestones': return !!memory.milestoneReached;
        default: return true;
      }
    });

    const sorted = [...filtered].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    const grouped = new Map<string, Memory[]>();
    sorted.forEach((memory) => {
      const monthKey = formatDateBadge(memory.date, language);
      if (!grouped.has(monthKey)) grouped.set(monthKey, []);
      grouped.get(monthKey)!.push(memory);
    });

    return grouped;
  }, [memories, activeFilter, language]);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#f5ede4', '#f0d4c4', '#e8ddd4']}
        style={StyleSheet.absoluteFill}
      />
      <NoiseOverlay />
      
      <StoryHeader
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        language={language}
        isConnected={isConnected}
        onInviteClick={onInviteClick}
        settings={settings}
      />

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {groupedMemories.size === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {language === 'ru' ? 'История еще пишется' : 'History is being written'}
            </Text>
            <TouchableOpacity
              onPress={onAddClick}
              style={styles.addButton}
              activeOpacity={0.8}
            >
              <Text style={styles.addButtonText}>
                {language === 'ru' ? 'ДОБАВИТЬ ПЕРВЫЙ МОМЕНТ' : 'ADD FIRST MOMENT'}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.memoriesContainer}>
            {Array.from(groupedMemories.entries()).map(([monthKey, monthMemories]) => (
              <MonthSection
                key={monthKey}
                monthKey={monthKey}
                memories={monthMemories}
                language={language}
                userUid={userUid}
                isConnected={isConnected}
                onPhotoClick={setFullscreenPhotoUrl}
                onAddPartnerNote={onAddPartnerNote}
                onDelete={onDeleteMemory}
              />
            ))}
          </View>
        )}
      </ScrollView>

      {/* Fullscreen Photo Modal */}
      <Modal
        visible={!!fullscreenPhotoUrl}
        transparent
        animationType="fade"
        onRequestClose={() => setFullscreenPhotoUrl(null)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setFullscreenPhotoUrl(null)}
        >
          <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
            {fullscreenPhotoUrl && (
              <ExpoImage
                source={{ uri: fullscreenPhotoUrl }}
                style={styles.fullscreenImage}
                contentFit="contain"
              />
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setFullscreenPhotoUrl(null)}
          >
            <X size={28} color="white" />
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 128,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 96,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: 'System',
    fontWeight: '300',
    color: 'rgba(45, 42, 41, 0.5)',
    letterSpacing: 0.5,
    marginBottom: 24,
  },
  addButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.6)',
  },
  addButtonText: {
    fontSize: 12,
    fontFamily: 'System',
    fontWeight: '300',
    color: 'rgba(45, 42, 41, 0.8)',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  memoriesContainer: {
    gap: 48,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenImage: {
    width: '95%',
    height: '85%',
    maxWidth: 600,
    maxHeight: 800,
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    right: 32,
    padding: 8,
  },
});

export default StoryTimeline;

