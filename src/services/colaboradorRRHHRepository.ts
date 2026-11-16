import { supabase } from '../lib/supabase';
import type { ApiResponse, Empleado } from '../types/models';
import { validarEmpleadoRRHH, validarEdicionColaborador, type DatosEmpleadoRRHH, type DatosEdicionColaborador } from './gestionRRHHValidation';

export async function crearColaboradorRRHH(empresaId: string, entrada: DatosEmpleadoRRHH): Promise<ApiResponse<Empleado>> {
  const resultado = validarEmpleadoRRHH(entrada);
  if (!empresaId.trim() || !resultado.success || !resultado.data) return { success: false, error: 'Revisa los datos del colaborador.' };
  const datos = resultado.data;
  try {
    const { data, error } = await supabase.rpc('crear_colaborador_con_rol', {
      p_empresa_id: empresaId, p_nombre: datos.nombre, p_correo: datos.correo, p_cargo: datos.cargo,
      p_departamento_id: datos.departamentoId, p_jefe_id: datos.jefeId, p_fecha_ingreso: datos.fechaIngreso, p_rol: datos.rol ?? 'empleado',
    }).single();
    if (error || !data) return { success: false, error: 'No se pudo crear el colaborador.' };
    return { success: true, data };
  } catch {
    return { success: false, error: 'No se pudo crear el colaborador.' };
  }
}

export async function editarColaboradorRRHH(empresaId: string, entrada: DatosEdicionColaborador): Promise<ApiResponse<Empleado>> {
  const resultado = validarEdicionColaborador(entrada);
  if (!empresaId.trim() || !resultado.success || !resultado.data) return { success: false, error: 'Revisa los datos del colaborador.' };
  const datos = resultado.data;
  try {
    const { data, error } = await supabase.rpc('editar_colaborador_rrhh', { p_empresa_id: empresaId, p_empleado_id: datos.id, p_nombre: datos.nombre, p_cargo: datos.cargo, p_departamento_id: datos.departamentoId, p_jefe_id: datos.jefeId, p_fecha_ingreso: datos.fechaIngreso }).single();
    if (error || !data) return { success: false, error: 'No se pudo actualizar el colaborador.' };
    return { success: true, data };
  } catch { return { success: false, error: 'No se pudo actualizar el colaborador.' }; }
}

export async function desactivarColaboradorRRHH(empresaId: string, empleadoId: string): Promise<ApiResponse<Empleado>> {
  if (!empresaId.trim() || !empleadoId.trim()) return { success: false, error: 'Revisa los datos del colaborador.' };
  try {
    const { data, error } = await supabase.rpc('desactivar_colaborador_rrhh', { p_empresa_id: empresaId, p_empleado_id: empleadoId }).single();
    if (error || !data) return { success: false, error: 'No se pudo desactivar el colaborador.' };
    return { success: true, data };
  } catch { return { success: false, error: 'No se pudo desactivar el colaborador.' }; }
}
