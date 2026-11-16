import { describe, expect, it } from 'vitest';
import { filtrarDirectorio } from '../services/directorio.service';
import type { Empleado } from '../types/models';

const empleados = [
  { id: 'e1', nombre: 'María Torres', cargo: 'Asesora', departamento_id: 'ventas', tipo_contrato: 'Indefinido', activo: true },
  { id: 'e2', nombre: 'Luis Pinto', cargo: 'Asesor', departamento_id: 'ventas', tipo_contrato: 'Temporal', activo: false },
  { id: 'e3', nombre: 'Ana Solís', cargo: 'Analista', departamento_id: 'sistemas', tipo_contrato: 'Indefinido', activo: true },
] as Empleado[];

describe('Filtros del directorio', () => {
  it('distingue colaboradores activos e inactivos sin alterar la lista original', () => {
    expect(filtrarDirectorio(empleados, '', 'todos', 'activos').map((item) => item.id)).toEqual(['e1', 'e3']);
    expect(filtrarDirectorio(empleados, '', 'todos', 'inactivos').map((item) => item.id)).toEqual(['e2']);
    expect(filtrarDirectorio(empleados, '', 'todos', 'todos')).toHaveLength(3);
    expect(empleados).toHaveLength(3);
  });
  it('combina departamento y búsqueda sin distinguir tildes', () => {
    expect(filtrarDirectorio(empleados, 'maria', 'ventas', 'todos').map((item) => item.id)).toEqual(['e1']);
    expect(filtrarDirectorio(empleados, 'maria', 'sistemas', 'todos')).toHaveLength(0);
  });
});
