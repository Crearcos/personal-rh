import { beforeEach, describe, expect, it, vi } from 'vitest';
import { guardarCriteriosRRHH } from '../services/criteriosRRHHRepository';
const { rpc } = vi.hoisted(() => ({ rpc: vi.fn() }));
vi.mock('../lib/supabase', () => ({ supabase: { rpc } }));

describe('guardar criterios de evaluación', () => {
  beforeEach(() => vi.resetAllMocks());
  it('rechaza pesos que no suman uno', async () => {
    expect((await guardarCriteriosRRHH('a', [{ nombre: 'Objetivos', peso: 0.4 }])).success).toBe(false);
    expect(rpc).not.toHaveBeenCalled();
  });
  it('guarda en la empresa indicada mediante una sola operación', async () => {
    rpc.mockResolvedValue({ data: [{ id: 'nuevo' }], error: null });
    const datos = [{ nombre: 'Objetivos', peso: 0.6 }, { nombre: 'Equipo', peso: 0.4 }];
    expect((await guardarCriteriosRRHH('a', datos)).success).toBe(true);
    expect(rpc).toHaveBeenCalledWith('configurar_criterios_rrhh', { p_empresa_id: 'a', p_criterios: datos });
  });
});
