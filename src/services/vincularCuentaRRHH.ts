import { supabase } from '../lib/supabase';
import type { RolColaborador } from './gestionRRHHValidation';

export async function vincularCuentaRRHH(empresa: string, empleado: string, correo: string, rol: RolColaborador): Promise<'vinculada' | 'existente' | null> {
  if (!empresa.trim() || !empleado.trim() || !correo.trim() || !['empleado', 'jefe', 'admin'].includes(rol)) return null;
  try {
    const { data, error } = await supabase.rpc('vincular_cuenta_con_rol', { p_empresa: empresa, p_empleado: empleado, p_correo_esperado: correo, p_rol_esperado: rol });
    return !error && (data === 'vinculada' || data === 'existente') ? data : null;
  } catch { return null; }
}
