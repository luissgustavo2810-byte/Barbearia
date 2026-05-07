import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  TouchableWithoutFeedback,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ScreenHero from '../components/ScreenHero';

function FadeInBlock({ children, delay = 0 }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(18)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 400,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 400,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={{
        opacity,
        transform: [{ translateY }],
      }}
    >
      {children}
    </Animated.View>
  );
}

function AnimatedPlanCard({ children, onPress, style }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const pressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      useNativeDriver: true,
      friction: 6,
      tension: 140,
    }).start();
  };

  const pressOut = () => {
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
      onPressIn={pressIn}
      onPressOut={pressOut}
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

export default function PlansScreen({ theme }) {
  const plans = [
    {
      id: 1,
      name: 'Básico',
      price: 'R$ 39,90/mês',
      description: 'Ideal para quem quer manter o visual em dia.',
      benefits: [
        '1 corte por mês',
        '5% de desconto em serviços extras',
        'Agendamento comum',
      ],
    },
    {
      id: 2,
      name: 'Premium',
      price: 'R$ 79,90/mês',
      description: 'Mais vantagens para clientes frequentes.',
      benefits: [
        '2 cortes por mês',
        '1 barba por mês',
        '10% de desconto em serviços extras',
        'Prioridade no agendamento',
      ],
      highlight: true,
    },
    {
      id: 3,
      name: 'Gold',
      price: 'R$ 119,90/mês',
      description: 'A experiência completa da barbearia.',
      benefits: [
        '4 serviços por mês',
        '15% de desconto em serviços extras',
        'Prioridade máxima no agendamento',
        'Atendimento VIP',
      ],
    },
  ];

  const [selectedPlan, setSelectedPlan] = useState(null);
  const buttonScale = useRef(new Animated.Value(1)).current;

  const handleSubscribe = () => {
    if (!selectedPlan) {
      Alert.alert('Atenção', 'Selecione um plano para continuar.');
      return;
    }

    Alert.alert(
      'Assinar plano',
      `Você selecionou o plano ${selectedPlan.name} por ${selectedPlan.price}.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: () =>
            Alert.alert('Sucesso', `Plano ${selectedPlan.name} assinado!`),
        },
      ]
    );
  };

  const buttonPressIn = () => {
    Animated.spring(buttonScale, {
      toValue: 0.97,
      useNativeDriver: true,
      friction: 6,
      tension: 140,
    }).start();
  };

  const buttonPressOut = () => {
    Animated.spring(buttonScale, {
      toValue: 1,
      useNativeDriver: true,
      friction: 6,
      tension: 140,
    }).start();
  };

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
          title="Planos de assinatura"
          subtitle="Escolha o plano ideal para sua rotina e ganhe benefícios exclusivos."
        />
      </FadeInBlock>

      {plans.map((plan, index) => {
        const isSelected = selectedPlan?.id === plan.id;

        return (
          <FadeInBlock key={plan.id} delay={120 + index * 90}>
            <AnimatedPlanCard
              onPress={() => setSelectedPlan(plan)}
              style={[
                styles.card,
                {
                  backgroundColor: theme.card,
                  borderColor: isSelected ? theme.primary : 'transparent',
                },
              ]}
            >
              {plan.highlight && (
                <View style={[styles.badge, { backgroundColor: theme.primary }]}>
                  <Text style={styles.badgeText}>Mais escolhido</Text>
                </View>
              )}

              <View style={styles.cardTop}>
                <View>
                  <Text style={[styles.planName, { color: theme.text }]}>
                    {plan.name}
                  </Text>
                  <Text style={[styles.planPrice, { color: theme.primary }]}>
                    {plan.price}
                  </Text>
                </View>

                {isSelected && (
                  <Ionicons
                    name="checkmark-circle"
                    size={28}
                    color={theme.accent}
                  />
                )}
              </View>

              <Text style={[styles.description, { color: theme.text }]}>
                {plan.description}
              </Text>

              <View style={styles.benefitsBox}>
                {plan.benefits.map((benefit, i) => (
                  <View key={i} style={styles.benefitRow}>
                    <Ionicons
                      name="checkmark-circle-outline"
                      size={18}
                      color={theme.accent}
                    />
                    <Text style={[styles.benefitText, { color: theme.text }]}>
                      {benefit}
                    </Text>
                  </View>
                ))}
              </View>
            </AnimatedPlanCard>
          </FadeInBlock>
        );
      })}

      <FadeInBlock delay={450}>
        <TouchableWithoutFeedback
          onPress={handleSubscribe}
          onPressIn={buttonPressIn}
          onPressOut={buttonPressOut}
        >
          <Animated.View
            style={[
              styles.button,
              {
                backgroundColor: theme.primary,
                opacity: selectedPlan ? 1 : 0.6,
                transform: [{ scale: buttonScale }],
              },
            ]}
          >
            <Text style={styles.buttonText}>Assinar plano</Text>
          </Animated.View>
        </TouchableWithoutFeedback>
      </FadeInBlock>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 30,
  },
  card: {
    borderWidth: 2,
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    zIndex: 1,
  },
  badgeText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 11,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  planName: {
    fontSize: 23,
    fontWeight: 'bold',
  },
  planPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 4,
  },
  description: {
    fontSize: 14,
    marginTop: 12,
    marginBottom: 14,
    opacity: 0.9,
    lineHeight: 20,
  },
  benefitsBox: {
    gap: 10,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  benefitText: {
    fontSize: 14,
    flex: 1,
  },
  button: {
    marginTop: 8,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});