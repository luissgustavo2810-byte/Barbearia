import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export default function Navbar({ theme, themeName, setThemeName }) {
  return (
    <View style={[
      styles.navbar,
      {
        backgroundColor: theme.navbar,
        borderBottomColor: theme.muted
      }
    ]}>
      <Text style={[styles.logo, { color: theme.text }]}>
        ✂️ Barbearia
      </Text>

      <View style={[styles.toggle, { backgroundColor: theme.muted }]}>
        <TouchableOpacity onPress={() => setThemeName('dark')}>
          <Text style={[
            styles.icon,
            { color: theme.text },
            themeName === 'dark' && styles.active
          ]}>🌙</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setThemeName('light')}>
          <Text style={[
            styles.icon,
            { color: theme.text },
            themeName === 'light' && styles.active
          ]}>☀️</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  navbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1
  },
  logo: {
    fontSize: 20,
    fontWeight: 'bold'
  },
  toggle: {
    flexDirection: 'row',
    padding: 5,
    borderRadius: 20,
    gap: 10
  },
  icon: {
    fontSize: 18,
    opacity: 0.5
  },
  active: {
    opacity: 1,
    transform: [{ scale: 1.2 }]
  }
});