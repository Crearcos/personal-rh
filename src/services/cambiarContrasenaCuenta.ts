import { crearClienteTemporal, supabase } from '../lib/supabase';

type Resultado = 'actualizada' | 'credenciales_invalidas' | 'datos_invalidos' | 'error';

export async function cambiarContrasenaCuenta(actual: string, nueva: string): Promise<Resultado> {
  if (!actual || nueva.length < 10 || nueva.length > 72 || actual === nueva) return 'datos_invalidos';
  const temporal = crearClienteTemporal();
  let sesionTemporal = false;
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user?.id || !data.user.email || data.user.is_anonymous) return 'error';
    const verificacion = await temporal.auth.signInWithPassword({ email: data.user.email, password: actual });
    sesionTemporal = Boolean(verificacion.data.session);
    if (verificacion.error || !verificacion.data.session || verificacion.data.user?.id !== data.user.id) return 'credenciales_invalidas';
    const cambio = await temporal.auth.updateUser({ current_password: actual, password: nueva });
    return cambio.error || cambio.data.user?.id !== data.user.id ? 'error' : 'actualizada';
  } catch { return 'error'; }
  finally {
    if (sesionTemporal) {
      try { await temporal.auth.signOut({ scope: 'local' }); } catch { /* La sesión temporal no se conserva. */ }
    }
  }
}
