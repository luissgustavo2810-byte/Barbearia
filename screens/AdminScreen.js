import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Animated,
  Modal,
  TextInput,
} from 'react-native';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';

import {
  getAppointmentsByDate,
  cancelAppointment,
  getBlockedDates,
  blockDate,
  unblockDate,
  getBlockedWeekdays,
  blockWeekday,
  unblockWeekday,
  getBlockedTimesByDate,
  blockTime,
  unblockTime,
  createPlan,
  updatePlanStatus,
  getAllPlansAdmin,
  updatePlan,
} from '../services/bookingService';

LocaleConfig.defaultLocale = 'pt-br';

const weekdays = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
const times = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];

function AdminSection({ theme, icon, title, subtitle, children, expanded, onToggle }) {
  const animation = useRef(new Animated.Value(expanded ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(animation, {
      toValue: expanded ? 1 : 0,
      duration: 220,
      useNativeDriver: false,
    }).start();
  }, [expanded]);

  const bodyHeight = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 5000],
  });

  const opacity = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  return (
    <View style={[styles.sectionCard, { backgroundColor: theme.card, borderColor: theme.muted }]}>
      <TouchableOpacity activeOpacity={0.8} onPress={onToggle} style={styles.sectionHeader}>
        <View style={[styles.sectionIcon, { backgroundColor: `${theme.primary}18` }]}>
          <Ionicons name={icon} size={19} color={theme.primary} />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>{title}</Text>
          {!!subtitle && (
            <Text style={[styles.sectionSubtitle, { color: theme.text }]}>
              {subtitle}
            </Text>
          )}
        </View>

        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={22}
          color={theme.primary}
        />
      </TouchableOpacity>

      <Animated.View style={{ maxHeight: bodyHeight, opacity, overflow: 'hidden' }}>
        <View style={[styles.sectionDivider, { backgroundColor: theme.muted }]} />
        {children}
      </Animated.View>
    </View>
  );
}

function BlockOptionCard({ theme, icon, title, subtitle, children }) {
  return (
    <View style={[styles.blockOptionCard, { backgroundColor: theme.background, borderColor: theme.muted }]}>
      <View style={styles.blockOptionHeader}>
        <View style={[styles.blockIcon, { backgroundColor: `${theme.primary}18` }]}>
          <Ionicons name={icon} size={18} color={theme.primary} />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={[styles.blockTitle, { color: theme.text }]}>{title}</Text>
          <Text style={[styles.helperText, { color: theme.text }]}>{subtitle}</Text>
        </View>
      </View>

      <View style={styles.blockContent}>{children}</View>
    </View>
  );
}

function AppointmentCard({ theme, appointment, onCancel }) {
  const services =
    appointment.appointment_services?.length > 0
      ? appointment.appointment_services.map((item) => item.services?.name).join(', ')
      : 'Serviço não informado';

  return (
    <View style={[styles.appointmentCard, { backgroundColor: theme.background, borderColor: theme.muted }]}>
      <View style={styles.appointmentHeader}>
        <View style={[styles.iconBox, { backgroundColor: `${theme.primary}18` }]}>
          <Ionicons name="time-outline" size={18} color={theme.primary} />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={[styles.appointmentTime, { color: theme.primary }]}>
            {appointment.appointment_time}
          </Text>
          <Text style={[styles.clientName, { color: theme.text }]}>
            {appointment.profiles?.name || 'Cliente'}
          </Text>
        </View>
      </View>

      <View style={styles.details}>
        <Text style={[styles.detailText, { color: theme.text }]}>Serviço: {services}</Text>
        <Text style={[styles.detailText, { color: theme.text }]}>
          Barbeiro: {appointment.barbers?.name || 'Barbeiro'}
        </Text>
        <Text style={[styles.detailText, { color: theme.text }]}>
          Telefone: {appointment.profiles?.phone || 'Não informado'}
        </Text>
        <Text style={[styles.total, { color: theme.primary }]}>
          Total: R$ {Number(appointment.total || 0).toFixed(2)}
        </Text>
      </View>

      <TouchableOpacity style={[styles.cancelButton, { borderColor: theme.primary }]} onPress={onCancel}>
        <Ionicons name="trash-outline" size={17} color={theme.primary} />
        <Text style={[styles.cancelText, { color: theme.primary }]}>Cancelar horário</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function AdminScreen({ theme, onLogout }) {
  const today = new Date().toISOString().split('T')[0];

  const [selectedDate, setSelectedDate] = useState(today);
  const [showCalendar, setShowCalendar] = useState(false);
  const [appointments, setAppointments] = useState([]);
  const [blockedDates, setBlockedDates] = useState([]);
  const [blockedWeekdays, setBlockedWeekdays] = useState([]);
  const [blockedTimes, setBlockedTimes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [plans, setPlans] = useState([]);
  const [expandedSection, setExpandedSection] = useState('agenda');
  const [creatingPlan, setCreatingPlan] = useState(false);

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [editName, setEditName] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editBenefits, setEditBenefits] = useState('');
  const [savingPlan, setSavingPlan] = useState(false);

  useEffect(() => {
    loadAppointments();
    loadBlockedData();
    loadPlans();
  }, [selectedDate]);

  const loadBlockedData = async () => {
    try {
      const [dates, weekdaysData, timesData] = await Promise.all([
        getBlockedDates(),
        getBlockedWeekdays(),
        getBlockedTimesByDate(selectedDate),
      ]);

      setBlockedDates(dates || []);
      setBlockedWeekdays(weekdaysData || []);
      setBlockedTimes(timesData || []);
    } catch (error) {}
  };

  const loadAppointments = async () => {
    try {
      setLoading(true);
      const data = await getAppointmentsByDate(selectedDate);
      setAppointments(data || []);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível carregar os agendamentos.');
    } finally {
      setLoading(false);
    }
  };

  const loadPlans = async () => {
    try {
      const data = await getAllPlansAdmin();
      setPlans(data || []);
    } catch (error) {}
  };

  const handleCancelAppointment = (appointmentId) => {
    Alert.alert('Cancelar horário', 'Tem certeza que deseja cancelar este agendamento?', [
      { text: 'Não' },
      {
        text: 'Sim, cancelar',
        style: 'destructive',
        onPress: async () => {
          try {
            await cancelAppointment(appointmentId);
            await loadAppointments();
            Alert.alert('Sucesso', 'Agendamento cancelado.');
          } catch (error) {
            Alert.alert('Erro', 'Não foi possível cancelar.');
          }
        },
      },
    ]);
  };

  const handleSelectToday = () => {
    setSelectedDate(today);
    setShowCalendar(false);
  };

  const handleSelectDate = (day) => {
    setSelectedDate(day.dateString);
    setShowCalendar(false);
  };

  const handleBlockDate = async () => {
    try {
      await blockDate({
        blockedDate: selectedDate,
        reason: 'Bloqueado pelo administrador',
      });

      await loadBlockedData();
      Alert.alert('Sucesso', 'Data bloqueada.');
    } catch (error) {
      Alert.alert('Erro', 'Essa data já está bloqueada.');
    }
  };

  const handleUnblockDate = async (id) => {
    try {
      await unblockDate(id);
      await loadBlockedData();
      Alert.alert('Sucesso', 'Data desbloqueada.');
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível desbloquear.');
    }
  };

  const handleBlockTime = async (time) => {
    try {
      await blockTime({
        blockedDate: selectedDate,
        blockedTime: time,
        reason: 'Bloqueado pelo administrador',
      });

      await loadBlockedData();
      Alert.alert('Sucesso', 'Horário bloqueado.');
    } catch (error) {
      Alert.alert('Erro', 'Esse horário já está bloqueado.');
    }
  };

  const handleUnblockTime = async (id) => {
    try {
      await unblockTime(id);
      await loadBlockedData();
      Alert.alert('Sucesso', 'Horário desbloqueado.');
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível desbloquear.');
    }
  };

  const handleBlockWeekday = async (weekday) => {
    try {
      await blockWeekday({
        weekday,
        reason: 'Bloqueado pelo administrador',
      });

      await loadBlockedData();
      Alert.alert('Sucesso', 'Dia da semana bloqueado.');
    } catch (error) {
      Alert.alert('Erro', 'Esse dia já está bloqueado.');
    }
  };

  const handleUnblockWeekday = async (id) => {
    try {
      await unblockWeekday(id);
      await loadBlockedData();
      Alert.alert('Sucesso', 'Dia desbloqueado.');
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível desbloquear.');
    }
  };

  const handleCreatePlan = async () => {
    try {
      setCreatingPlan(true);

      await createPlan({
        name: 'Novo plano',
        description: 'Edite este plano depois',
        price: 0,
        benefits: 'Benefício 1, Benefício 2',
      });

      await loadPlans();
      Alert.alert('Sucesso', 'Plano criado.');
    } catch (error) {
      Alert.alert('Erro', error.message || 'Não foi possível criar o plano.');
    } finally {
      setCreatingPlan(false);
    }
  };

  const openEditPlan = (plan) => {
    setEditingPlan(plan);
    setEditName(plan.name || '');
    setEditPrice(String(plan.price || '0'));
    setEditDescription(plan.description || '');
    setEditBenefits(
      Array.isArray(plan.benefits)
        ? plan.benefits.join(', ')
        : plan.benefits || ''
    );
    setEditModalVisible(true);
  };

  const handleSavePlan = async () => {
    if (!editingPlan) return;

    if (!editName.trim()) {
      Alert.alert('Atenção', 'Informe o nome do plano.');
      return;
    }

    try {
      setSavingPlan(true);

      await updatePlan(editingPlan.id, {
        name: editName.trim(),
        price: Number(editPrice.replace(',', '.')) || 0,
        description: editDescription.trim(),
        benefits: editBenefits.trim(),
      });

      await loadPlans();

      setEditModalVisible(false);
      setEditingPlan(null);

      Alert.alert('Sucesso', 'Plano atualizado.');
    } catch (error) {
      Alert.alert('Erro', error.message || 'Não foi possível salvar o plano.');
    } finally {
      setSavingPlan(false);
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <View style={[styles.fixedTop, { backgroundColor: theme.background }]}>
        <View style={[styles.actionBar, { backgroundColor: theme.card, borderColor: theme.muted }]}>
          <TouchableOpacity style={[styles.navButton, { backgroundColor: theme.primary }]} onPress={handleSelectToday}>
            <Ionicons name="calendar-outline" size={17} color="#fff" />
            <Text style={styles.navButtonText}>Hoje</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.navButtonOutline, { borderColor: theme.primary }]} onPress={() => setShowCalendar(!showCalendar)}>
            <Ionicons name="calendar-number-outline" size={17} color={theme.primary} />
            <Text style={[styles.navButtonOutlineText, { color: theme.primary }]}>
              Escolher data
            </Text>
          </TouchableOpacity>
        </View>

        {showCalendar && (
          <View style={[styles.calendarCard, { backgroundColor: theme.card, borderColor: theme.muted }]}>
            <Calendar
              minDate={today}
              onDayPress={handleSelectDate}
              markedDates={{
                [selectedDate]: {
                  selected: true,
                  selectedColor: theme.primary,
                },
                [today]: {
                  marked: true,
                  dotColor: theme.primary,
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
          </View>
        )}
      </View>

      <ScrollView
        contentContainerStyle={[styles.container, { backgroundColor: theme.background }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.selectedDateCard, { backgroundColor: `${theme.primary}18`, borderColor: theme.primary }]}>
          <View style={styles.selectedDateLeft}>
            <Ionicons name="calendar-number-outline" size={22} color={theme.primary} />
            <View>
              <Text style={[styles.selectedDateLabel, { color: theme.text }]}>
                Data selecionada
              </Text>
              <Text style={[styles.selectedDateValue, { color: theme.primary }]}>
                {selectedDate === today ? `${selectedDate} • Hoje` : selectedDate}
              </Text>
            </View>
          </View>
        </View>

        <AdminSection
          theme={theme}
          icon="calendar-outline"
          title="Agenda do dia"
          subtitle={selectedDate === today ? 'Visualizando os agendamentos de hoje.' : `Visualizando ${selectedDate}.`}
          expanded={expandedSection === 'agenda'}
          onToggle={() => setExpandedSection(expandedSection === 'agenda' ? null : 'agenda')}
        >
          <View style={styles.infoPillRow}>
            <View style={[styles.infoPill, { backgroundColor: theme.background, borderColor: theme.muted }]}>
              <Ionicons name="calendar-number-outline" size={16} color={theme.primary} />
              <Text style={[styles.infoPillText, { color: theme.text }]}>{selectedDate}</Text>
            </View>

            <View style={[styles.infoPill, { backgroundColor: theme.background, borderColor: theme.muted }]}>
              <Ionicons name="people-outline" size={16} color={theme.primary} />
              <Text style={[styles.infoPillText, { color: theme.text }]}>
                {appointments.length} horário(s)
              </Text>
            </View>
          </View>

          <Text style={[styles.countText, { color: theme.text }]}>
            {loading ? 'Carregando agendamentos...' : `${appointments.length} agendamento(s) encontrado(s)`}
          </Text>

          <View style={styles.list}>
            {!loading && appointments.length === 0 && (
              <Text style={[styles.emptyText, { color: theme.text }]}>
                Nenhum agendamento para esta data.
              </Text>
            )}

            {appointments.map((appointment) => (
              <AppointmentCard
                key={appointment.id}
                theme={theme}
                appointment={appointment}
                onCancel={() => handleCancelAppointment(appointment.id)}
              />
            ))}
          </View>
        </AdminSection>

        <AdminSection
          theme={theme}
          icon="ban-outline"
          title="Bloqueios"
          subtitle="Controle datas, horários específicos e dias fixos."
          expanded={expandedSection === 'bloqueios'}
          onToggle={() => setExpandedSection(expandedSection === 'bloqueios' ? null : 'bloqueios')}
        >
          <BlockOptionCard
            theme={theme}
            icon="calendar-outline"
            title="Data específica"
            subtitle={`Bloqueia totalmente a data selecionada: ${selectedDate}`}
          >
            <TouchableOpacity style={[styles.actionButton, { backgroundColor: theme.primary }]} onPress={handleBlockDate}>
              <Ionicons name="lock-closed-outline" size={17} color="#fff" />
              <Text style={styles.actionButtonText}>Bloquear esta data</Text>
            </TouchableOpacity>

            <View style={styles.tagsWrap}>
              {blockedDates.length === 0 ? (
                <Text style={[styles.emptyText, { color: theme.text }]}>
                  Nenhuma data bloqueada.
                </Text>
              ) : (
                blockedDates.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.tag, { borderColor: theme.primary }]}
                    onPress={() => handleUnblockDate(item.id)}
                  >
                    <Text style={[styles.tagText, { color: theme.primary }]}>
                      {item.blocked_date}
                    </Text>
                  </TouchableOpacity>
                ))
              )}
            </View>
          </BlockOptionCard>

          <BlockOptionCard
            theme={theme}
            icon="time-outline"
            title="Horário específico"
            subtitle={`Bloqueia apenas um horário em ${selectedDate}.`}
          >
            <View style={styles.tagsWrap}>
              {times.map((time) => {
                const blocked = blockedTimes.find((item) => item.blocked_time === time);

                return (
                  <TouchableOpacity
                    key={time}
                    style={[
                      styles.tag,
                      {
                        backgroundColor: blocked ? theme.primary : 'transparent',
                        borderColor: theme.primary,
                      },
                    ]}
                    onPress={() => {
                      if (blocked) {
                        handleUnblockTime(blocked.id);
                      } else {
                        handleBlockTime(time);
                      }
                    }}
                  >
                    <Text style={[styles.tagText, { color: blocked ? '#fff' : theme.primary }]}>
                      {time}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </BlockOptionCard>

          <BlockOptionCard
            theme={theme}
            icon="repeat-outline"
            title="Dias fixos da semana"
            subtitle="Use para fechar sempre no mesmo dia, como domingo."
          >
            <View style={styles.tagsWrap}>
              {weekdays.map((day, index) => {
                const blocked = blockedWeekdays.some((item) => item.weekday === index);

                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.tag,
                      {
                        backgroundColor: blocked ? theme.primary : 'transparent',
                        borderColor: theme.primary,
                      },
                    ]}
                    onPress={() => {
                      if (blocked) {
                        const found = blockedWeekdays.find((item) => item.weekday === index);
                        handleUnblockWeekday(found.id);
                      } else {
                        handleBlockWeekday(index);
                      }
                    }}
                  >
                    <Text style={[styles.tagText, { color: blocked ? '#fff' : theme.primary }]}>
                      {day}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </BlockOptionCard>
        </AdminSection>

        <AdminSection
          theme={theme}
          icon="card-outline"
          title="Planos"
          subtitle="Gerencie os planos de assinatura."
          expanded={expandedSection === 'planos'}
          onToggle={() => setExpandedSection(expandedSection === 'planos' ? null : 'planos')}
        >
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.primary, marginBottom: 16 }]}
            onPress={handleCreatePlan}
          >
            <Ionicons name="add-outline" size={18} color="#fff" />
            <Text style={styles.actionButtonText}>
              {creatingPlan ? 'Criando...' : 'Criar plano'}
            </Text>
          </TouchableOpacity>

          <View style={styles.list}>
            {plans.length === 0 && (
              <Text style={[styles.emptyText, { color: theme.text }]}>
                Nenhum plano cadastrado.
              </Text>
            )}

            {plans.map((plan) => (
              <View
                key={plan.id}
                style={[
                  styles.appointmentCard,
                  {
                    backgroundColor: theme.background,
                    borderColor: theme.muted,
                  },
                ]}
              >
                <View style={styles.appointmentHeader}>
                  <View style={[styles.iconBox, { backgroundColor: `${theme.primary}18` }]}>
                    <Ionicons name="diamond-outline" size={18} color={theme.primary} />
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={[styles.clientName, { color: theme.text }]}>
                      {plan.name}
                    </Text>

                    <Text style={[styles.detailText, { color: theme.primary }]}>
                      R$ {Number(plan.price || 0).toFixed(2)}
                    </Text>
                  </View>
                </View>

                <View style={styles.details}>
                  <Text style={[styles.detailText, { color: theme.text }]}>
                    {plan.description || 'Sem descrição'}
                  </Text>

                  <Text style={[styles.detailText, { color: plan.active ? '#2ecc71' : '#e74c3c' }]}>
                    {plan.active ? 'Ativo' : 'Desativado'}
                  </Text>
                </View>

                <TouchableOpacity
                  style={[styles.cancelButton, { borderColor: theme.primary }]}
                  onPress={() => openEditPlan(plan)}
                >
                  <Ionicons name="create-outline" size={17} color={theme.primary} />
                  <Text style={[styles.cancelText, { color: theme.primary }]}>
                    Editar plano
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.cancelButton, { borderColor: theme.primary }]}
                  onPress={async () => {
                    try {
                      await updatePlanStatus(plan.id, !plan.active);
                      await loadPlans();
                    } catch (error) {
                      Alert.alert(
                        'Erro ao alterar plano',
                        error.message || 'Não foi possível alterar o plano.'
                     );
                    }
                  }}
                >
                  <Ionicons
                    name={plan.active ? 'close-circle-outline' : 'checkmark-circle-outline'}
                    size={17}
                    color={theme.primary}
                  />

                  <Text style={[styles.cancelText, { color: theme.primary }]}>
                    {plan.active ? 'Desativar plano' : 'Ativar plano'}
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </AdminSection>

        <AdminSection
          theme={theme}
          icon="person-circle-outline"
          title="Conta"
          subtitle="Ações da conta administrativa."
          expanded={expandedSection === 'conta'}
          onToggle={() => setExpandedSection(expandedSection === 'conta' ? null : 'conta')}
        >
          <TouchableOpacity style={[styles.logoutButton, { backgroundColor: theme.primary }]} onPress={onLogout}>
            <Ionicons name="log-out-outline" size={18} color="#fff" />
            <Text style={styles.logoutText}>Sair da conta</Text>
          </TouchableOpacity>
        </AdminSection>
      </ScrollView>

      <Modal
        visible={editModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: theme.card, borderColor: theme.muted }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              Editar plano
            </Text>

            <TextInput
              style={[styles.input, { color: theme.text, borderColor: theme.muted, backgroundColor: theme.background }]}
              placeholder="Nome do plano"
              placeholderTextColor={theme.muted}
              value={editName}
              onChangeText={setEditName}
            />

            <TextInput
              style={[styles.input, { color: theme.text, borderColor: theme.muted, backgroundColor: theme.background }]}
              placeholder="Preço"
              placeholderTextColor={theme.muted}
              keyboardType="numeric"
              value={editPrice}
              onChangeText={setEditPrice}
            />

            <TextInput
              style={[styles.input, { color: theme.text, borderColor: theme.muted, backgroundColor: theme.background }]}
              placeholder="Descrição"
              placeholderTextColor={theme.muted}
              value={editDescription}
              onChangeText={setEditDescription}
            />

            <TextInput
              style={[
                styles.input,
                styles.textArea,
                { color: theme.text, borderColor: theme.muted, backgroundColor: theme.background },
              ]}
              placeholder="Benefícios separados por vírgula"
              placeholderTextColor={theme.muted}
              value={editBenefits}
              onChangeText={setEditBenefits}
              multiline
            />

            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: theme.primary }]}
              onPress={handleSavePlan}
            >
              <Ionicons name="save-outline" size={18} color="#fff" />
              <Text style={styles.actionButtonText}>
                {savingPlan ? 'Salvando...' : 'Salvar alterações'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.cancelButton, { borderColor: theme.primary }]}
              onPress={() => setEditModalVisible(false)}
            >
              <Ionicons name="close-outline" size={18} color={theme.primary} />
              <Text style={[styles.cancelText, { color: theme.primary }]}>
                Fechar
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },

  fixedTop: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 8,
    zIndex: 999,
    elevation: 20,
  },

  container: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 30,
    gap: 18,
  },

  actionBar: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 12,
    flexDirection: 'row',
    gap: 10,
  },

  navButton: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 7,
  },

  navButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },

  navButtonOutline: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 7,
    borderWidth: 1,
  },

  navButtonOutlineText: {
    fontWeight: 'bold',
    fontSize: 14,
  },

  calendarCard: {
    borderWidth: 1,
    borderRadius: 22,
    padding: 10,
    marginTop: 10,
  },

  calendar: {
    borderRadius: 16,
    overflow: 'hidden',
  },

  selectedDateCard: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
  },

  selectedDateLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  selectedDateLabel: {
    fontSize: 13,
    opacity: 0.75,
    marginBottom: 3,
  },

  selectedDateValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },

  sectionCard: {
    borderWidth: 1,
    borderRadius: 22,
    padding: 16,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  sectionIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },

  sectionSubtitle: {
    fontSize: 13,
    opacity: 0.7,
    marginTop: 3,
    lineHeight: 18,
  },

  sectionDivider: {
    height: 1,
    marginVertical: 18,
    borderRadius: 999,
  },

  infoPillRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },

  infoPill: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 15,
    paddingVertical: 12,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  infoPillText: {
    fontSize: 13,
    fontWeight: '600',
  },

  countText: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 14,
  },

  list: {
    gap: 14,
  },

  emptyText: {
    fontSize: 14,
    opacity: 0.7,
    lineHeight: 20,
  },

  appointmentCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
  },

  appointmentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },

  appointmentTime: {
    fontSize: 19,
    fontWeight: 'bold',
  },

  clientName: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 3,
  },

  details: {
    marginTop: 14,
    gap: 8,
  },

  detailText: {
    fontSize: 14,
    opacity: 0.85,
    lineHeight: 19,
  },

  total: {
    fontSize: 15,
    fontWeight: 'bold',
    marginTop: 4,
  },

  cancelButton: {
    marginTop: 15,
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

  blockOptionCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 15,
    marginBottom: 14,
  },

  blockOptionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },

  blockIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  blockTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },

  blockContent: {
    marginTop: 14,
  },

  helperText: {
    fontSize: 13,
    opacity: 0.7,
    lineHeight: 19,
  },

  actionButton: {
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },

  actionButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },

  tagsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 8,
  },

  tag: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },

  tagText: {
    fontWeight: '600',
  },

  logoutButton: {
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },

  logoutText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    padding: 18,
  },

  modalCard: {
    borderWidth: 1,
    borderRadius: 22,
    padding: 18,
  },

  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 14,
  },

  input: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 13,
    marginBottom: 12,
    fontSize: 14,
  },

  textArea: {
    minHeight: 90,
    textAlignVertical: 'top',
  },
});