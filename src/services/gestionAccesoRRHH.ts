import { supabase } from '../lib/supabase';
import type { RolColaborador } from './gestionRRHHValidation';

export async function estadoAcceso(empresa: string, empleado: string): Promise<'activo' | 'sin_acceso' | null> {
  try { const { data, error } = await supabase.rpc('estado_acceso_colaborador', { p_empresa: empresa, p_empleado: empleado });
    return !error && (data === 'activo' || data === 'sin_acceso') ? data : null;
  } catch { return null; }
}
export async function revocarAcceso(empresa: string, empleado: string): Promise<boolean> {
  try { const { data, error } = await supabase.rpc('revocar_acceso_colaborador', { p_empresa: empresa, p_empleado: empleado }); return !error && data === true; }
  catch { return false; }
}
export async function crearAccesoRRHH(empresa: string, empleado: string, correo: string, password: string, rol: RolColaborador): Promise<'creada' | 'sin_vincular' | 'error'> {
  try {
    const { data, error } = await supabase.functions.invoke('crear-acceso', { body: { empresa, empleado, correo, password, rol } });
    return !error && (data?.resultado === 'creada' || data?.resultado === 'sin_vincular') ? data.resultado : 'error';
  } catch { return 'error'; }
}

export async function restablecerClaveRRHH(empresa: string, empleado: string, correo: string, password: string): Promise<'actualizada' | 'rechazada' | 'no_permitida' | 'sin_confirmar'> {
  try {
    const { data, error } = await supabase.functions.invoke('restablecer-clave', { body: { empresa, empleado, correo, password } });
    if (error) return 'sin_confirmar';
    if (data?.resultado === 'actualizada') return 'actualizada';
    if (data?.resultado === 'rechazada') return 'rechazada';
    return data?.resultado === 'no_permitida' || data?.resultado === 'datos_invalidos' ? 'no_permitida' : 'sin_confirmar';
  } catch { return 'sin_confirmar'; }
}
