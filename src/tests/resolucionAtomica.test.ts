import { beforeEach, describe, expect, it, vi } from 'vitest';
import { resolveSolicitud } from '../services/repository';

const { rpc, single } = vi.hoisted(() => ({ rpc: vi.fn(), single: vi.fn() }));
vi.mock('../lib/supabase', () => ({ supabase: { rpc } }));

describe('resolución de solicitudes', () => {
  beforeEach(() => { vi.resetAllMocks(); rpc.mockReturnValue({ single }); });
  it('resuelve y actualiza el saldo en una sola operación', async () => {
    single.mockResolvedValue({ data: { id: 'sol-1' }, error: null });
    const result = await resolveSolicitud('sol-1', 'empresa-1', 'aprobada', 'jefe-1', 'De acuerdo');
    expect(result.success).toBe(true);
    expect(rpc).toHaveBeenCalledWith('resolver_solicitud_atomica', { p_solicitud_id: 'sol-1', p_empresa_id: 'empresa-1', p_estado: 'aprobada', p_aprobador_id: 'jefe-1', p_comentario: 'De acuerdo' });
  });
  it('muestra un error seguro cuando el saldo ya no alcanza', async () => {
    single.mockResolvedValue({ data: null, error: { message: 'SALDO_INSUFICIENTE' } });
    const result = await resolveSolicitud('sol-1', 'empresa-1', 'aprobada', 'jefe-1', '');
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/saldo disponible/i);
  });
});
