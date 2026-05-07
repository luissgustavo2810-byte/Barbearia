import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';

export default function ScreenHero({
  theme,
  title,
  subtitle,
  image,
  rightComponent,
}) {
  return (
    <View style={[styles.hero, { backgroundColor: theme.card }]}>
      
      <View style={styles.topRow}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.brand, { color: theme.primary }]}>
            ✂ Barbearia
          </Text>

          <Text style={[styles.title, { color: theme.text }]}>
            {title}
          </Text>
        </View>

        {rightComponent && (
          <View style={styles.right}>
            {rightComponent}
          </View>
        )}
      </View>

      {/* 🖼️ IMAGEM */}
      {image && (
        <Image
          source={image}
          style={styles.image}
        />
      )}

      {/* 📄 SUBTÍTULO */}
      {subtitle && (
        <Text style={[styles.subtitle, { color: theme.text }]}>
          {subtitle}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    borderRadius: 24,
    padding: 22,
    marginBottom: 18,
  },

  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  brand: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 6,
  },

  title: {
    fontSize: 28,
    fontWeight: 'bold',
    lineHeight: 34,
  },

  image: {
    width: '100%',
    height: 190,
    borderRadius: 16,
    marginTop: 14,
    marginBottom: 10,
  },

  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.9,
  },

  right: {
    marginLeft: 10,
  },
});