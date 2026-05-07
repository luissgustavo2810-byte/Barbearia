import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Alert,
  TouchableWithoutFeedback,
  StyleSheet,
  Animated,
} from 'react-native';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';

import ServiceButton from '../components/ServiceButton';
import BarberCard from '../components/BarberCard';
import TimeSlot from '../components/TimeSlot';
import ScreenHero from '../components/ScreenHero';
import {
  getServices,
  getBarbers,
  createAppointment,
  getUnavailableTimes,
} from '../services/bookingService';

LocaleConfig.locales['pt-br'] = {
  monthNames: [
    'Janeiro',
    'Fevereiro',
    'Março',
    'Abril',
    'Maio',
    'Junho',
    'Julho',
    'Agosto',
    'Setembro',
    'Outubro',
    'Novembro',
    'Dezembro',
  ],
  monthNamesShort: [
    'Jan.',
    'Fev.',
    'Mar.',
    'Abr.',
    'Mai.',
    'Jun.',
    'Jul.',
    'Ago.',
    'Set.',
    'Out.',
    'Nov.',
    'Dez.',
  ],
  dayNames: [
    'Domingo',
    'Segunda-feira',
    'Terça-feira',
    'Quarta-feira',
    'Quinta-feira',
    'Sexta-feira',
    'Sábado',
  ],
  dayNamesShort: ['Dom.', 'Seg.', 'Ter.', 'Qua.', 'Qui.', 'Sex.', 'Sáb.'],
  today: 'Hoje',
};

LocaleConfig.defaultLocale = 'pt-br';

function FadeInSection({ children, delay = 0 }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 380,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 380,
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

function SectionCard({ theme, icon, title, subtitle, children }) {
  return (
    <View
      style={[
        styles.sectionCard,
        {
          backgroundColor: theme.card,
          borderColor: theme.muted,
        },
      ]}
    >
      <View style={styles.sectionHeader}>
        <View
          style={[
            styles.sectionIconWrap,
            { backgroundColor: `${theme.primary}18` },
          ]}
        >
          <Ionicons name={icon} size={18} color={theme.primary} />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            {title}
          </Text>
          {!!subtitle && (
            <Text style={[styles.sectionSubtitle, { color: theme.text }]}>
              {subtitle}
            </Text>
          )}
        </View>
      </View>

      <View
        style={[
          styles.sectionDivider,
          { backgroundColor: theme.muted },
        ]}
      />

      {children}
    </View>
  );
}

export default function HomeScreen({ theme, themeName, user }) {
  const [servicesList, setServicesList] = useState([]);
  const [barbers, setBarbers] = useState([]);

  const times = [
    '09:00',
    '10:00',
    '11:00',
    '12:00',
    '13:00',
    '14:00',
    '15:00',
    '16:00',
    '17:00',
  ];

  const [unavailableTimes, setUnavailableTimes] = useState([]);

  const [selectedServices, setSelectedServices] = useState([]);
  const [selectedBarber, setSelectedBarber] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [bookingLoading, setBookingLoading] = useState(false);

  const buttonScale = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const [servicesData, barbersData] = await Promise.all([
        getServices(),
        getBarbers(),
      ]);

      setServicesList(servicesData || []);
      setBarbers(barbersData || []);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível carregar os dados.');
    }
  };
  useEffect(() => {
  if (selectedBarber && selectedDay) {
    loadUnavailableTimes();
  } else {
    setUnavailableTimes([]);
  }
}, [selectedBarber, selectedDay]);

const loadUnavailableTimes = async () => {
  try {
    const timesData = await getUnavailableTimes({
      barberId: selectedBarber.id,
      appointmentDate: selectedDay.dateString,
    });

    setUnavailableTimes(timesData);
  } catch (error) {
    setUnavailableTimes([]);
  }
};

  const toggleService = (service) => {
    setSelectedServices((prev) => {
      const exists = prev.some((s) => s.id === service.id);
      return exists
        ? prev.filter((s) => s.id !== service.id)
        : [...prev, service];
    });
  };

  const total = selectedServices.reduce((sum, s) => sum + s.price, 0);

  const isFormValid =
    selectedBarber &&
    selectedDay &&
    selectedTime &&
    selectedServices.length > 0;

  const confirmBooking = async () => {
  try {
    setBookingLoading(true);
    if (!selectedServices.length) {
      Alert.alert('Erro', 'Selecione um serviço.');
      return;
    }

    await createAppointment({
      userId: user.id,
      barberId: selectedBarber.id,
      serviceId: selectedServices[0].id,
      appointmentDate: selectedDay.dateString,
      appointmentTime: selectedTime,
    });
    Alert.alert('Sucesso', 'Agendamento confirmado!');
    setUnavailableTimes((prev) => [...prev, selectedTime]);

    setSelectedServices([]);
    setSelectedBarber(null);
    setSelectedDay(null);
    setSelectedTime(null);
  } catch (error) {
    if (error.code === '23505') {
      Alert.alert(
        'Horário indisponível',
        'Esse horário acabou de ser reservado. Escolha outro horário.'
      );

      setUnavailableTimes((prev) => [...prev, selectedTime]);
      setSelectedTime(null);
      return;
    }

    Alert.alert('Erro', error.message);
  }
  finally {
  setBookingLoading(false);
}
};

  const pressIn = () => {
    Animated.spring(buttonScale, {
      toValue: 0.97,
      useNativeDriver: true,
      friction: 6,
      tension: 140,
    }).start();
  };

  const pressOut = () => {
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
      <FadeInSection delay={0}>
        <ScreenHero
          theme={theme}
          title="Agende seu horário"
          subtitle="Escolha os serviços, o barbeiro, a data e o melhor horário."
        />
      </FadeInSection>

      <FadeInSection delay={100}>
        <SectionCard
          theme={theme}
          icon="cut-outline"
          title="Serviços"
          subtitle="Selecione um ou mais serviços"
        >
          <View style={styles.row}>
            {servicesList.map((service) => (
              <ServiceButton
                key={service.id}
                item={service}
                selected={selectedServices.some((s) => s.id === service.id)}
                onPress={() => toggleService(service)}
                theme={theme}
              />
            ))}
          </View>
        </SectionCard>
      </FadeInSection>

      <FadeInSection delay={180}>
        <SectionCard
          theme={theme}
          icon="person-outline"
          title="Barbeiros"
          subtitle="Escolha quem vai te atender"
        >
          <View style={styles.row}>
            {barbers.map((barber) => (
              <BarberCard
                key={barber.id}
                barber={barber}
                selected={selectedBarber?.id === barber.id}
                onPress={() => {
                  setSelectedBarber(barber);
                  setSelectedTime(null);
                }}
                theme={theme}
              />
            ))}
          </View>
        </SectionCard>
      </FadeInSection>

      <FadeInSection delay={260}>
        <SectionCard
          theme={theme}
          icon="calendar-outline"
          title="Data"
          subtitle="Escolha o melhor dia para você"
        >
          <Calendar
            key={`calendar-${themeName}`}
            minDate={new Date().toISOString().split('T')[0]}
            onDayPress={(day) => {
              setSelectedDay(day);
              setSelectedTime(null);
            }}
            markedDates={{
              [selectedDay?.dateString]: {
                selected: true,
                selectedColor: theme.primary,
              },
            }}
            theme={{
              backgroundColor: theme.card,
              calendarBackground: theme.card,
              textSectionTitleColor: theme.text,
              dayTextColor: theme.text,
              monthTextColor: theme.text,
              arrowColor: theme.primary,
              selectedDayBackgroundColor: theme.primary,
              selectedDayTextColor: '#ffffff',
              todayTextColor: theme.neon || theme.accent,
              textDisabledColor: theme.muted,
              textMonthFontWeight: 'bold',
              textDayFontWeight: '500',
              textDayHeaderFontWeight: '600',
            }}
            style={styles.calendar}
          />
        </SectionCard>
      </FadeInSection>

      <FadeInSection delay={340}>
        <SectionCard
          theme={theme}
          icon="time-outline"
          title="Horários"
          subtitle="Os horários indisponíveis ficam desativados"
        >
          <View style={styles.grid}>
            {times.map((time) => (
              <TimeSlot
                key={time}
                time={time}
                unavailable={unavailableTimes.includes(time)}
                selected={selectedTime === time}
                onPress={() => setSelectedTime(time)}
                theme={theme}
              />
            ))}
          </View>
        </SectionCard>
      </FadeInSection>

      <FadeInSection delay={420}>
        <View
          style={[
            styles.summaryCard,
            {
              backgroundColor: theme.card,
              borderColor: theme.muted,
            },
          ]}
        >
          <Text style={[styles.summaryTitle, { color: theme.text }]}>
            Resumo do agendamento
          </Text>

          <Text style={[styles.summaryText, { color: theme.text }]}>
            Serviços:{' '}
            {selectedServices.length > 0
              ? selectedServices.map((s) => s.name).join(', ')
              : 'Nenhum selecionado'}
          </Text>

          <Text style={[styles.summaryText, { color: theme.text }]}>
            Barbeiro: {selectedBarber ? selectedBarber.name : 'Não selecionado'}
          </Text>

          <Text style={[styles.summaryText, { color: theme.text }]}>
            Data: {selectedDay ? selectedDay.dateString : 'Não selecionada'}
          </Text>

          <Text style={[styles.summaryText, { color: theme.text }]}>
            Hora: {selectedTime || 'Não selecionada'}
          </Text>

          <View
            style={[
              styles.summaryDivider,
              { backgroundColor: theme.muted },
            ]}
          />

          <Text style={[styles.total, { color: theme.primary }]}>
            TOTAL: R$ {total.toFixed(2)}
          </Text>
        </View>
      </FadeInSection>

      <FadeInSection delay={500}>
        <TouchableWithoutFeedback
          onPress={confirmBooking}
          onPressIn={pressIn}
          onPressOut={pressOut}
          disabled={!isFormValid || bookingLoading}
        >
          <Animated.View
            style={[
              styles.buttonConfirm,
              {
                backgroundColor: theme.primary,
                opacity: isFormValid ? 1 : 0.5,
                transform: [{ scale: buttonScale }],
              },
            ]}
          >
            <Text style={styles.confirmText}>
              {bookingLoading
                ? 'Confirmando...'
                : 'Confirmar agendamento'}
            </Text>
          </Animated.View>
        </TouchableWithoutFeedback>
      </FadeInSection>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 30,
    gap: 18,
  },
  sectionCard: {
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sectionIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: 'bold',
  },
  sectionSubtitle: {
    fontSize: 12,
    marginTop: 2,
    opacity: 0.7,
  },
  sectionDivider: {
    height: 1,
    marginVertical: 14,
    borderRadius: 999,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  calendar: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  summaryCard: {
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
  },
  summaryTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  summaryText: {
    fontSize: 14,
    marginBottom: 8,
  },
  summaryDivider: {
    height: 1,
    marginVertical: 10,
    borderRadius: 999,
  },
  total: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 2,
  },
  buttonConfirm: {
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  confirmText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});