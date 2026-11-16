import { supabase } from '../lib/supabase';
import type {
  Empresa,
  Usuario,
  Departamento,
  Empleado,
  TipoSolicitud,
  Solicitud,
  SaldoVacaciones,
  CriterioEvaluacion,
  Evaluacion,
  RespuestaEvaluacion,
  OnboardingTarea,
  RegistroActividad,
  ApiResponse,
} from '../types/models';

/**
 * Repositorio de Empresas
 */
export async function fetchEmpresas(): Promise<ApiResponse<Empresa[]>> {
  try {
    const { data, error } = await supabase.from('empresas').select('*').order('nombre');
    if (error) throw error;
    return { success: true, data: data || [] };
  } catch (err) {
    return { success: false, error: (err as Error).message };
  }
}

/**
 * Repositorio de Usuarios por Empresa (Aislamiento Multi-tenant)
 */
export async function fetchUsuariosPorEmpresa(empresaId: string): Promise<ApiResponse<Usuario[]>> {
  try {
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('empresa_id', empresaId)
      .eq('activo', true)
      .order('nombre');
    if (error) throw error;
    return { success: true, data: data || [] };
  } catch (err) {
    return { success: false, error: (err as Error).message };
  }
}

/**
 * Repositorio de Departamentos
 */
export async function fetchDepartamentos(empresaId: string): Promise<ApiResponse<Departamento[]>> {
  try {
    const { data, error } = await supabase
      .from('departamentos')
      .select('*')
      .eq('empresa_id', empresaId)
      .order('nombre');
    if (error) throw error;
    return { success: true, data: data || [] };
  } catch (err) {
    return { success: false, error: (err as Error).message };
  }
}

/**
 * Repositorio de Empleados
 */
export async function fetchEmpleados(empresaId: string, incluirInactivos = false): Promise<ApiResponse<Empleado[]>> {
  try {
    let query = supabase
      .from('empleados')
      .select('*')
      .eq('empresa_id', empresaId);
    if (!incluirInactivos) query = query.eq('activo', true);
    const { data, error } = await query.order('nombre');
    if (error) throw error;
    return { success: true, data: data || [] };
  } catch (err) {
    return { success: false, error: (err as Error).message };
  }
}

/**
 * Repositorio de Tipos de Solicitud
 */
export async function fetchTiposSolicitud(empresaId: string): Promise<ApiResponse<TipoSolicitud[]>> {
  try {
    const { data, error } = await supabase
      .from('tipos_solicitud')
      .select('*')
      .eq('empresa_id', empresaId)
      .order('nombre');
    if (error) throw error;
    return { success: true, data: data || [] };
  } catch (err) {
    return { success: false, error: (err as Error).message };
  }
}

/**
 * Repositorio de Saldos de Vacaciones
 */
export async function fetchSaldos(empresaId: string, anio: number = new Date().getFullYear()): Promise<ApiResponse<SaldoVacaciones[]>> {
  try {
    const { data, error } = await supabase
      .from('saldos_vacaciones')
      .select('*')
      .eq('empresa_id', empresaId)
      .eq('anio', anio);
    if (error) throw error;
    return { success: true, data: data || [] };
  } catch (err) {
    return { success: false, error: (err as Error).message };
  }
}

/**
 * Repositorio de Solicitudes
 */
export async function fetchSolicitudes(empresaId: string): Promise<ApiResponse<Solicitud[]>> {
  try {
    const { data, error } = await supabase
      .from('solicitudes')
      .select('*')
      .eq('empresa_id', empresaId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return { success: true, data: data || [] };
  } catch (err) {
    return { success: false, error: (err as Error).message };
  }
}

/**
 * Crea una nueva solicitud en Supabase
 */
export async function insertSolicitud(
  solicitud: Omit<Solicitud, 'created_at'>
): Promise<ApiResponse<Solicitud>> {
  try {
    const { data, error } = await supabase.rpc('crear_solicitud_validada', {
      p_id: solicitud.id, p_empresa_id: solicitud.empresa_id, p_empleado_id: solicitud.empleado_id,
      p_tipo_id: solicitud.tipo_id, p_desde: solicitud.fecha_desde, p_hasta: solicitud.fecha_hasta, p_motivo: solicitud.motivo,
    }).single();
    if (error || !data) return { success: false, error: mensajeErrorCreacion(error?.message) };
    return { success: true, data };
  } catch {
    return { success: false, error: 'No se pudo registrar la solicitud. Inténtalo nuevamente.' };
  }
}

function mensajeErrorCreacion(error = ''): string {
  if (error.includes('SALDO_INSUFICIENTE')) return 'El saldo disponible no es suficiente o no está registrado para ese año.';
  if (error.includes('SOLICITUD_SUPERPUESTA')) return 'Ya existe una solicitud pendiente o aprobada en estas fechas.';
  if (error.includes('SOLICITUD_ENTRE_ANIOS')) return 'Registra una solicitud separada por cada año.';
  if (error.includes('TIPO_NO_DISPONIBLE')) return 'Este tipo de solicitud ya no está disponible. Actualiza la página.';
  return 'No se pudo registrar la solicitud. Revisa los datos e inténtalo nuevamente.';
}

/**
 * Actualiza el estado de una solicitud (Aprobar o Rechazar con comentario)
 * y descuenta saldo en caso de aprobación
 */
export async function resolveSolicitud(
  solicitudId: string,
  empresaId: string,
  nuevoEstado: 'aprobada' | 'rechazada',
  aprobadorId: string,
  comentario: string
): Promise<ApiResponse<Solicitud>> {
  try {
    const { data, error } = await supabase.rpc('resolver_solicitud_atomica', {
      p_solicitud_id: solicitudId, p_empresa_id: empresaId, p_estado: nuevoEstado,
      p_aprobador_id: aprobadorId, p_comentario: comentario,
    }).single();
    if (error || !data) return { success: false, error: mensajeErrorResolucion(error?.message) };
    return { success: true, data };
  } catch {
    return { success: false, error: 'No se pudo resolver la solicitud. Inténtalo nuevamente.' };
  }
}

function mensajeErrorResolucion(error = ''): string {
  if (error.includes('SALDO_INSUFICIENTE')) return 'El saldo disponible para el año de la solicitud no es suficiente o no está registrado.';
  if (error.includes('SOLICITUD_SUPERPUESTA')) return 'Ya existe una ausencia aprobada que coincide con estas fechas.';
  if (error.includes('COLABORADOR_FUERA_DEL_EQUIPO')) return 'Este colaborador ya no está asignado a tu equipo. Actualiza la página.';
  if (error.includes('SOLICITUD_NO_DISPONIBLE')) return 'La solicitud ya fue procesada o no está disponible. Actualiza la página.';
  if (error.includes('SOLICITUD_ENTRE_ANIOS')) return 'Para vacaciones entre años, registra una solicitud separada por cada año.';
  return 'No se pudo resolver la solicitud. Revisa sus datos e inténtalo nuevamente.';
}

/**
 * Elimina una tarjeta de solicitud del historial
 * Mantiene intacto el saldo vacacional (no altera días disponibles ni tomados)
 */
export async function deleteSolicitud(
  solicitudId: string,
  empresaId: string
): Promise<ApiResponse<boolean>> {
  try {
    // 1. Obtener la solicitud antes de eliminarla para registrar su detalle
    const { data: sol, error: solErr } = await supabase
      .from('solicitudes')
      .select('*')
      .eq('id', solicitudId)
      .eq('empresa_id', empresaId)
      .single();
    if (solErr || !sol) throw new Error('Solicitud no encontrada');

    // 2. Eliminar de la base de datos (solicitudes)
    const { error: delErr } = await supabase
      .from('solicitudes')
      .delete()
      .eq('id', solicitudId)
      .eq('empresa_id', empresaId);
    if (delErr) throw delErr;

    return { success: true, data: true };
  } catch (err) {
    return { success: false, error: (err as Error).message };
  }
}

/**
 * Repositorio de Criterios y Evaluaciones
 */
export async function fetchCriterios(empresaId: string): Promise<ApiResponse<CriterioEvaluacion[]>> {
  try {
    const { data, error } = await supabase
      .from('criterios_evaluacion')
      .select('*')
      .eq('empresa_id', empresaId);
    if (error) throw error;
    return { success: true, data: data || [] };
  } catch (err) {
    return { success: false, error: (err as Error).message };
  }
}

export async function fetchEvaluaciones(empresaId: string): Promise<ApiResponse<Evaluacion[]>> {
  try {
    const { data, error } = await supabase
      .from('evaluaciones')
      .select('*')
      .eq('empresa_id', empresaId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return { success: true, data: data || [] };
  } catch (err) {
    return { success: false, error: (err as Error).message };
  }
}

export async function insertEvaluacion(
  evaluacion: Omit<Evaluacion, 'created_at'>,
  respuestas: { criterio_id: string; puntaje: number; comentario: string }[]
): Promise<ApiResponse<Evaluacion>> {
  if (!evaluacion.evaluador_id) return { success: false, error: 'No se pudo registrar la evaluación.' };
  try {
    const { data, error } = await supabase.rpc('crear_evaluacion_rrhh', {
      p_id: evaluacion.id, p_empresa_id: evaluacion.empresa_id, p_empleado_id: evaluacion.empleado_id,
      p_evaluador_id: evaluacion.evaluador_id, p_periodo: evaluacion.periodo,
      p_comentarios: evaluacion.comentarios || '', p_respuestas: respuestas,
    }).single();
    if (error || !data) return { success: false, error: 'No se pudo registrar la evaluación.' };
    return { success: true, data };
  } catch {
    return { success: false, error: 'No se pudo registrar la evaluación.' };
  }
}

export async function fetchRespuestasEvaluacion(
  evaluacionId: string,
  empresaId: string,
  empleadoId: string
): Promise<ApiResponse<RespuestaEvaluacion[]>> {
  try {
    const { data: evaluacion, error: evaluacionError } = await supabase
      .from('evaluaciones')
      .select('id')
      .eq('id', evaluacionId)
      .eq('empresa_id', empresaId)
      .eq('empleado_id', empleadoId)
      .single();
    if (evaluacionError || !evaluacion) throw new Error('Evaluación no disponible');
    const { data, error } = await supabase
      .from('respuestas_evaluacion')
      .select('*')
      .eq('evaluacion_id', evaluacionId);
    if (error) throw error;
    return { success: true, data: data || [] };
  } catch (err) {
    return { success: false, error: (err as Error).message };
  }
}

/**
 * Repositorio de Onboarding
 */
export async function fetchOnboardingTareas(empresaId: string, empleadoId?: string): Promise<ApiResponse<OnboardingTarea[]>> {
  try {
    let query = supabase
      .from('onboarding_tareas')
      .select('*')
      .eq('empresa_id', empresaId)
      .order('fecha_limite');

    if (empleadoId) {
      query = query.eq('empleado_id', empleadoId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return { success: true, data: data || [] };
  } catch (err) {
    return { success: false, error: (err as Error).message };
  }
}

export async function toggleOnboardingEstado(
  tareaId: string,
  empresaId: string,
  nuevoEstado: 'pendiente' | 'en_progreso' | 'completada'
): Promise<ApiResponse<OnboardingTarea>> {
  try {
    const { data, error } = await supabase.rpc('cambiar_estado_onboarding', {
      p_empresa: empresaId, p_tarea: tareaId, p_estado: nuevoEstado,
    }).single();
    if (error || !data) throw error;
    return { success: true, data };
  } catch {
    return { success: false, error: 'No se pudo actualizar la tarea. Inténtalo nuevamente.' };
  }
}

/**
 * Repositorio de Actividad
 */
export async function fetchRegistroActividad(empresaId: string): Promise<ApiResponse<RegistroActividad[]>> {
  try {
    const { data, error } = await supabase
      .from('registro_actividad')
      .select('*')
      .eq('empresa_id', empresaId)
      .order('fecha', { ascending: false })
      .limit(20);
    if (error) throw error;
    return { success: true, data: data || [] };
  } catch (err) {
    return { success: false, error: (err as Error).message };
  }
}

/**
 * El restablecimiento global anterior permanece deshabilitado.
 */
export async function triggerResetDemoData(): Promise<ApiResponse<boolean>> {
  return { success: false, error: 'El restablecimiento de la demo no está disponible.' };
}

