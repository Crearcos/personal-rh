import { beforeEach, describe, expect, it, vi } from 'vitest';
import { cambiarCorreoColaboradorRRHH, consultarCorreoColaboradorRRHH, reactivarColaboradorRRHH } from '../services/correoYReactivacionRepository';

const db = vi.hoisted(() => ({ from: vi.fn(), select: vi.fn(), eq: vi.fn(), rpc: vi.fn(), single: vi.fn() }));
vi.mock('../lib/supabase', () => ({ supabase: { from: db.from, rpc: db.rpc } }));

describe('correo y reactivación de colaborador', () => {
  beforeEach(() => { vi.resetAllMocks(); db.from.mockReturnValue(db); db.select.mockReturnValue(db); db.eq.mockReturnValue(db); db.rpc.mockReturnValue(db); });
  it('consulta el correo solamente para el usuario de la empresa', async () => {
    db.single.mockResolvedValue({ data: { correo: 'ana@demo.com' }, error: null });
    expect(await consultarCorreoColaboradorRRHH('a', 'u1')).toBe('ana@demo.com');
    expect(db.eq).toHaveBeenCalledWith('empresa_id', 'a');
    expect(db.eq).toHaveBeenCalledWith('id', 'u1');
  });
  it('envía el correo normalizado y limita la operación a la empresa', async () => {
    db.single.mockResolvedValue({ data: { id: 'e1' }, error: null });
    expect((await cambiarCorreoColaboradorRRHH('a', 'e1', ' ANA@demo.com ')).success).toBe(true);
    expect(db.rpc).toHaveBeenCalledWith('cambiar_correo_colaborador_rrhh', { p_empresa_id: 'a', p_empleado_id: 'e1', p_correo: 'ana@demo.com' });
  });
  it('reactiva mediante la operación de empresa y colaborador', async () => {
    db.single.mockResolvedValue({ data: { id: 'e1', activo: true }, error: null });
    expect((await reactivarColaboradorRRHH('a', 'e1')).success).toBe(true);
    expect(db.rpc).toHaveBeenCalledWith('reactivar_colaborador_rrhh', { p_empresa_id: 'a', p_empleado_id: 'e1' });
  });
});
