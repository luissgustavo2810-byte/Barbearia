import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableWithoutFeedback,
  StyleSheet,
  ScrollView,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ScreenHero from '../components/ScreenHero';
import banner from '../assets/Banner.png';

function PressableAnimatedCard({ children, onPress, style }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
      friction: 6,
      tension: 140,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      friction: 6,
      tension: 140,
    }).start();
  };

  return (
    <TouchableWithoutFeedback
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View
        style={[
          style,
          {
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {children}
      </Animated.View>
    </TouchableWithoutFeedback>
  );
}

function FadeInBlock({ children, delay = 0, style }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 420,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 420,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity,
          transform: [{ translateY }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}

export default function MainScreen({
  theme,
  themeName,
  setThemeName,
  navigation,
}) {
  return (
    <ScrollView
      contentContainerStyle={[
        styles.container,
        { backgroundColor: theme.background },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <FadeInBlock delay={0}>
        <ScreenHero
  theme={theme}
  title="Seu estilo começa aqui"
  subtitle="Agende serviços, conheça nossos planos e deixe sua experiência mais prática e premium."
  image={banner}
          rightComponent={
            <PressableAnimatedCard
              onPress={() =>
                setThemeName(themeName === 'dark' ? 'light' : 'dark')
              }
              style={[
                styles.themeButton,
                { backgroundColor: theme.navbar },
              ]}
            >
              <Ionicons
                name={themeName === 'dark' ? 'sunny-outline' : 'moon-outline'}
                size={20}
                color={theme.text}
              />
            </PressableAnimatedCard>
          }
        />
      </FadeInBlock>

      <FadeInBlock delay={120}>
        <PressableAnimatedCard
          onPress={() => navigation.navigate('Agendar')}
          style={[styles.mainCard, { backgroundColor: theme.primary }]}
        >
          <Ionicons name="calendar-outline" size={34} color="#fff" />
          <Text style={styles.mainCardTitle}>Agendamentos</Text>
          <Text style={styles.mainCardText}>
            Escolha serviços, barbeiro, data e horário.
          </Text>
        </PressableAnimatedCard>
      </FadeInBlock>

      <FadeInBlock delay={220}>
        <PressableAnimatedCard
          onPress={() => navigation.navigate('Planos')}
          style={[
            styles.secondaryCard,
            { backgroundColor: theme.card, borderColor: theme.primary },
          ]}
        >
          <Ionicons name="card-outline" size={34} color={theme.primary} />
          <Text style={[styles.secondaryCardTitle, { color: theme.text }]}>
            Planos de assinatura
          </Text>
          <Text style={[styles.secondaryCardText, { color: theme.text }]}>
            Veja vantagens, descontos e atendimento prioritário.
          </Text>
        </PressableAnimatedCard>
      </FadeInBlock>

      <FadeInBlock delay={320}>
        <View style={[styles.infoBox, { backgroundColor: theme.card }]}>
          <Text style={[styles.infoTitle, { color: theme.text }]}>
            Por que usar o app?
          </Text>

          <View style={styles.infoItem}>
            <Ionicons name="checkmark-circle" size={18} color={theme.accent} />
            <Text style={[styles.infoText, { color: theme.text }]}>
              Agendamento rápido e organizado
            </Text>
          </View>

          <View style={styles.infoItem}>
            <Ionicons name="checkmark-circle" size={18} color={theme.accent} />
            <Text style={[styles.infoText, { color: theme.text }]}>
              Escolha fácil do barbeiro e horário
            </Text>
          </View>

          <View style={styles.infoItem}>
            <Ionicons name="checkmark-circle" size={18} color={theme.accent} />
            <Text style={[styles.infoText, { color: theme.text }]}>
              Planos com vantagens exclusivas
            </Text>
          </View>
        </View>
      </FadeInBlock>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    paddingBottom: 30,
  },
  themeButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainCard: {
    borderRadius: 22,
    padding: 22,
    marginBottom: 16,
  },
  mainCardTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 14,
    marginBottom: 8,
  },
  mainCardText: {
    color: '#fff',
    fontSize: 14,
    lineHeight: 20,
  },
  secondaryCard: {
    borderRadius: 22,
    padding: 22,
    borderWidth: 2,
    marginBottom: 16,
  },
  secondaryCardTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 14,
    marginBottom: 8,
  },
  secondaryCardText: {
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.9,
  },
  infoBox: {
    borderRadius: 22,
    padding: 20,
    marginTop: 2,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 14,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    flex: 1,
  },
});