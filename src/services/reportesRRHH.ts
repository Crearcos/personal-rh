import type { Departamento, Empleado, Evaluacion, Solicitud, TipoSolicitud } from '../types/models';

export interface FilaAusencia { nombre: string; departamento: string; tipo: string; desde: string; hasta: string; dias: number; motivo: string }
export interface FilaEvaluacion { nombre: string; departamento: string; periodo: string; puntaje: number | null; comentario: string }

function datosColaborador(id: string, empleados: readonly Empleado[], departamentos: readonly Departamento[]) {
  const empleado = empleados.find((item) => item.id === id);
  const departamento = departamentos.find((item) => item.id === empleado?.departamento_id);
  return { nombre: empleado?.nombre || 'Colaborador no disponible', departamento: departamento?.nombre || 'No disponible' };
}

export function prepararReporteAusencias(solicitudes: readonly Solicitud[], empleados: readonly Empleado[], departamentos: readonly Departamento[], tipos: readonly TipoSolicitud[], desde: string, hasta: string): FilaAusencia[] {
  if (!desde || !hasta || desde > hasta) return [];
  return solicitudes.filter((item) => item.estado === 'aprobada' && item.fecha_desde <= hasta && item.fecha_hasta >= desde)
    .map((item) => ({ ...datosColaborador(item.empleado_id, empleados, departamentos), tipo: tipos.find((tipo) => tipo.id === item.tipo_id)?.nombre || 'No disponible', desde: item.fecha_desde, hasta: item.fecha_hasta, dias: Number(item.dias), motivo: item.motivo || 'Sin motivo registrado' }))
    .sort((a, b) => a.desde.localeCompare(b.desde) || a.nombre.localeCompare(b.nombre, 'es'));
}

export function prepararReporteEvaluaciones(evaluaciones: readonly Evaluacion[], empleados: readonly Empleado[], departamentos: readonly Departamento[], periodo: string): FilaEvaluacion[] {
  return evaluaciones.filter((item) => item.estado === 'cerrada' && (periodo === 'todos' || item.periodo === periodo))
    .map((item) => ({ ...datosColaborador(item.empleado_id, empleados, departamentos), periodo: item.periodo, puntaje: item.puntaje_total == null ? null : Number(item.puntaje_total), comentario: item.comentarios || 'Sin comentario general' }))
    .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es') || b.periodo.localeCompare(a.periodo));
}
