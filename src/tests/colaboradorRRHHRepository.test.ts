import { beforeEach, describe, expect, it, vi } from 'vitest';
import { crearColaboradorRRHH, editarColaboradorRRHH, desactivarColaboradorRRHH } from '../services/colaboradorRRHHRepository';

const { rpc, single } = vi.hoisted(() => ({ rpc: vi.fn(), single: vi.fn() }));
vi.mock('../lib/supabase', () => ({ supabase: { rpc } }));
const datos = { nombre: 'Ana Demo', correo: 'ana@demo.com', cargo: 'Analista', departamentoId: 'd1', jefeId: 'e1', fechaIngreso: '2026-01-01' };

describe('repositorio de colaboradores', () => {
  beforeEach(() => { vi.resetAllMocks(); rpc.mockReturnValue({ single }); });
  it('valida los datos antes de llamar a Supabase', async () => {
    expect((await crearColaboradorRRHH('emp_a', { ...datos, correo: 'invalido' })).success).toBe(false);
    expect(rpc).not.toHaveBeenCalled();
  });
  it('envía todos los datos y la empresa a la operación atómica', async () => {
    single.mockResolvedValue({ data: { id: 'e2' }, error: null });
    expect((await crearColaboradorRRHH('emp_a', datos)).success).toBe(true);
    expect(rpc).toHaveBeenCalledWith('crear_colaborador_con_rol', { p_empresa_id: 'emp_a', p_nombre: 'Ana Demo', p_correo: 'ana@demo.com', p_cargo: 'Analista', p_departamento_id: 'd1', p_jefe_id: 'e1', p_fecha_ingreso: '2026-01-01', p_rol: 'empleado' });
  });
  it('no expone el error de la base de datos', async () => {
    single.mockResolvedValue({ data: null, error: { message: 'detalle interno' } });
    expect(await crearColaboradorRRHH('emp_a', datos)).toEqual({ success: false, error: 'No se pudo crear el colaborador.' });
  });
  it('edita una ficha identificada por empresa y colaborador', async () => {
    single.mockResolvedValue({ data: { id: 'e2' }, error: null });
    const { correo: _correo, ...edicion } = datos;
    expect((await editarColaboradorRRHH('emp_a', { ...edicion, id: 'e2' })).success).toBe(true);
    expect(rpc).toHaveBeenCalledWith('editar_colaborador_rrhh', expect.objectContaining({ p_empresa_id: 'emp_a', p_empleado_id: 'e2', p_cargo: 'Analista' }));
  });
  it('desactiva solo el colaborador indicado en la empresa', async () => {
    single.mockResolvedValue({ data: { id: 'e2', activo: false }, error: null });
    expect((await desactivarColaboradorRRHH('emp_a', 'e2')).success).toBe(true);
    expect(rpc).toHaveBeenCalledWith('desactivar_colaborador_rrhh', { p_empresa_id: 'emp_a', p_empleado_id: 'e2' });
  });
});
