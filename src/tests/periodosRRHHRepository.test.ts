import { beforeEach, describe, expect, it, vi } from 'vitest';
import { crearPeriodoRRHH, cambiarEstadoPeriodoRRHH, fetchPeriodosRRHH } from '../services/periodosRRHHRepository';
const db = vi.hoisted(() => ({ rpc: vi.fn(), from: vi.fn(), select: vi.fn(), eq: vi.fn(), order: vi.fn(), single: vi.fn() }));
vi.mock('../lib/supabase', () => ({ supabase: { rpc: db.rpc, from: db.from } }));

describe('repositorio de períodos', () => {
  beforeEach(() => { vi.resetAllMocks(); db.rpc.mockReturnValue(db); db.from.mockReturnValue(db); db.select.mockReturnValue(db); db.eq.mockReturnValue(db); });
  it('limita la consulta a la empresa', async () => {
    db.order.mockResolvedValue({ data: [], error: null });
    expect((await fetchPeriodosRRHH('a')).success).toBe(true);
    expect(db.eq).toHaveBeenCalledWith('empresa_id', 'a');
  });
  it('rechaza fechas invertidas antes de guardar', async () => {
    expect((await crearPeriodoRRHH('a', { nombre: 'Ciclo', fechaInicio: '2026-12-31', fechaFin: '2026-01-01' })).success).toBe(false);
    expect(db.rpc).not.toHaveBeenCalled();
  });
  it('envía el estado y los identificadores al servidor', async () => {
    db.single.mockResolvedValue({ data: { id: 'p1', estado: 'cerrado' }, error: null });
    expect((await cambiarEstadoPeriodoRRHH('a', 'p1', 'cerrado')).success).toBe(true);
    expect(db.rpc).toHaveBeenCalledWith('estado_periodo_evaluacion_rrhh', { p_empresa_id: 'a', p_id: 'p1', p_estado: 'cerrado' });
  });
});
