import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database.types';
import { validarConfiguracionSupabase } from './configuracionSupabase';

const { url: supabaseUrl, clave: supabaseAnonKey } = validarConfiguracionSupabase(
  import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY,
);

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

export function crearClienteTemporal() {
  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

