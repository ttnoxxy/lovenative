import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Memory } from '../../types';
import { Trash2 } from 'lucide-react-native';
import { Image as ExpoImage } from 'expo-image';
// ИСПРАВЛЕНИЕ ЗДЕСЬ: Разделяем импорты
import { getAvatarInitial } from '../../utils/helpers';
import { formatDateBadge } from '../../utils/dateUtils';

interface PhotoMomentCardProps {
  memory: Memory;
  language: 'en' | 'ru';
  userUid: string | null;
  onPhotoClick: (imageUrl: string) => void;
  onDelete?: (id: string) => void;
}

const PhotoMomentCard: React.FC<PhotoMomentCardProps> = ({ 
  memory, 
  language, 
  userUid, 
  onPhotoClick, 
  onDelete 
}) => {
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

  const note = memory.noteA || memory.note || '';

  return (
    <View style={styles.container}>
      {/* Точка на timeline */}
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
              
              {/* Дата бейдж */}
              <LinearGradient
                colors={['rgba(0, 0, 0, 0.1)', 'rgba(0, 0, 0, 0.1)']}
                style={styles.dateBadge}
              >
                <Text style={styles.dateText}>
                  {formatDateBadge(memory.date, language)}
                </Text>
              </LinearGradient>

              {/* Аватар */}
              {memory.authorA && (
                <View style={styles.avatarContainer}>
                  <Text style={styles.avatarText}>
                    {getAvatarInitial(memory.authorA, userUid, language)}
                  </Text>
                </View>
              )}

              {/* Кнопка удаления */}
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

        {/* Заметка */}
        {note && (
          <View style={styles.noteContainer}>
            <Text style={styles.noteText}>
              {note}
            </Text>
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
    gap: 20,
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
  noteContainer: {
    paddingHorizontal: 8,
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
});

export default PhotoMomentCard;