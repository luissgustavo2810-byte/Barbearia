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
import {
  getPlans,
  getUserSubscription,
  subscribeToPlan,
} from '../services/bookingService';

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
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
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
      <Animated.View style={[style, { transform: [{ scale: scaleAnim }] }]}>
        {children}
      </Animated.View>
    </TouchableWithoutFeedback>
  );
}

export default function PlansScreen({ theme, user, navigation }) {
  const [plans, setPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [subscribeLoading, setSubscribeLoading] = useState(false);

  const buttonScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    loadPlansAndSubscription();
  }, []);

  const loadPlansAndSubscription = async () => {
    try {
      setLoading(true);

      const [plansData, subscriptionData] = await Promise.all([
        getPlans(),
        getUserSubscription(user.id),
      ]);

      setPlans(plansData || []);
      setSubscription(subscriptionData || null);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível carregar os planos.');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    return `R$ ${Number(price || 0).toFixed(2).replace('.', ',')}/mês`;
  };

  const getBenefits = (benefits) => {
    if (!benefits) return [];

    if (Array.isArray(benefits)) {
      return benefits;
    }

    return benefits
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  };

  const handleSubscribe = () => {
    if (subscription) {
      Alert.alert(
        'Plano já ativo',
        `Você já possui o plano ${subscription.plans?.name || 'ativo'}.`
      );
      return;
    }

    if (!selectedPlan) {
      Alert.alert('Atenção', 'Selecione um plano para continuar.');
      return;
    }

    Alert.alert(
      'Assinar plano',
      `Você selecionou o plano ${selectedPlan.name} por ${formatPrice(selectedPlan.price)}.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: confirmSubscription,
        },
      ]
    );
  };

  const confirmSubscription = async () => {
    try {
      setSubscribeLoading(true);

      await subscribeToPlan({
        userId: user.id,
        planId: selectedPlan.id,
      });

      await loadPlansAndSubscription();
      navigation.navigate('Pagamentos');

      Alert.alert('Sucesso', `Plano ${selectedPlan.name} assinado!`);
    } catch (error) {
      Alert.alert('Erro', error.message || 'Não foi possível assinar o plano.');
    } finally {
      setSubscribeLoading(false);
    }
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

      {subscription && (
        <View
          style={[
            styles.activePlanCard,
            {
              backgroundColor: `${theme.primary}18`,
              borderColor: theme.primary,
            },
          ]}
        >
          <Ionicons name="checkmark-circle-outline" size={22} color={theme.primary} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.activePlanTitle, { color: theme.text }]}>
              Plano ativo
            </Text>
            <Text style={[styles.activePlanText, { color: theme.primary }]}>
              {subscription.plans?.name || 'Plano ativo'}
            </Text>
          </View>
        </View>
      )}

      {loading && (
        <Text style={[styles.loadingText, { color: theme.text }]}>
          Carregando planos...
        </Text>
      )}

      {!loading && plans.length === 0 && (
        <Text style={[styles.emptyText, { color: theme.text }]}>
          Nenhum plano disponível no momento.
        </Text>
      )}

      {!loading &&
        plans.map((plan, index) => {
          const isSelected = selectedPlan?.id === plan.id;
          const isCurrentPlan = subscription?.plan_id === plan.id;
          const benefits = getBenefits(plan.benefits);

          return (
            <FadeInBlock key={plan.id} delay={120 + index * 90}>
              <AnimatedPlanCard
                onPress={() => {
                  if (!subscription) {
                    setSelectedPlan(plan);
                  }
                }}
                style={[
                  styles.card,
                  {
                    backgroundColor: theme.card,
                    borderColor: isSelected || isCurrentPlan
                      ? theme.primary
                      : 'transparent',
                    opacity: subscription && !isCurrentPlan ? 0.55 : 1,
                  },
                ]}
              >
                {isCurrentPlan && (
                  <View style={[styles.badge, { backgroundColor: theme.primary }]}>
                    <Text style={styles.badgeText}>Plano ativo</Text>
                  </View>
                )}

                {!subscription && index === 1 && (
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
                      {formatPrice(plan.price)}
                    </Text>
                  </View>

                  {(isSelected || isCurrentPlan) && (
                    <Ionicons
                      name="checkmark-circle"
                      size={28}
                      color={theme.accent}
                    />
                  )}
                </View>

                <Text style={[styles.description, { color: theme.text }]}>
                  {plan.description || 'Plano de assinatura da barbearia.'}
                </Text>

                <View style={styles.benefitsBox}>
                  {benefits.length > 0 ? (
                    benefits.map((benefit, i) => (
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
                    ))
                  ) : (
                    <Text style={[styles.benefitText, { color: theme.text }]}>
                      Benefícios serão informados pela barbearia.
                    </Text>
                  )}
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
          disabled={!!subscription || subscribeLoading}
        >
          <Animated.View
            style={[
              styles.button,
              {
                backgroundColor: theme.primary,
                opacity: selectedPlan && !subscription && !subscribeLoading ? 1 : 0.6,
                transform: [{ scale: buttonScale }],
              },
            ]}
          >
            <Text style={styles.buttonText}>
              {subscribeLoading
                ? 'Assinando...'
                : subscription
                  ? 'Plano já ativo'
                  : 'Assinar plano'}
            </Text>
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
  activePlanCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  activePlanTitle: {
    fontSize: 13,
    opacity: 0.75,
    marginBottom: 3,
  },
  activePlanText: {
    fontSize: 17,
    fontWeight: 'bold',
  },
  loadingText: {
    fontSize: 15,
    opacity: 0.8,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 15,
    opacity: 0.8,
    marginBottom: 16,
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