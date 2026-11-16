import type { ApiResponse } from '../types/models';

export type RolColaborador = 'empleado' | 'jefe' | 'admin';
export interface DatosEmpleadoRRHH {
  nombre: string;
  correo: string;
  cargo: string;
  departamentoId: string;
  jefeId: string;
  fechaIngreso: string;
  rol?: RolColaborador;
}

export type DatosEdicionColaborador = Omit<DatosEmpleadoRRHH, 'correo'> & { id: string };

export interface DatosSaldoRRHH {
  anio: number;
  diasDerecho: number;
  diasTomados: number;
}

function fechaValida(fecha: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return false;
  const fechaUTC = new Date(`${fecha}T00:00:00Z`);
  return !Number.isNaN(fechaUTC.valueOf()) && fechaUTC.toISOString().slice(0, 10) === fecha;
}

export function validarEdicionColaborador(input: DatosEdicionColaborador): ApiResponse<DatosEdicionColaborador> {
  const datos = { ...input, id: input.id.trim(), nombre: input.nombre.trim(), cargo: input.cargo.trim(), departamentoId: input.departamentoId.trim(), jefeId: input.jefeId.trim() };
  if (!datos.id || !datos.nombre || datos.nombre.length > 150 || !datos.cargo || datos.cargo.length > 150) return { success: false, error: 'Ingresa un nombre y un cargo válidos.' };
  if (!datos.departamentoId || !fechaValida(datos.fechaIngreso) || datos.jefeId === datos.id) return { success: false, error: 'Revisa el departamento, el jefe y la fecha de ingreso.' };
  return { success: true, data: datos };
}

export function validarEmpleadoRRHH(input: DatosEmpleadoRRHH): ApiResponse<DatosEmpleadoRRHH> {
  const datos = {
    nombre: input.nombre.trim(), correo: input.correo.trim().toLowerCase(),
    cargo: input.cargo.trim(), departamentoId: input.departamentoId.trim(),
    jefeId: input.jefeId.trim(), fechaIngreso: input.fechaIngreso, rol: input.rol ?? 'empleado',
  };
  if (!['empleado', 'jefe', 'admin'].includes(datos.rol)) return { success: false, error: 'Selecciona un rol válido.' };
  if (!datos.nombre || datos.nombre.length > 150 || !datos.cargo || datos.cargo.length > 150) {
    return { success: false, error: 'Ingresa un nombre y un cargo válidos.' };
  }
  if (datos.correo.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(datos.correo)) {
    return { success: false, error: 'Ingresa un correo válido.' };
  }
  if (!datos.departamentoId || !fechaValida(datos.fechaIngreso)) {
    return { success: false, error: 'Selecciona un departamento y una fecha de ingreso válidos.' };
  }
  return { success: true, data: datos };
}

export function validarSaldoRRHH(input: DatosSaldoRRHH): ApiResponse<DatosSaldoRRHH & { diasPendientes: number }> {
  const { anio, diasDerecho, diasTomados } = input;
  if (!Number.isInteger(anio) || anio < 1900 || anio > 2100) {
    return { success: false, error: 'Ingresa un año válido.' };
  }
  if (!Number.isFinite(diasDerecho) || !Number.isFinite(diasTomados) ||
      diasDerecho < 0 || diasDerecho > 366 || diasTomados < 0 || diasTomados > diasDerecho) {
    return { success: false, error: 'Revisa los días asignados y tomados.' };
  }
  const diasPendientes = Math.round((diasDerecho - diasTomados) * 100) / 100;
  return { success: true, data: { ...input, diasPendientes } };
}
