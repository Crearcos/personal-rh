import { supabase } from '../lib/supabase';

export interface AccesoAutorizado {
  empresa_id: string;
  rol: 'admin' | 'jefe' | 'empleado';
  empleado_id: string | null;
}

export async function consultarAccesosAutorizados(): Promise<AccesoAutorizado[]> {
  const { data: usuario, error } = await supabase.auth.getUser();
  if (error || !usuario.user || usuario.user.is_anonymous) return [];
  const { data, error: errorAcceso } = await supabase.from('accesos_empresa')
    .select('empresa_id, rol, empleado_id').eq('auth_user_id', usuario.user.id);
  if (errorAcceso || !data) return [];
  return data.filter((acceso): acceso is AccesoAutorizado =>
    Boolean(acceso.empresa_id) && (acceso.rol === 'admin' ||
      ((acceso.rol === 'jefe' || acceso.rol === 'empleado') && Boolean(acceso.empleado_id)))
  );
}
