import { supabase } from '../lib/supabase';

export async function getServices() {
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) throw error;

  return data;
}

export async function getBarbers() {
  const { data, error } = await supabase
    .from('barbers')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) throw error;

  return data;
}

export async function createAppointment({
  userId,
  barberId,
  services,
  appointmentDate,
  appointmentTime,
}) {

  const total = services.reduce(
    (sum, service) => sum + Number(service.price),
    0
  );

  const { data: appointment, error: appointmentError } = await supabase
    .from('appointments')
    .insert({
      user_id: userId,
      barber_id: barberId,
      appointment_date: appointmentDate,
      appointment_time: appointmentTime,
      total,
      payment_status: 'pending',
    })
    .select()
    .single();

  if (appointmentError) throw appointmentError;

  const appointmentServices = services.map((service) => ({
    appointment_id: appointment.id,
    service_id: service.id,
  }));

  const { error: servicesError } = await supabase
    .from('appointment_services')
    .insert(appointmentServices);

  if (servicesError) throw servicesError;

  await createPayment({
    userId,
    appointmentId: appointment.id,
    type: 'appointment',
    amount: total,
    method: 'pix',
  });

  return appointment;
}

export async function getUserNextAppointment(userId) {
  const { data, error } = await supabase
    .from('appointments')
    .select(`
      id,
      appointment_date,
      appointment_time,
      status,
      total,
      barbers (
        name
      ),
      appointment_services (
        price,
        services (
          name
        )
      )
    `)
    .eq('user_id', userId)
    .order('appointment_date', { ascending: true })
    .order('appointment_time', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) throw error;

  return data;
}

export async function cancelAppointment(appointmentId) {
  const { error } = await supabase
    .from('appointments')
    .delete()
    .eq('id', appointmentId);

  if (error) throw error;
}

export async function getUnavailableTimes({ barberId, appointmentDate }) {
  const { data, error } = await supabase.rpc('get_unavailable_times', {
    p_barber_id: barberId,
    p_date: appointmentDate,
  });

  if (error) throw error;

  return data.map((item) => item.appointment_time);
}

export async function getAppointmentsByDate(date) {
  const { data, error } = await supabase
    .from('appointments')
    .select(`
      id,
      appointment_date,
      appointment_time,
      total,
      status,
      profiles (
        name,
        phone
      ),
      barbers (
        name
      ),
      appointment_services (
        price,
        services (
          name
        )
      )
    `)
    .eq('appointment_date', date)
    .order('appointment_time', { ascending: true });

  if (error) throw error;

  return data;
}

export async function getBlockedDates() {
  const { data, error } = await supabase
    .from('blocked_dates')
    .select('*')
    .order('blocked_date', { ascending: true });

  if (error) throw error;

  return data;
}

export async function blockDate({ blockedDate, reason }) {
  const { error } = await supabase
    .from('blocked_dates')
    .insert({
      blocked_date: blockedDate,
      reason,
    });

  if (error) throw error;
}

export async function unblockDate(blockedDateId) {
  const { error } = await supabase
    .from('blocked_dates')
    .delete()
    .eq('id', blockedDateId);

  if (error) throw error;
}

export async function getBlockedWeekdays() {
  const { data, error } = await supabase
    .from('blocked_weekdays')
    .select('*')
    .order('weekday', { ascending: true });

  if (error) throw error;

  return data;
}

export async function blockWeekday({ weekday, reason }) {
  const { error } = await supabase
    .from('blocked_weekdays')
    .insert({
      weekday,
      reason,
    });

  if (error) throw error;
}

export async function unblockWeekday(weekdayId) {
  const { error } = await supabase
    .from('blocked_weekdays')
    .delete()
    .eq('id', weekdayId);

  if (error) throw error;
}

export async function getBlockedTimesByDate(date) {
  const { data, error } = await supabase
    .from('blocked_times')
    .select('*')
    .eq('blocked_date', date)
    .order('blocked_time', { ascending: true });

  if (error) throw error;

  return data;
}

export async function blockTime({ blockedDate, blockedTime, reason }) {
  const { error } = await supabase
    .from('blocked_times')
    .insert({
      blocked_date: blockedDate,
      blocked_time: blockedTime,
      reason,
    });

  if (error) throw error;
}

export async function unblockTime(blockedTimeId) {
  const { error } = await supabase
    .from('blocked_times')
    .delete()
    .eq('id', blockedTimeId);

  if (error) throw error;
}

export async function getPlans() {
  const { data, error } = await supabase
    .from('plans')
    .select('*')
    .eq('active', true)
    .order('price', { ascending: true });

  if (error) throw error;

  return data;
}

export async function getUserSubscription(userId) {
  const { data, error } = await supabase
    .from('user_subscriptions')
    .select(`
      *,
      plans (*)
    `)
    .eq('user_id', userId)
    .eq('status', 'active')
    .single();

  if (error && error.code !== 'PGRST116') {
    throw error;
  }

  return data;
}

export async function subscribeToPlan({
  userId,
  planId,
}) {
  const { data: existingSubscription } = await supabase
    .from('user_subscriptions')
    .select('*')
    .eq('user_id', userId)
    .in('status', ['active', 'pending_payment'])
    .maybeSingle();

  if (existingSubscription) {
    throw new Error('Você já possui uma assinatura.');
  }

  const { data: plan, error: planError } = await supabase
    .from('plans')
    .select('*')
    .eq('id', planId)
    .single();

  if (planError || !plan) {
    throw new Error('Plano não encontrado.');
  }

  const expiresAt = new Date();
  expiresAt.setMonth(expiresAt.getMonth() + 1);

  const { data: subscription, error } = await supabase
    .from('user_subscriptions')
    .insert({
      user_id: userId,
      plan_id: planId,
      status: 'pending_payment',
      expires_at: expiresAt.toISOString(),
    })
    .select()
    .single();

  if (error) throw error;

  await createPayment({
    userId,
    subscriptionId: subscription.id,
    type: 'subscription',
    amount: plan.price,
    method: 'pix',
  });

  return subscription;
}

export async function cancelSubscription(subscriptionId) {
  const { error } = await supabase
    .from('user_subscriptions')
    .update({
      status: 'cancelled',
    })
    .eq('id', subscriptionId);

  if (error) throw error;
}

export async function createPlan({
  name,
  description,
  price,
  benefits,
}) {
  const { error } = await supabase
    .from('plans')
    .insert({
      name,
      description,
      price,
      benefits,
      active: true,
    });

  if (error) throw error;
}

export async function updatePlanStatus(planId, active) {
  const { error } = await supabase
    .from('plans')
    .update({ active })
    .eq('id', planId);

  if (error) throw error;
}

export async function getAllPlansAdmin() {
  const { data, error } = await supabase
    .from('plans')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) throw error;

  return data;
}

export async function updatePlan(planId, fields) {
  const { error } = await supabase
    .from('plans')
    .update(fields)
    .eq('id', planId);

  if (error) throw error;
}

export async function getDashboardStats() {
  const today = new Date().toISOString().split('T')[0];

  const startMonth = new Date();
  startMonth.setDate(1);

  const monthDate = startMonth.toISOString().split('T')[0];

  const [
    appointmentsToday,
    appointmentsMonth,
    subscriptions,
  ] = await Promise.all([
    supabase
      .from('appointments')
      .select('total')
      .eq('appointment_date', today),

    supabase
      .from('appointments')
      .select('total')
      .gte('appointment_date', monthDate),

    supabase
      .from('user_subscriptions')
      .select('*')
      .eq('status', 'active'),
  ]);

  if (
    appointmentsToday.error ||
    appointmentsMonth.error ||
    subscriptions.error
  ) {
    throw new Error('Erro ao carregar dashboard');
  }

  const revenueToday = appointmentsToday.data.reduce(
    (sum, item) => sum + Number(item.total || 0),
    0
  );

  const revenueMonth = appointmentsMonth.data.reduce(
    (sum, item) => sum + Number(item.total || 0),
    0
  );

  return {
    revenueToday,
    revenueMonth,
    appointmentsToday: appointmentsToday.data.length,
    activeSubscriptions: subscriptions.data.length,
  };
}

export async function createPayment({
  userId,
  appointmentId = null,
  subscriptionId = null,
  type,
  amount,
  method = 'pix',
}) {
  const { data, error } = await supabase
    .from('payments')
    .insert({
      user_id: userId,
      appointment_id: appointmentId,
      subscription_id: subscriptionId,
      type,
      amount,
      method,
      status: 'pending',
    })
    .select()
    .single();

  if (error) throw error;

  return data;
}

export async function getUserPayments(userId) {
  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return data;
}

export async function getAllPaymentsAdmin() {
  const { data, error } = await supabase
    .from('payments')
    .select(`
      *,
      profiles (
        name,
        phone
      )
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return data;
}

export async function updatePaymentStatus(paymentId, status) {
  const updateData = {
    status,
  };

  if (status === 'paid') {
    updateData.paid_at = new Date().toISOString();
  }

  const { data: payment, error } = await supabase
    .from('payments')
    .update(updateData)
    .eq('id', paymentId)
    .select()
    .single();

  if (error) throw error;

  if (
    status === 'paid' &&
    payment.type === 'subscription' &&
    payment.subscription_id
  ) {
    const { error: subscriptionError } = await supabase
      .from('user_subscriptions')
      .update({
        status: 'active',
      })
      .eq('id', payment.subscription_id);

    if (subscriptionError) throw subscriptionError;
  }

  if (
    status === 'paid' &&
    payment.type === 'appointment' &&
    payment.appointment_id
  ) {
    const { error: appointmentError } = await supabase
      .from('appointments')
      .update({
        payment_status: 'paid',
      })
      .eq('id', payment.appointment_id);

    if (appointmentError) throw appointmentError;
  }

  return payment;
}

export async function getPendingPaymentsCount() {
  const { count, error } = await supabase
    .from('payments')
    .select('*', {
      count: 'exact',
      head: true,
    })
    .eq('status', 'pending');

  if (error) throw error;

  return count || 0;
}

export async function getPaymentsAdmin() {
  const { data, error } = await supabase
    .from('payments')
    .select(`
      *,
      profiles (
        name,
        phone
      )
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return data;
}