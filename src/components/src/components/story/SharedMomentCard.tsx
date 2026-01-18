import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Memory } from '../../types';
import { X, Check, Trash2 } from 'lucide-react-native';
import { Image as ExpoImage } from 'expo-image';
// ИСПРАВЛЕНИЕ ЗДЕСЬ: Разделяем импорты
import { getAvatarInitial } from '../../utils/helpers';
import { formatDateBadge } from '../../utils/dateUtils';

interface SharedMomentCardProps {
  memory: Memory;
  language: 'en' | 'ru';
  userUid: string | null;
  isConnected: boolean;
  onAddPartnerNote: (memoryId: string, text: string) => Promise<void>;
  onPhotoClick: (imageUrl: string) => void;
  onDelete?: (id: string) => void;
}

const SharedMomentCard: React.FC<SharedMomentCardProps> = ({ 
  memory, 
  language, 
  userUid, 
  isConnected,
  onAddPartnerNote,
  onPhotoClick,
  onDelete
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleDelete = () => {
    const message = language === 'ru' ? 'Удалить это воспоминание?' : 'Delete this memory?';
    Alert.alert(
      language === 'ru' ? 'Подтверждение' : 'Confirm',
      message,
      [
        { text: language === 'ru' ? 'Отмена' : 'Cancel', style: 'cancel' },
        { 
          text: language === 'ru' ? 'Удалить' : 'Delete', 
          style: 'destructive',
          onPress: () => onDelete?.(memory.id)
        },
      ]
    );
  };

  const noteA = memory.noteA || memory.note || '';
  const noteB = memory.noteB || '';

  const canAddPartnerNote = isConnected && 
    memory.authorA && 
    memory.authorA !== userUid && 
    !noteB;

  const handleSaveNote = async () => {
    if (!noteText.trim()) return;
    setIsSaving(true);
    try {
      await onAddPartnerNote(memory.id, noteText.trim());
      setIsEditing(false);
      setNoteText('');
    } catch (error) {
      console.error('Failed to save note:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.timelineDot} />

      <View style={styles.content}>
        {/* Фото контейнер */}
        <TouchableOpacity
          style={styles.photoContainer}
          onPress={() => {
            if (memory.imageUrl) {
              onPhotoClick(memory.imageUrl);
            }
          }}
          activeOpacity={0.98}
        >
          {memory.imageUrl ? (
            <>
              <ExpoImage
                source={{ uri: memory.imageUrl }}
                style={styles.image}
                contentFit="cover"
                transition={200}
              />
              
              <LinearGradient
                colors={['rgba(0, 0, 0, 0.1)', 'rgba(0, 0, 0, 0.1)']}
                style={styles.dateBadge}
              >
                <Text style={styles.dateText}>
                  {formatDateBadge(memory.date, language)}
                </Text>
              </LinearGradient>

              {memory.authorA && (
                <View style={styles.avatarContainer}>
                  <Text style={styles.avatarText}>
                    {getAvatarInitial(memory.authorA, userUid, language)}
                  </Text>
                </View>
              )}

              {onDelete && (
                <TouchableOpacity
                  onPress={handleDelete}
                  style={styles.deleteButton}
                >
                  <Trash2 size={16} color="rgba(255, 255, 255, 0.8)" />
                </TouchableOpacity>
              )}
            </>
          ) : null}
        </TouchableOpacity>

        {/* Секция заметок */}
        {(noteA || noteB || canAddPartnerNote) && (
          <View style={styles.notesContainer}>
            {noteA && (
              <Text style={styles.noteText}>
                {noteA}
              </Text>
            )}

            {noteA && (noteB || isEditing) && (
              <View style={styles.divider} />
            )}

            {noteB && (
              <Text style={styles.noteText}>
                {noteB}
              </Text>
            )}

            {canAddPartnerNote && !isEditing && (
              <TouchableOpacity
                onPress={() => setIsEditing(true)}
                style={styles.addNoteButton}
              >
                <Text style={styles.addNoteText}>
                  {language === 'ru' ? 'Добавь свои впечатления...' : 'Add your impressions...'}
                </Text>
              </TouchableOpacity>
            )}

            {isEditing && (
              <View style={styles.editContainer}>
                <TextInput
                  autoFocus
                  value={noteText}
                  onChangeText={setNoteText}
                  placeholder={language === 'ru' ? 'Ваши впечатления...' : 'Your impressions...'}
                  style={styles.textInput}
                  multiline
                  numberOfLines={3}
                  placeholderTextColor="rgba(45, 42, 41, 0.4)"
                />
                <View style={styles.editButtons}>
                  <TouchableOpacity
                    onPress={handleSaveNote}
                    disabled={!noteText.trim() || isSaving}
                    style={[styles.editButton, styles.saveButton]}
                  >
                    <Check size={18} color="#2d2a29" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => { setIsEditing(false); setNoteText(''); }}
                    style={[styles.editButton, styles.cancelButton]}
                  >
                    <X size={18} color="rgba(45, 42, 41, 0.4)" />
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    paddingLeft: 48,
    marginBottom: 64,
  },
  timelineDot: {
    position: 'absolute',
    left: -4.5,
    top: 24,
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: 'rgba(45, 42, 41, 0.2)',
  },
  content: {
    gap: 24,
  },
  photoContainer: {
    width: '100%',
    aspectRatio: 4 / 5,
    borderRadius: 32,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  dateBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  dateText: {
    fontSize: 10,
    letterSpacing: 2,
    fontWeight: '300',
    textTransform: 'uppercase',
    color: 'white',
  },
  avatarContainer: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 10,
    fontWeight: '300',
    color: 'white',
  },
  deleteButton: {
    position: 'absolute',
    top: 16,
    left: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.6,
  },
  notesContainer: {
    paddingHorizontal: 8,
    gap: 20,
  },
  noteText: {
    fontSize: 15,
    fontFamily: 'System',
    fontWeight: '300',
    color: 'rgba(45, 42, 41, 0.8)',
    lineHeight: 24,
    fontStyle: 'italic',
    letterSpacing: 0.5,
  },
  divider: {
    width: 48,
    height: 1,
    backgroundColor: 'rgba(45, 42, 41, 0.05)',
    alignSelf: 'center',
    opacity: 0.5,
  },
  addNoteButton: {
    paddingVertical: 8,
  },
  addNoteText: {
    fontSize: 13,
    fontFamily: 'System',
    fontWeight: '300',
    color: 'rgba(45, 42, 41, 0.4)',
    fontStyle: 'italic',
    textDecorationLine: 'underline',
    textDecorationColor: 'rgba(45, 42, 41, 0.2)',
  },
  editContainer: {
    gap: 16,
    marginTop: 8,
  },
  textInput: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 16,
    padding: 16,
    fontSize: 15,
    fontFamily: 'System',
    fontWeight: '300',
    color: '#2d2a29',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  editButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  editButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
  },
  cancelButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
});

export default SharedMomentCard;