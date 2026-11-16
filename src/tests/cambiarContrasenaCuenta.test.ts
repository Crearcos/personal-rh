import { beforeEach, describe, expect, it, vi } from 'vitest';
import { cambiarContrasenaCuenta } from '../services/cambiarContrasenaCuenta';
const mocks = vi.hoisted(() => ({ getUser: vi.fn(), signIn: vi.fn(), update: vi.fn(), signOut: vi.fn() }));
vi.mock('../lib/supabase', () => ({
  supabase: { auth: { getUser: mocks.getUser } },
  crearClienteTemporal: () => ({ auth: { signInWithPassword: mocks.signIn, updateUser: mocks.update, signOut: mocks.signOut } }),
}));
describe('cambio de contraseña de la cuenta', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.getUser.mockResolvedValue({ data: { user: { id: 'u1', email: 'usuario@demo.test' } }, error: null });
    mocks.signIn.mockResolvedValue({ data: { user: { id: 'u1' }, session: {} }, error: null });
    mocks.update.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null });
    mocks.signOut.mockResolvedValue({ error: null });
  });
  it('verifica la contraseña actual y modifica solo la cuenta autenticada', async () => {
    expect(await cambiarContrasenaCuenta('Actual12345!', 'Nueva12345!')).toBe('actualizada');
    expect(mocks.signIn).toHaveBeenCalledWith({ email: 'usuario@demo.test', password: 'Actual12345!' });
    expect(mocks.update).toHaveBeenCalledWith({ current_password: 'Actual12345!', password: 'Nueva12345!' });
    expect(mocks.signOut).toHaveBeenCalledWith({ scope: 'local' });
  });
  it('no cambia la contraseña si la verificación falla o devuelve otra identidad', async () => {
    mocks.signIn.mockResolvedValueOnce({ data: { user: null, session: null }, error: { message: 'error interno' } });
    expect(await cambiarContrasenaCuenta('mala', 'Nueva12345!')).toBe('credenciales_invalidas');
    mocks.signIn.mockResolvedValueOnce({ data: { user: { id: 'u2' }, session: {} }, error: null });
    expect(await cambiarContrasenaCuenta('actual', 'Nueva12345!')).toBe('credenciales_invalidas');
    expect(mocks.update).not.toHaveBeenCalled();
  });
  it('rechaza contraseñas nuevas cortas sin consultar el servidor', async () => {
    expect(await cambiarContrasenaCuenta('actual', 'corta')).toBe('datos_invalidos');
    expect(mocks.getUser).not.toHaveBeenCalled();
  });
  it('no revela errores internos', async () => {
    mocks.update.mockRejectedValue(new Error('interno'));
    expect(await cambiarContrasenaCuenta('actual', 'Nueva12345!')).toBe('error');
  });
});
