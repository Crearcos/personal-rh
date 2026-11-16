import { describe, expect, it } from 'vitest';
import { validarEmpleadoRRHH, validarSaldoRRHH } from '../services/gestionRRHHValidation';

const empleado = {
  nombre: 'Ana López', correo: 'ana@example.com', cargo: 'Analista',
  departamentoId: 'dep_ventas', jefeId: 'emp_jefe', fechaIngreso: '2026-01-15',
};

describe('validación de datos para RR. HH.', () => {
  it('normaliza los datos válidos del empleado', () => {
    expect(validarEmpleadoRRHH({ ...empleado, nombre: ' Ana López ', correo: ' ANA@example.com ' }))
      .toMatchObject({ success: true, data: { nombre: 'Ana López', correo: 'ana@example.com' } });
  });

  it.each([
    { nombre: ' ' }, { correo: 'no-es-correo' }, { cargo: '' },
    { departamentoId: '' }, { fechaIngreso: '2026-02-30' },
  ])('rechaza datos incompletos o inválidos: %o', (cambio) => {
    expect(validarEmpleadoRRHH({ ...empleado, ...cambio }).success).toBe(false);
  });

  it('acepta un saldo coherente y calcula los días restantes', () => {
    expect(validarSaldoRRHH({ anio: 2026, diasDerecho: 15, diasTomados: 4 }))
      .toMatchObject({ success: true, data: { diasPendientes: 11 } });
  });

  it.each([
    { anio: 2026, diasDerecho: -1, diasTomados: 0 },
    { anio: 2026, diasDerecho: 15, diasTomados: 16 },
    { anio: 2026, diasDerecho: NaN, diasTomados: 0 },
    { anio: 2026.5, diasDerecho: 15, diasTomados: 0 },
  ])('rechaza saldos incoherentes: %o', (saldo) => {
    expect(validarSaldoRRHH(saldo).success).toBe(false);
  });
});
