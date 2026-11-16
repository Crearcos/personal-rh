import { supabase } from '../lib/supabase';
import type { ApiResponse, TipoSolicitud, DatosTipoSolicitud } from '../types/models';

export async function guardarTipoSolicitud(empresaId: string, entrada: DatosTipoSolicitud): Promise<ApiResponse<TipoSolicitud>> {
  const nombre = entrada.nombre.trim();
  if (!empresaId.trim() || !nombre || nombre.length > 100 || typeof entrada.descuentaSaldo !== 'boolean') return { success: false, error: 'Revisa los datos del tipo.' };
  try {
    const { data, error } = await supabase.rpc('guardar_tipo_solicitud_rrhh', { p_empresa_id: empresaId, p_id: entrada.id || '', p_nombre: nombre, p_descuenta_saldo: entrada.descuentaSaldo, p_activo: true }).single();
    if (error || !data) return { success: false, error: 'No se pudo guardar el tipo.' };
    return { success: true, data };
  } catch { return { success: false, error: 'No se pudo guardar el tipo.' }; }
}

export async function cambiarEstadoTipoSolicitud(empresaId: string, id: string, activo: boolean): Promise<ApiResponse<TipoSolicitud>> {
  if (!empresaId.trim() || !id.trim() || typeof activo !== 'boolean') return { success: false, error: 'Revisa los datos del tipo.' };
  try {
    const { data, error } = await supabase.rpc('estado_tipo_solicitud_rrhh', { p_empresa_id: empresaId, p_id: id, p_activo: activo }).single();
    if (error || !data) return { success: false, error: 'No se pudo cambiar el estado.' };
    return { success: true, data };
  } catch { return { success: false, error: 'No se pudo cambiar el estado.' }; }
}
