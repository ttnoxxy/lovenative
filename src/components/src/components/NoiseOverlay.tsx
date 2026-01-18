import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

/**
 * Компонент для создания эффекта зернистости (Noise)
 * В React Native используем наложение полупрозрачного градиента
 * Для более реалистичного эффекта можно использовать изображение текстуры
 */
export const NoiseOverlay: React.FC = () => {
  return (
    <View style={styles.container} pointerEvents="none">
      <LinearGradient
        colors={[
          'rgba(255, 255, 255, 0.02)',
          'rgba(0, 0, 0, 0.01)',
          'rgba(255, 255, 255, 0.02)',
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {/* Можно добавить несколько слоев для более реалистичного эффекта */}
      <View style={styles.noiseLayer1} />
      <View style={styles.noiseLayer2} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  noiseLayer1: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.01)',
    opacity: 0.3,
  },
  noiseLayer2: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.01)',
    opacity: 0.2,
  },
});

export default NoiseOverlay;

