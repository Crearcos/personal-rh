import { beforeEach, describe, expect, it, vi } from 'vitest';
import { cambiarEstadoTipoSolicitud, guardarTipoSolicitud } from '../services/tiposSolicitudRepository';

const { rpc, single } = vi.hoisted(() => ({ rpc: vi.fn(), single: vi.fn() }));
vi.mock('../lib/supabase', () => ({ supabase: { rpc } }));

describe('configuración de tipos', () => {
  beforeEach(() => { vi.resetAllMocks(); rpc.mockReturnValue({ single }); });
  it('valida los datos antes de guardar', async () => {
    expect((await guardarTipoSolicitud('emp_a', { nombre: ' ', descuentaSaldo: false })).success).toBe(false);
    expect(rpc).not.toHaveBeenCalled();
  });
  it('envía los datos normalizados y la empresa', async () => {
    single.mockResolvedValue({ data: { id: 't1' }, error: null });
    expect((await guardarTipoSolicitud('emp_a', { nombre: ' Permiso ', descuentaSaldo: false })).success).toBe(true);
    expect(rpc).toHaveBeenCalledWith('guardar_tipo_solicitud_rrhh', { p_empresa_id: 'emp_a', p_id: '', p_nombre: 'Permiso', p_descuenta_saldo: false, p_activo: true });
  });
  it('cambia el estado sin alterar el nombre o la regla de saldo', async () => {
    single.mockResolvedValue({ data: { id: 't1', activo: false }, error: null });
    expect((await cambiarEstadoTipoSolicitud('emp_a', 't1', false)).success).toBe(true);
    expect(rpc).toHaveBeenCalledWith('estado_tipo_solicitud_rrhh', { p_empresa_id: 'emp_a', p_id: 't1', p_activo: false });
  });
});
