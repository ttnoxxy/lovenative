import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Memory } from '../../types';
import { Trash2 } from 'lucide-react-native';
import { Image as ExpoImage } from 'expo-image';
import { getAvatarInitial } from '../../utils/helpers';

interface LockedMomentCardProps {
  memory: Memory;
  language: 'en' | 'ru';
  userUid: string | null;
  onDelete?: (id: string) => void;
}

const LockedMomentCard: React.FC<LockedMomentCardProps> = ({ 
  memory, 
  language, 
  userUid, 
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

  const getLockedMessage = (): string => {
    if (!memory.lockedUntil) return '';
    const hoursUntil = (new Date(memory.lockedUntil).getTime() - Date.now()) / (1000 * 60 * 60);
    
    if (language === 'ru') {
      if (hoursUntil < 6) return 'Почти время';
      if (hoursUntil < 12) return 'Совсем скоро';
      return 'Откроется завтра';
    } else {
      if (hoursUntil < 6) return 'Almost time';
      if (hoursUntil < 12) return 'Very soon';
      return 'Opens tomorrow';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.photoContainer}>
        {memory.imageUrl ? (
          <>
            <ExpoImage
              source={{ uri: memory.imageUrl }}
              style={styles.blurredImage}
              contentFit="cover"
            />
            <BlurView intensity={40} style={StyleSheet.absoluteFill} />
            
            <View style={styles.messageContainer}>
              <View style={styles.messageLine} />
              <Text style={styles.messageText}>
                {getLockedMessage()}
              </Text>
              <View style={styles.messageLine} />
            </View>

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
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {language === 'ru' ? 'Секретный момент' : 'Secret moment'}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 64,
  },
  photoContainer: {
    width: '100%',
    aspectRatio: 4 / 5,
    borderRadius: 32,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  blurredImage: {
    width: '100%',
    height: '100%',
    transform: [{ scale: 1.1 }],
    opacity: 0.6,
  },
  messageContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  messageLine: {
    width: 40,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    marginVertical: 24,
  },
  messageText: {
    fontSize: 13,
    fontFamily: 'System',
    fontWeight: '300',
    letterSpacing: 2,
    textTransform: 'uppercase',
    textAlign: 'center',
    color: 'rgba(45, 42, 41, 0.6)',
    lineHeight: 20,
  },
  avatarContainer: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 10,
    fontWeight: '300',
    color: 'white',
    opacity: 0.8,
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  emptyText: {
    fontSize: 10,
    letterSpacing: 2,
    textTransform: 'uppercase',
    fontStyle: 'italic',
    color: 'rgba(45, 42, 41, 0.3)',
  },
});

export default LockedMomentCard;

