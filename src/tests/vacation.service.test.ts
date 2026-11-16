import { describe, it, expect } from 'vitest';
import {
  calculateVacationDays,
  hasDateOverlap,
  validateVacationRequest,
  deductVacationBalance,
} from '../services/vacation.service';
import type { SaldoVacaciones, Solicitud } from '../types/models';

describe('Vacation Service (Codex Business Logic)', () => {
  describe('calculateVacationDays', () => {
    it('calcula correctamente los días de un mismo día', () => {
      const dias = calculateVacationDays('2026-06-01', '2026-06-01');
      expect(dias).toBe(1.0);
    });

    it('calcula correctamente un período de 5 días inclusivos', () => {
      const dias = calculateVacationDays('2026-06-01', '2026-06-05');
      expect(dias).toBe(5.0);
    });

    it('lanza error si la fecha inicial es posterior a la final', () => {
      expect(() => calculateVacationDays('2026-06-10', '2026-06-05')).toThrow(
        'La fecha inicial no puede ser posterior a la fecha final.'
      );
    });

    it('lanza error si las fechas no son válidas', () => {
      expect(() => calculateVacationDays('fecha-invalida', '2026-06-05')).toThrow(
        'Fechas inválidas'
      );
    });
  });

  describe('hasDateOverlap', () => {
    const solicitudesMock: Solicitud[] = [
      {
        id: 'sol_1',
        empresa_id: 'emp_andes',
        empleado_id: 'emp_1',
        tipo_id: 'tipo_vacaciones',
        fecha_desde: '2026-06-10',
        fecha_hasta: '2026-06-15',
        dias: 6,
        motivo: 'Vacaciones previas',
        estado: 'aprobada',
        aprobador_id: 'jefe_1',
        fecha_resolucion: '2026-06-01',
        comentario: 'Aprobado',
        created_at: '2026-06-01',
      },
      {
        id: 'sol_2',
        empresa_id: 'emp_andes',
        empleado_id: 'emp_1',
        tipo_id: 'tipo_vacaciones',
        fecha_desde: '2026-06-20',
        fecha_hasta: '2026-06-25',
        dias: 6,
        motivo: 'Solicitud rechazada',
        estado: 'rechazada',
        aprobador_id: 'jefe_1',
        fecha_resolucion: '2026-06-01',
        comentario: 'Rechazado',
        created_at: '2026-06-01',
      },
    ];

    it('detecta solapamiento cuando las fechas se cruzan', () => {
      const solapa = hasDateOverlap(solicitudesMock, '2026-06-14', '2026-06-18');
      expect(solapa).toBe(true);
    });

    it('no detecta solapamiento en fechas libres', () => {
      const solapa = hasDateOverlap(solicitudesMock, '2026-06-01', '2026-06-05');
      expect(solapa).toBe(false);
    });

    it('ignora solicitudes rechazadas en la validación', () => {
      const solapa = hasDateOverlap(solicitudesMock, '2026-06-21', '2026-06-24');
      expect(solapa).toBe(false);
    });
  });

  describe('validateVacationRequest', () => {
    const saldoMock: SaldoVacaciones = {
      id: 'saldo_1',
      empresa_id: 'emp_andes',
      empleado_id: 'emp_1',
      anio: 2026,
      dias_derecho: 15,
      dias_tomados: 10,
      dias_pendientes: 5,
      created_at: '2026-01-01',
    };

    it('solicita separar vacaciones que atraviesan dos años', () => {
      const res = validateVacationRequest(saldoMock, [], '2026-12-31', '2027-01-01');
      expect(res.isValid).toBe(false);
      expect(res.errorMessage).toMatch(/separada por cada año/i);
    });

    it('no valida vacaciones de otro año con el saldo cargado', () => {
      const res = validateVacationRequest(saldoMock, [], '2027-02-01', '2027-02-02');
      expect(res.isValid).toBe(false);
      expect(res.errorMessage).toMatch(/saldo.*año/i);
    });

    it('aprueba solicitud cuando los días están dentro del saldo y no hay cruce', () => {
      const res = validateVacationRequest(saldoMock, [], '2026-07-01', '2026-07-03');
      expect(res.isValid).toBe(true);
      expect(res.diasCalculados).toBe(3);
      expect(res.diasDisponibles).toBe(5);
    });

    it('rechaza con mensaje claro si los días solicitados superan el saldo', () => {
      const res = validateVacationRequest(saldoMock, [], '2026-07-01', '2026-07-08');
      expect(res.isValid).toBe(false);
      expect(res.diasCalculados).toBe(8);
      expect(res.errorMessage).toContain('superan el saldo disponible');
    });

    it('permite solicitud sin descontar saldo aunque supere días pendientes (ej. permiso médico)', () => {
      const res = validateVacationRequest(saldoMock, [], '2026-07-01', '2026-07-08', false);
      expect(res.isValid).toBe(true);
      expect(res.diasCalculados).toBe(8);
    });

    it('rechaza si hay solapamiento de fechas con solicitud previa', () => {
      const existente: Solicitud = {
        id: 'sol_1',
        empresa_id: 'emp_andes',
        empleado_id: 'emp_1',
        tipo_id: 'tipo_vacaciones',
        fecha_desde: '2026-07-01',
        fecha_hasta: '2026-07-05',
        dias: 5,
        motivo: 'Vacaciones',
        estado: 'pendiente',
        aprobador_id: null,
        fecha_resolucion: null,
        comentario: null,
        created_at: '2026-06-01',
      };
      const res = validateVacationRequest(saldoMock, [existente], '2026-07-02', '2026-07-04');
      expect(res.isValid).toBe(false);
      expect(res.errorMessage).toContain('Ya existe una solicitud pendiente o aprobada');
    });

    it('maneja errores en fechas inválidas retornando isValid false', () => {
      const res = validateVacationRequest(saldoMock, [], '2026-07-10', '2026-07-05');
      expect(res.isValid).toBe(false);
      expect(res.errorMessage).toContain('La fecha inicial no puede ser posterior');
    });
  });

  describe('deductVacationBalance (Inmutabilidad ECC)', () => {
    const saldoMock: SaldoVacaciones = {
      id: 'saldo_1',
      empresa_id: 'emp_andes',
      empleado_id: 'emp_1',
      anio: 2026,
      dias_derecho: 15,
      dias_tomados: 3,
      dias_pendientes: 12,
      created_at: '2026-01-01',
    };

    it('deduce los días tomados y recalcula los pendientes sin mutar el objeto original', () => {
      const nuevoSaldo = deductVacationBalance(saldoMock, 5);

      expect(nuevoSaldo.dias_tomados).toBe(8);
      expect(nuevoSaldo.dias_pendientes).toBe(7);
      expect(saldoMock.dias_tomados).toBe(3); // Inmutabilidad garantizada
      expect(saldoMock.dias_pendientes).toBe(12);
      expect(nuevoSaldo).not.toBe(saldoMock);
    });
  });
});
