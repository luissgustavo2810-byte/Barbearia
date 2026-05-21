import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ScreenHero from '../components/ScreenHero';
import {
  getUserNextAppointment,
  cancelAppointment,
  getUserSubscription,
  cancelSubscription,
} from '../services/bookingService';
import { useFocusEffect } from '@react-navigation/native';

function InfoItem({ theme, icon, label, value }) {
  return (
    <View
      style={[
        styles.item,
        {
          backgroundColor: theme.card,
          borderColor: theme.muted,
        },
      ]}
    >
      <View style={[styles.iconBox, { backgroundColor: `${theme.primary}18` }]}>
        <Ionicons name={icon} size={18} color={theme.primary} />
      </View>

      <View style={{ flex: 1 }}>
        <Text style={[styles.label, { color: theme.text }]}>{label}</Text>
        <Text style={[styles.value, { color: theme.text }]}>{value}</Text>
      </View>
    </View>
  );
}

function BookingDetailCard({ theme, icon, label, value }) {
  return (
    <View
      style={[
        styles.bookingDetailCard,
        {
          backgroundColor: theme.background,
          borderColor: theme.muted,
        },
      ]}
    >
      <View
        style={[
          styles.smallIconBox,
          { backgroundColor: `${theme.primary}18` },
        ]}
      >
        <Ionicons name={icon} size={16} color={theme.primary} />
      </View>

      <View style={{ flex: 1 }}>
        <Text style={[styles.bookingLabel, { color: theme.text }]}>
          {label}
        </Text>
        <Text style={[styles.bookingValue, { color: theme.text }]}>
          {value}
        </Text>
      </View>
    </View>
  );
}

export default function ProfileScreen({ theme, user, onLogout }) {
  const [booking, setBooking] = useState(null);
  const [subscription, setSubscription] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    try {
      const [bookingData, subscriptionData] = await Promise.all([
        getUserNextAppointment(user.id),
        getUserSubscription(user.id),
      ]);

      setBooking(bookingData || null);
      setSubscription(subscriptionData || null);
    } catch (error) {
      setBooking(null);
      setSubscription(null);
    }
  };

  const handleCancelSubscription = () => {
    if (!subscription?.id) return;

    Alert.alert(
      'Cancelar assinatura',
      'Você continuará com os benefícios até o final da validade do plano.',
      [
        {
          text: 'Voltar',
          style: 'cancel',
        },
        {
          text: 'Cancelar assinatura',
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelSubscription(subscription.id);

              Alert.alert(
                'Assinatura cancelada',
                'Seu plano permanecerá ativo até o vencimento.'
              );

              loadData();
            } catch (error) {
              Alert.alert(
                'Erro',
                'Não foi possível cancelar a assinatura.'
              );
            }
          },
        },
      ]
    );
  };

  const handleCancelBooking = () => {
    if (!booking?.id) return;

    Alert.alert(
      'Cancelar agendamento',
      'Tem certeza que deseja cancelar este agendamento?',
      [
        { text: 'Não' },
        {
          text: 'Sim, cancelar',
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelAppointment(booking.id);
              setBooking(null);
              Alert.alert('Sucesso', 'Agendamento cancelado.');
            } catch (error) {
              Alert.alert('Erro', 'Não foi possível cancelar o agendamento.');
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView
      contentContainerStyle={[
        styles.container,
        { backgroundColor: theme.background },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <ScreenHero
        theme={theme}
        title={`Olá, ${user.name}`}
        subtitle="Aqui estão suas informações principais."
      />

      <View style={styles.content}>
        <InfoItem
          theme={theme}
          icon="person-outline"
          label="Nome"
          value={user.name}
        />

        <InfoItem
          theme={theme}
          icon="call-outline"
          label="Telefone"
          value={user.phone}
        />

        <InfoItem
          theme={theme}
          icon="card-outline"
          label="Assinatura"
          value={subscription?.plans?.name || 'Sem plano ativo'}
        />

        {subscription && (
          <View
            style={[
              styles.bookingCard,
              {
                backgroundColor: theme.card,
                borderColor: theme.muted,
              },
            ]}
          >
            <View style={styles.bookingHeader}>
              <View
                style={[
                  styles.iconBox,
                  { backgroundColor: `${theme.primary}18` },
                ]}
              >
                <Ionicons
                  name="diamond-outline"
                  size={18}
                  color={theme.primary}
                />
              </View>

              <View>
                <Text style={[styles.label, { color: theme.text }]}>
                  Plano ativo
                </Text>

                <Text style={[styles.value, { color: theme.primary }]}>
                  {subscription.plans?.name}
                </Text>
              </View>
            </View>

            <View style={styles.bookingDetails}>
              <BookingDetailCard
                theme={theme}
                icon="cash-outline"
                label="Valor"
                value={`R$ ${Number(
                  subscription.plans?.price || 0
                ).toFixed(2)}/mês`}
              />

              <BookingDetailCard
                theme={theme}
                icon="calendar-outline"
                label="Validade"
                value={
                  subscription.expires_at
                    ? new Date(subscription.expires_at)
                        .toISOString()
                        .split('T')[0]
                    : 'Não informada'
                }
              />

              <BookingDetailCard
                theme={theme}
                icon="checkmark-circle-outline"
                label="Status"
                value={
                  subscription.status === 'pending_payment'
                    ? 'Aguardando pagamento'
                    : subscription.status
                }
              />

              {!!subscription.plans?.description && (
                <BookingDetailCard
                  theme={theme}
                  icon="document-text-outline"
                  label="Descrição"
                  value={subscription.plans.description}
                />
              )}

              {subscription.status === 'active' && (
                <TouchableOpacity
                  style={[
                    styles.cancelButton,
                    { borderColor: theme.primary },
                  ]}
                  onPress={handleCancelSubscription}
                >
                  <Ionicons
                    name="close-circle-outline"
                    size={17}
                    color={theme.primary}
                  />

                  <Text style={[styles.cancelText, { color: theme.primary }]}>
                    Cancelar assinatura
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        <View
          style={[
            styles.bookingCard,
            {
              backgroundColor: theme.card,
              borderColor: theme.muted,
            },
          ]}
        >
          <View style={styles.bookingHeader}>
            <View
              style={[
                styles.iconBox,
                { backgroundColor: `${theme.primary}18` },
              ]}
            >
              <Ionicons
                name="calendar-outline"
                size={18}
                color={theme.primary}
              />
            </View>

            <View>
              <Text style={[styles.label, { color: theme.text }]}>
                Próximo agendamento
              </Text>

              <Text style={[styles.value, { color: theme.text }]}>
                {booking ? 'Serviço marcado' : 'Sem serviço marcado'}
              </Text>
            </View>
          </View>

          {booking && (
            <View style={styles.bookingDetails}>
              <BookingDetailCard
                theme={theme}
                icon="cut-outline"
                label="Serviço"
                value={
                  booking.appointment_services?.length > 0
                    ? booking.appointment_services
                        .map((item) => item.services?.name)
                        .join(', ')
                    : 'Serviço'
                }
              />

              <BookingDetailCard
                theme={theme}
                icon="person-outline"
                label="Barbeiro"
                value={booking.barbers?.name || 'Barbeiro'}
              />

              <BookingDetailCard
                theme={theme}
                icon="calendar-number-outline"
                label="Data"
                value={booking.appointment_date}
              />

              <BookingDetailCard
                theme={theme}
                icon="time-outline"
                label="Hora"
                value={booking.appointment_time}
              />

              <TouchableOpacity
                style={[
                  styles.cancelButton,
                  { borderColor: theme.primary },
                ]}
                onPress={handleCancelBooking}
              >
                <Ionicons
                  name="trash-outline"
                  size={17}
                  color={theme.primary}
                />

                <Text style={[styles.cancelText, { color: theme.primary }]}>
                  Cancelar agendamento
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.primary }]}
          onPress={onLogout}
        >
          <Text style={styles.buttonText}>Sair da conta</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 16,
    paddingBottom: 30,
  },
  content: {
    gap: 14,
  },
  item: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 13,
    opacity: 0.7,
    marginBottom: 4,
  },
  value: {
    fontSize: 15,
    fontWeight: '600',
  },
  bookingCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
  },
  bookingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  bookingDetails: {
    marginTop: 14,
    gap: 10,
  },
  bookingDetailCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  smallIconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookingLabel: {
    fontSize: 12,
    opacity: 0.65,
    marginBottom: 3,
  },
  bookingValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  cancelButton: {
    marginTop: 4,
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  cancelText: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  button: {
    marginTop: 10,
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});