import React from 'react';
import { TouchableOpacity, Text, Image, StyleSheet } from 'react-native';

export default function BarberCard({ barber, selected, onPress, theme }) {
  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: theme.card,
          borderColor: selected ? theme.neon : 'transparent',
          shadowColor: selected ? theme.neon : 'transparent',
        },
        selected && styles.selectedGlow,
      ]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <Image
        source={{ uri: 'https://via.placeholder.com/100' }}
        style={[
          styles.image,
          selected && {
            borderColor: theme.neon,
          },
        ]}
      />

      <Text
        style={[
          styles.name,
          { color: selected ? theme.neon : theme.text },
        ]}
      >
        {barber.name}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 120,
    padding: 12,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1.5,
  },
  image: {
    width: 78,
    height: 78,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  name: {
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  selectedGlow: {
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },
});