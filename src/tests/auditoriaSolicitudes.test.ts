import { beforeEach, describe, expect, it, vi } from 'vitest';
import { insertSolicitud } from '../services/repository';
import type { Solicitud } from '../types/models';

const db = vi.hoisted(() => ({ from: vi.fn(), rpc: vi.fn(), single: vi.fn() }));
vi.mock('../lib/supabase', () => ({ supabase: { from: db.from, rpc: db.rpc } }));

describe('auditoría de solicitudes', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    db.rpc.mockReturnValue(db);
    db.single.mockResolvedValue({ data: { id: 'sol_1' }, error: null });
  });
  it('deja que la base registre la creación para evitar duplicados', async () => {
    const resultado = await insertSolicitud({ id: 'sol_1', empresa_id: 'emp_a', empleado_id: 'e1', tipo_id: 't1', fecha_desde: '2026-12-01', fecha_hasta: '2026-12-01', motivo: 'Descanso', dias: 1 } as Omit<Solicitud, 'created_at'>);
    expect(resultado.success).toBe(true);
    expect(db.rpc).toHaveBeenCalledWith('crear_solicitud_validada', { p_id: 'sol_1', p_empresa_id: 'emp_a', p_empleado_id: 'e1', p_tipo_id: 't1', p_desde: '2026-12-01', p_hasta: '2026-12-01', p_motivo: 'Descanso' });
    expect(db.from).not.toHaveBeenCalled();
  });
  it('comunica que el saldo cambió sin revelar detalles internos', async () => {
    db.single.mockResolvedValue({ data: null, error: { message: 'SALDO_INSUFICIENTE' } });
    const resultado = await insertSolicitud({} as Omit<Solicitud, 'created_at'>);
    expect(resultado.success).toBe(false);
    expect(resultado.error).toMatch(/saldo disponible/i);
  });
});
