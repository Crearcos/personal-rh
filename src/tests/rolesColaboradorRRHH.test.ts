import { beforeEach, describe, expect, it, vi } from 'vitest';
import { cambiarRolColaborador } from '../services/rolesColaboradorRRHH';
const { rpc } = vi.hoisted(() => ({ rpc: vi.fn() }));
vi.mock('../lib/supabase', () => ({ supabase: { rpc } }));

describe('cambio de rol', () => {
  beforeEach(() => rpc.mockReset());
  it('usa la empresa y la persona seleccionadas', async () => {
    rpc.mockResolvedValue({ data: 'jefe', error: null });
    expect(await cambiarRolColaborador('empresa', 'persona', 'jefe')).toBe(true);
    expect(rpc).toHaveBeenCalledWith('cambiar_rol_colaborador', { p_empresa: 'empresa', p_empleado: 'persona', p_rol: 'jefe' });
  });
  it('no informa éxito si la operación falla', async () => {
    rpc.mockResolvedValue({ data: null, error: { message: 'detalle privado' } });
    expect(await cambiarRolColaborador('empresa', 'persona', 'admin')).toBe(false);
  });
});
