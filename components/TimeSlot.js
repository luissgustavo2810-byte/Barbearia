import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

export default function TimeSlot({
  time,
  unavailable,
  selected,
  onPress,
  theme,
}) {
  return (
    <TouchableOpacity
      disabled={unavailable}
      style={[
        styles.time,
        {
          backgroundColor: theme.card,
          borderColor: selected ? theme.neon : 'transparent',
          shadowColor: selected ? theme.neon : 'transparent',
          opacity: unavailable ? 0.28 : 1,
        },
        selected && styles.selectedGlow,
      ]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <Text
        style={[
          styles.text,
          { color: selected ? theme.neon : theme.text },
        ]}
      >
        {time}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  time: {
    flexGrow: 1,
    minWidth: '30%',
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1.5,
  },
  text: {
    fontWeight: '600',
    letterSpacing: 0.4,
  },
  selectedGlow: {
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },
});