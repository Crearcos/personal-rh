import { supabase } from '../lib/supabase';

export async function iniciarSesion(correo: string, contrasena: string): Promise<boolean> {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: correo.trim().toLowerCase(),
      password: contrasena,
    });
    return !error && Boolean(data.session);
  } catch {
    return false;
  }
}

export async function cerrarSesion(): Promise<boolean> {
  try {
    const { error } = await supabase.auth.signOut();
    return !error;
  } catch {
    return false;
  }
}
