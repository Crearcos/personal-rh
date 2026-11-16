import { describe, expect, it } from 'vitest';
import { resolverSesionDemo } from '../services/sesionDemo';
import type { Empleado, Usuario } from '../types/models';

const usuarios = [
  { id: 'u1', empresa_id: 'a', rol: 'jefe', activo: true, correo: 'jefe@demo.test' },
  { id: 'u2', empresa_id: 'a', rol: 'empleado', activo: true, correo: 'emp@demo.test' },
  { id: 'u3', empresa_id: 'b', rol: 'empleado', activo: true, correo: 'b@demo.test' },
] as Usuario[];
const empleados = [
  { id: 'j1', usuario_id: 'u1', empresa_id: 'a', nombre: 'Jefe A', cargo: 'Jefe', activo: true },
  { id: 'e1', usuario_id: 'u2', empresa_id: 'a', jefe_id: 'j1', nombre: 'Empleado A', cargo: 'Operador', activo: true },
  { id: 'e2', usuario_id: 'u3', empresa_id: 'b', nombre: 'Empleado B', cargo: 'Operador', activo: true },
] as Empleado[];

describe('identidad de demostración', () => {
  it('selecciona un empleado y un jefe de la empresa elegida', () => {
    expect(resolverSesionDemo('a', 'jefe', usuarios, empleados)?.empleadoId).toBe('j1');
    expect(resolverSesionDemo('b', 'empleado', usuarios, empleados)?.empleadoId).toBe('e2');
    expect(resolverSesionDemo('b', 'jefe', usuarios, empleados)).toBeNull();
  });
  it('no utiliza personas inactivas ni usuarios de otra empresa', () => {
    expect(resolverSesionDemo('a', 'jefe', usuarios, empleados.map((e) => ({ ...e, activo: false })))).toBeNull();
    expect(resolverSesionDemo('b', 'jefe', [...usuarios, { ...usuarios[0], empresa_id: 'b' }], empleados)).toBeNull();
  });
  it('elige un empleado del equipo del jefe de demostración cuando existe', () => {
    const otro = { ...empleados[1], id: 'e0', usuario_id: 'u4', jefe_id: null, nombre: 'Primero' } as Empleado;
    const otroUsuario = { ...usuarios[1], id: 'u4' } as Usuario;
    expect(resolverSesionDemo('a', 'empleado', [...usuarios, otroUsuario], [empleados[0], otro, empleados[1]])?.empleadoId).toBe('e1');
  });
});
