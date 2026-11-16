import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ajustarSaldoRRHH, acreditarSaldoRRHH } from '../services/saldoRRHHRepository';
import type { SaldoVacaciones } from '../types/models';

const { rpc, single } = vi.hoisted(() => ({ rpc: vi.fn(), single: vi.fn() }));
vi.mock('../lib/supabase', () => ({ supabase: { rpc } }));
const saldo = { id: 's1', empresa_id: 'a', empleado_id: 'e1', anio: 2026, dias_tomados: 5, dias_derecho: 15, dias_pendientes: 10 } as SaldoVacaciones;

describe('servicio de ajuste de saldo', () => {
  beforeEach(() => { vi.resetAllMocks(); rpc.mockReturnValue({ single }); });
  it('rechaza saldos de otra empresa o un valor menor a los días tomados', async () => {
    expect((await ajustarSaldoRRHH('b', saldo, 18)).success).toBe(false);
    expect((await ajustarSaldoRRHH('a', saldo, 4)).success).toBe(false);
    expect(rpc).not.toHaveBeenCalled();
  });
  it('envía identificadores y días asignados a la operación transaccional', async () => {
    single.mockResolvedValue({ data: { ...saldo, dias_derecho: 18, dias_pendientes: 13 }, error: null });
    expect((await ajustarSaldoRRHH('a', saldo, 18)).success).toBe(true);
    expect(rpc).toHaveBeenCalledWith('ajustar_saldo_vacaciones', { p_empresa_id: 'a', p_empleado_id: 'e1', p_saldo_id: 's1', p_anio: 2026, p_dias_derecho: 18 });
  });
  it('devuelve un mensaje seguro ante un error de base de datos', async () => {
    single.mockResolvedValue({ data: null, error: { message: 'detalle interno' } });
    expect(await ajustarSaldoRRHH('a', saldo, 18)).toEqual({ success: false, error: 'No se pudo guardar el saldo.' });
  });
  it('acredita con empresa, motivo e identificador de operación', async () => {
    single.mockResolvedValue({ data: { ...saldo, dias_derecho: 30, dias_pendientes: 25 }, error: null });
    expect((await acreditarSaldoRRHH('a', saldo, 15, ' Demo ', 'op')).success).toBe(true);
    expect(rpc).toHaveBeenCalledWith('acreditar_saldo_vacaciones', { p_empresa_id: 'a', p_empleado_id: 'e1', p_saldo_id: 's1', p_anio: 2026, p_dias: 15, p_motivo: 'Demo', p_operacion: 'op' });
  });
  it('rechaza créditos de otras empresas o importes inválidos', async () => {
    expect((await acreditarSaldoRRHH('b', saldo, 1, 'Demo', 'op')).success).toBe(false);
    expect((await acreditarSaldoRRHH('a', saldo, -1, 'Demo', 'op')).success).toBe(false);
    expect(rpc).not.toHaveBeenCalled();
  });
});
