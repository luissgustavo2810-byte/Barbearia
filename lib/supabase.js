import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://eybfirqzklvwtkpdztpx.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5YmZpcnF6a2x2d3RrcGR6dHB4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0OTA5NDIsImV4cCI6MjA5MzA2Njk0Mn0.MXZRmo4lvpiyS-njDRRXlwiaSnEuO6LJX8eMVSdkjXE';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});