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
    })
    .select()
    .single();

  if (appointmentError) throw appointmentError;

  const servicesPayload = services.map((service) => ({
    appointment_id: appointment.id,
    service_id: service.id,
    price: service.price,
  }));

  const { error: servicesError } = await supabase
    .from('appointment_services')
    .insert(servicesPayload);

  if (servicesError) throw servicesError;

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
  const existing = await getUserSubscription(userId);

  if (existing) {
    throw new Error('Você já possui um plano ativo.');
  }

  const expiresAt = new Date();

  expiresAt.setMonth(expiresAt.getMonth() + 1);

  const { error } = await supabase
    .from('user_subscriptions')
    .insert({
      user_id: userId,
      plan_id: planId,
      status: 'active',
      expires_at: expiresAt.toISOString(),
    });

  if (error) throw error;
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