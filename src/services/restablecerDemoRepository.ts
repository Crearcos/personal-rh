import { supabase } from '../lib/supabase';

export type BloqueoRestablecimiento = { codigo: string; empleado_id: string | null };
export type VistaRestablecimiento = { empresa_id: string; huella: string; version: number; totales: Record<string, number>; bloqueos: BloqueoRestablecimiento[] };
export type OperacionRestablecimiento = { empresa: string; huella: string; operacion: string };
export type ResultadoRestablecimiento = 'completado' | 'rechazado' | 'sin_confirmar';
const registro = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === 'object' && !Array.isArray(value);

export async function obtenerActorRestablecimiento(): Promise<string | null> {
  try {
    const { data, error } = await supabase.auth.getUser();
    return !error && data.user && !data.user.is_anonymous ? data.user.id : null;
  } catch { return null; }
}

function validarVista(data: unknown, empresa: string): data is VistaRestablecimiento {
  if (!registro(data) || data.empresa_id !== empresa || data.version !== 1 || typeof data.huella !== 'string' || !/^[a-f0-9]{32}$/.test(data.huella)) return false;
  if (!registro(data.totales) || !Object.values(data.totales).every((v) => Number.isInteger(v) && Number(v) >= 0)) return false;
  return Array.isArray(data.bloqueos) && data.bloqueos.every((v: unknown) => registro(v) && typeof v.codigo === 'string' && (typeof v.empleado_id === 'string' || v.empleado_id === null));
}

export async function consultarRestablecimiento(empresa: string): Promise<{ success: boolean; data?: VistaRestablecimiento }> {
  try {
    const { data, error } = await supabase.rpc('vista_previa_restablecer_demo', { p_empresa_id: empresa });
    if (error || !validarVista(data, empresa)) return { success: false };
    return { success: true, data };
  } catch { return { success: false }; }
}

export async function ejecutarRestablecimiento(datos: OperacionRestablecimiento): Promise<ResultadoRestablecimiento> {
  try {
    const { data, error } = await supabase.rpc('restablecer_demo_seguro', {
      p_empresa_id: datos.empresa, p_huella: datos.huella, p_confirmacion: 'RESTABLECER', p_operacion: datos.operacion,
    });
    if (error) return ['P0001', '42501', '22023', '55P03'].includes(error.code) ? 'rechazado' : 'sin_confirmar';
    return registro(data) && data.estado === 'completado' ? 'completado' : 'sin_confirmar';
  } catch { return 'sin_confirmar'; }
}
