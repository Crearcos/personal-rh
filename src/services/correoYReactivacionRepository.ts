import { supabase } from '../lib/supabase';
import type { ApiResponse, Empleado } from '../types/models';

export async function consultarCorreoColaboradorRRHH(empresaId: string, usuarioId: string): Promise<string | null> {
  if (!empresaId.trim() || !usuarioId.trim()) return null;
  try {
    const { data, error } = await supabase.from('usuarios').select('correo').eq('empresa_id', empresaId).eq('id', usuarioId).single();
    return !error && data ? data.correo : null;
  } catch { return null; }
}

export async function cambiarCorreoColaboradorRRHH(empresaId: string, empleadoId: string, entrada: string): Promise<ApiResponse<Empleado>> {
  const correo = entrada.trim().toLowerCase();
  if (!empresaId.trim() || !empleadoId.trim() || correo.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) return { success: false, error: 'Revisa el correo.' };
  try {
    const { data, error } = await supabase.rpc('cambiar_correo_colaborador_rrhh', { p_empresa_id: empresaId, p_empleado_id: empleadoId, p_correo: correo }).single();
    if (error || !data) return { success: false, error: 'No se pudo cambiar el correo.' };
    return { success: true, data };
  } catch { return { success: false, error: 'No se pudo cambiar el correo.' }; }
}

export async function reactivarColaboradorRRHH(empresaId: string, empleadoId: string): Promise<ApiResponse<Empleado>> {
  if (!empresaId.trim() || !empleadoId.trim()) return { success: false, error: 'Revisa los datos del colaborador.' };
  try {
    const { data, error } = await supabase.rpc('reactivar_colaborador_rrhh', { p_empresa_id: empresaId, p_empleado_id: empleadoId }).single();
    if (error || !data) return { success: false, error: 'No se pudo reactivar el colaborador.' };
    return { success: true, data };
  } catch { return { success: false, error: 'No se pudo reactivar el colaborador.' }; }
}
