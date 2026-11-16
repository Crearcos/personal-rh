import { beforeEach, describe, expect, it, vi } from 'vitest';
import { consultarRestablecimiento, ejecutarRestablecimiento } from '../services/restablecerDemoRepository';

const { rpc } = vi.hoisted(() => ({ rpc: vi.fn() }));
vi.mock('../lib/supabase', () => ({ supabase: { rpc } }));

describe('repositorio de restablecimiento seguro', () => {
  beforeEach(() => rpc.mockReset());
  it('valida la vista previa y exige que corresponda a la empresa seleccionada', async () => {
    rpc.mockResolvedValueOnce({ data: { empresa_id: 'otra', huella: 'a'.repeat(32), version: 1, totales: {}, bloqueos: [] }, error: null });
    expect((await consultarRestablecimiento('empresa')).success).toBe(false);
    rpc.mockResolvedValueOnce({ data: { empresa_id: 'empresa', huella: 'a'.repeat(32), version: 1, totales: { solicitudes: 4 }, bloqueos: [] }, error: null });
    const resultado = await consultarRestablecimiento('empresa');
    expect(resultado.success).toBe(true);
    expect(rpc).toHaveBeenLastCalledWith('vista_previa_restablecer_demo', { p_empresa_id: 'empresa' });
  });
  it('conserva el mismo identificador de operación para resolver un resultado incierto', async () => {
    rpc.mockResolvedValueOnce({ data: null, error: { message: 'network' } });
    rpc.mockResolvedValueOnce({ data: { estado: 'completado', repetida: true }, error: null });
    const datos = { empresa: 'empresa', huella: 'b'.repeat(32), operacion: '00000000-0000-4000-8000-000000000001' };
    expect(await ejecutarRestablecimiento(datos)).toBe('sin_confirmar');
    expect(await ejecutarRestablecimiento(datos)).toBe('completado');
    expect(rpc).toHaveBeenNthCalledWith(1, 'restablecer_demo_seguro', { p_empresa_id: datos.empresa, p_huella: datos.huella, p_confirmacion: 'RESTABLECER', p_operacion: datos.operacion });
    expect(rpc).toHaveBeenNthCalledWith(2, 'restablecer_demo_seguro', { p_empresa_id: datos.empresa, p_huella: datos.huella, p_confirmacion: 'RESTABLECER', p_operacion: datos.operacion });
  });
  it('distingue rechazos confirmados de un fallo de conexión', async () => {
    rpc.mockResolvedValue({ data: null, error: { code: 'P0001', message: 'datos cambiaron' } });
    expect(await ejecutarRestablecimiento({ empresa: 'empresa', huella: 'a'.repeat(32), operacion: '1' })).toBe('rechazado');
  });
});
