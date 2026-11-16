import type { Empleado } from '../types/models';

export type EstadoDirectorio = 'activos' | 'inactivos' | 'todos';

function normalizar(texto: string): string {
  return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
}

export function filtrarDirectorio(empleados: readonly Empleado[], busqueda: string, departamento: string, estado: EstadoDirectorio): Empleado[] {
  const texto = normalizar(busqueda);
  return empleados.filter((empleado) => {
    if (departamento !== 'todos' && empleado.departamento_id !== departamento) return false;
    if (estado === 'activos' && !empleado.activo) return false;
    if (estado === 'inactivos' && empleado.activo) return false;
    return [empleado.nombre, empleado.cargo, empleado.tipo_contrato, empleado.id]
      .some((campo) => normalizar(campo || '').includes(texto));
  });
}
