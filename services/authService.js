import { supabase } from '../lib/supabase';

export async function registerUser({ name, email, phone, password }) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) throw error;

  const userId = data.user?.id;

  if (!userId) {
    throw new Error('Não foi possível criar o usuário.');
  }

  const { error: profileError } = await supabase.from('profiles').insert({
    id: userId,
    name,
    phone,
  });

  if (profileError) throw profileError;

  return {
    id: userId,
    name,
    email,
    phone,
    plan: null,
    booking: null,
  };
}

export async function loginUser({ email, password }) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;

  const userId = data.user?.id;

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (profileError) throw profileError;

  return {
    id: userId,
    name: profile.name,
    email: data.user.email,
    phone: profile.phone,
    plan: null,
    booking: null,
  };
}

export async function logoutUser() {
  const { error } = await supabase.auth.signOut();

  if (error) throw error;
}