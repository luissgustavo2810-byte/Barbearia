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
  serviceId,
  appointmentDate,
  appointmentTime,
}) {
  const { data, error } = await supabase
    .from('appointments')
    .insert({
      user_id: userId,
      barber_id: barberId,
      service_id: serviceId,
      appointment_date: appointmentDate,
      appointment_time: appointmentTime,
    })
    .select()
    .single();

  if (error) throw error;

  return data;
}

export async function getUserNextAppointment(userId) {
  const { data, error } = await supabase
    .from('appointments')
    .select(`
      id,
      appointment_date,
      appointment_time,
      status,
      services (
        name
      ),
      barbers (
        name
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

