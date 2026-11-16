import { beforeEach, describe, expect, it, vi } from 'vitest';
import { iniciarSesion, cerrarSesion } from '../services/accesoCuenta';

const { signIn, signOut } = vi.hoisted(() => ({ signIn: vi.fn(), signOut: vi.fn() }));
vi.mock('../lib/supabase', () => ({ supabase: { auth: { signInWithPassword: signIn, signOut } } }));

describe('acceso de cuenta', () => {
  beforeEach(() => { vi.resetAllMocks(); });
  it('inicia sesión con las credenciales ingresadas', async () => {
    signIn.mockResolvedValue({ data: { session: { access_token: 'token' } }, error: null });
    expect(await iniciarSesion(' admin@example.com ', 'contraseña')).toBe(true);
    expect(signIn).toHaveBeenCalledWith({ email: 'admin@example.com', password: 'contraseña' });
  });
  it('rechaza un error de autenticación o una sesión ausente', async () => {
    signIn.mockResolvedValue({ data: { session: null }, error: { message: 'detalle interno' } });
    expect(await iniciarSesion('admin@example.com', 'incorrecta')).toBe(false);
  });
  it('devuelve un error seguro si el servidor no responde', async () => {
    signIn.mockRejectedValue(new Error('detalle interno'));
    expect(await iniciarSesion('admin@example.com', 'clave')).toBe(false);
  });
  it('cierra la sesión', async () => {
    signOut.mockResolvedValue({ error: null });
    expect(await cerrarSesion()).toBe(true);
    expect(signOut).toHaveBeenCalled();
  });
});
