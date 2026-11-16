import { beforeEach, describe, expect, it, vi } from 'vitest';
import { toggleOnboardingEstado } from '../services/repository';

const db = vi.hoisted(() => ({ rpc: vi.fn(), single: vi.fn() }));
vi.mock('../lib/supabase', () => ({ supabase: { rpc: db.rpc } }));

describe('cambio de estado de incorporación', () => {
  beforeEach(() => { vi.resetAllMocks(); db.rpc.mockReturnValue({ single: db.single }); });
  it('actualiza el estado mediante la operación autorizada', async () => {
    db.single.mockResolvedValue({ data: { id: 't1', estado: 'completada' }, error: null });
    expect((await toggleOnboardingEstado('t1', 'empresa', 'completada')).success).toBe(true);
    expect(db.rpc).toHaveBeenCalledWith('cambiar_estado_onboarding', { p_empresa: 'empresa', p_tarea: 't1', p_estado: 'completada' });
  });
  it('no expone errores internos de la base', async () => {
    db.single.mockResolvedValue({ data: null, error: { message: 'detalle interno' } });
    const resultado = await toggleOnboardingEstado('t1', 'empresa', 'pendiente');
    expect(resultado.success).toBe(false);
    expect(resultado.error).not.toContain('detalle interno');
  });
});
