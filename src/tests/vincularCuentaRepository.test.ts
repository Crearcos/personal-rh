import { beforeEach, describe, expect, it, vi } from 'vitest';
import { vincularCuentaRRHH } from '../services/vincularCuentaRRHH';
const { rpc } = vi.hoisted(() => ({ rpc: vi.fn() }));
vi.mock('../lib/supabase', () => ({ supabase: { rpc } }));

describe('vinculación de cuentas', () => {
  beforeEach(() => vi.resetAllMocks());
  it('envía empresa, colaborador y correo confirmado por RR. HH.', async () => {
    rpc.mockResolvedValue({ data: 'vinculada', error: null });
    expect(await vincularCuentaRRHH('empresa', 'empleado', 'ana@demo.test', 'jefe')).toBe('vinculada');
    expect(rpc).toHaveBeenCalledWith('vincular_cuenta_con_rol', { p_empresa: 'empresa', p_empleado: 'empleado', p_correo_esperado: 'ana@demo.test', p_rol_esperado: 'jefe' });
  });
  it('no expone errores internos ni acepta respuestas inesperadas', async () => {
    rpc.mockResolvedValue({ data: null, error: { message: 'detalle interno' } });
    expect(await vincularCuentaRRHH('empresa', 'empleado', 'ana@demo.test', 'empleado')).toBeNull();
    rpc.mockResolvedValue({ data: 'otro', error: null });
    expect(await vincularCuentaRRHH('empresa', 'empleado', 'ana@demo.test', 'empleado')).toBeNull();
  });
});
