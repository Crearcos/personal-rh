import { supabase } from '../lib/supabase';
import type { ApiResponse, DatosPeriodoEvaluacion, PeriodoEvaluacion } from '../types/models';

function fechaValida(fecha: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return false;
  const valor = new Date(`${fecha}T00:00:00Z`);
  return !Number.isNaN(valor.valueOf()) && valor.toISOString().slice(0, 10) === fecha;
}

export async function fetchPeriodosRRHH(empresaId: string): Promise<ApiResponse<PeriodoEvaluacion[]>> {
  if (!empresaId.trim()) return { success: false, error: 'Empresa no disponible.' };
  try {
    const { data, error } = await supabase.from('periodos_evaluacion').select('*').eq('empresa_id', empresaId).order('nombre', { ascending: false });
    if (error) return { success: false, error: 'No se pudieron cargar los períodos.' };
    return { success: true, data: data || [] };
  } catch { return { success: false, error: 'No se pudieron cargar los períodos.' }; }
}

export async function crearPeriodoRRHH(empresaId: string, entrada: DatosPeriodoEvaluacion): Promise<ApiResponse<PeriodoEvaluacion>> {
  const nombre = entrada.nombre.trim();
  if (!empresaId.trim() || !nombre || nombre.length > 50 || !fechaValida(entrada.fechaInicio) || !fechaValida(entrada.fechaFin) || entrada.fechaInicio > entrada.fechaFin) return { success: false, error: 'Revisa los datos del período.' };
  try {
    const { data, error } = await supabase.rpc('crear_periodo_evaluacion_rrhh', { p_empresa_id: empresaId, p_nombre: nombre, p_fecha_inicio: entrada.fechaInicio, p_fecha_fin: entrada.fechaFin }).single();
    if (error || !data) return { success: false, error: 'No se pudo crear el período.' };
    return { success: true, data };
  } catch { return { success: false, error: 'No se pudo crear el período.' }; }
}

export async function cambiarEstadoPeriodoRRHH(empresaId: string, id: string, estado: 'abierto' | 'cerrado'): Promise<ApiResponse<PeriodoEvaluacion>> {
  if (!empresaId.trim() || !id.trim() || !['abierto', 'cerrado'].includes(estado)) return { success: false, error: 'Revisa el período.' };
  try {
    const { data, error } = await supabase.rpc('estado_periodo_evaluacion_rrhh', { p_empresa_id: empresaId, p_id: id, p_estado: estado }).single();
    if (error || !data) return { success: false, error: 'No se pudo cambiar el período.' };
    return { success: true, data };
  } catch { return { success: false, error: 'No se pudo cambiar el período.' }; }
}
