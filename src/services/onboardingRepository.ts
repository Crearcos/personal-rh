import { supabase } from '../lib/supabase';
import type { ApiResponse, OnboardingTarea } from '../types/models';
import { validarDatosTarea, type DatosTarea } from './onboardingValidacion';

function nuevoId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return `onb_${Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')}`;
}

export async function guardarTareaOnboarding(empresaId: string, entrada: DatosTarea): Promise<ApiResponse<OnboardingTarea>> {
  const datos = validarDatosTarea(entrada);
  if (!empresaId || !datos) return { success: false, error: 'Revisa los datos de la tarea.' };
  try {
    const { data: empleado, error: errorEmpleado } = await supabase.from('empleados').select('id')
      .eq('empresa_id', empresaId).eq('id', datos.empleadoId).maybeSingle();
    if (errorEmpleado || !empleado) return { success: false, error: 'El colaborador no está disponible.' };
    const campos = { tarea: datos.tarea, responsable: datos.responsable, fecha_limite: datos.fechaLimite };
    const consulta = datos.id
      ? supabase.from('onboarding_tareas').update(campos).eq('empresa_id', empresaId).eq('empleado_id', datos.empleadoId).eq('id', datos.id)
      : supabase.from('onboarding_tareas').insert({ id: nuevoId(), empresa_id: empresaId, empleado_id: datos.empleadoId, estado: 'pendiente', ...campos });
    const { data, error } = await consulta.select('*').single();
    if (error || !data) return { success: false, error: 'No se pudo guardar la tarea.' };
    return { success: true, data };
  } catch {
    return { success: false, error: 'No se pudo guardar la tarea.' };
  }
}

export async function eliminarTareaOnboarding(empresaId: string, empleadoId: string, tareaId: string): Promise<ApiResponse<boolean>> {
  if (!empresaId.trim() || !empleadoId.trim() || !tareaId.trim()) return { success: false, error: 'No se pudo identificar la tarea.' };
  try {
    const { data, error } = await supabase.from('onboarding_tareas').delete()
      .eq('empresa_id', empresaId).eq('empleado_id', empleadoId).eq('id', tareaId).select('id').single();
    if (error || !data) return { success: false, error: 'No se pudo eliminar la tarea.' };
    return { success: true, data: true };
  } catch {
    return { success: false, error: 'No se pudo eliminar la tarea.' };
  }
}
