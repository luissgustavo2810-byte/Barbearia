import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';

export default function ServiceButton({ item, selected, onPress, theme }) {
  return (
    <TouchableOpacity
      style={[
        styles.button,
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
      <View style={styles.content}>
        <Text
          style={[
            styles.text,
            { color: selected ? theme.neon : theme.text },
          ]}
        >
          {item.name}
        </Text>

        <Text
          style={[
            styles.price,
            { color: selected ? theme.neon : theme.primary },
          ]}
        >
          R$ {item.price}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    minWidth: 110,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  content: {
    alignItems: 'flex-start',
  },
  text: {
    fontWeight: '600',
    fontSize: 14,
    letterSpacing: 0.3,
  },
  price: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: '600',
  },
  selectedGlow: {
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },
});