import { supabase } from '../lib/supabase';
import type { RolColaborador } from './gestionRRHHValidation';

export async function cambiarRolColaborador(empresa: string, empleado: string, rol: RolColaborador): Promise<boolean> {
  if (!empresa.trim() || !empleado.trim() || !['empleado', 'jefe', 'admin'].includes(rol)) return false;
  try {
    const { data, error } = await supabase.rpc('cambiar_rol_colaborador', { p_empresa: empresa, p_empleado: empleado, p_rol: rol });
    return !error && data === rol;
  } catch { return false; }
}
