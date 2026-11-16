import { describe, expect, it, vi } from 'vitest';
import { crearAcceso, type Dependencias } from '../../supabase/functions/crear-acceso/logic';

function deps(): Dependencias {
  return { verificarAdministrador: vi.fn().mockResolvedValue(true), consultarFicha: vi.fn().mockResolvedValue({ correo: 'juan@demo.test', rol: 'empleado', activo: true }),
    crearUsuario: vi.fn().mockResolvedValue(true), vincular: vi.fn().mockResolvedValue(true) };
}
const entrada = { empresa: 'a', empleado: 'e', correo: 'juan@demo.test', password: 'Prueba123456!', rol: 'empleado' };

describe('creación segura de acceso', () => {
  it('verifica autorización y ficha antes de crear y vincular', async () => {
    const d = deps();
    expect(await crearAcceso(entrada, d)).toBe('creada');
    expect(d.verificarAdministrador).toHaveBeenCalledWith('a');
    expect(d.crearUsuario).toHaveBeenCalledWith('juan@demo.test', entrada.password);
    expect(d.vincular).toHaveBeenCalledWith('a', 'e', 'juan@demo.test', 'empleado');
  });
  it('no crea cuentas si no es administrador o el correo cambió', async () => {
    const d = deps(); vi.mocked(d.verificarAdministrador).mockResolvedValue(false);
    expect(await crearAcceso(entrada, d)).toBe('prohibida');
    expect(d.crearUsuario).not.toHaveBeenCalled();
    vi.mocked(d.verificarAdministrador).mockResolvedValue(true);
    vi.mocked(d.consultarFicha).mockResolvedValue({ correo: 'otro@demo.test', rol: 'empleado', activo: true });
    expect(await crearAcceso(entrada, d)).toBe('ficha_invalida');
    expect(d.crearUsuario).not.toHaveBeenCalled();
  });
  it('no intenta vincular cuando falla Auth y comunica un vínculo fallido', async () => {
    const d = deps(); vi.mocked(d.crearUsuario).mockResolvedValue(false);
    expect(await crearAcceso(entrada, d)).toBe('no_creada');
    expect(d.vincular).not.toHaveBeenCalled();
    vi.mocked(d.crearUsuario).mockResolvedValue(true); vi.mocked(d.vincular).mockResolvedValue(false);
    expect(await crearAcceso(entrada, d)).toBe('sin_vincular');
  });
  it('rechaza contraseñas cortas antes de ejecutar operaciones', async () => {
    const d = deps(); expect(await crearAcceso({ ...entrada, password: '123' }, d)).toBe('datos_invalidos');
    expect(d.verificarAdministrador).not.toHaveBeenCalled();
  });
  it('permite vincular una ficha administrativa solamente después de verificar al administrador', async () => {
    const d = deps();
    vi.mocked(d.consultarFicha).mockResolvedValue({ correo: entrada.correo, rol: 'admin', activo: true });
    expect(await crearAcceso({ ...entrada, rol: 'admin' }, d)).toBe('creada');
    expect(d.verificarAdministrador).toHaveBeenCalledOnce();
    expect(d.vincular).toHaveBeenCalledOnce();
  });
  it('rechaza la creación si el rol mostrado cambió antes de confirmar', async () => {
    const d = deps();
    vi.mocked(d.consultarFicha).mockResolvedValue({ correo: entrada.correo, rol: 'admin', activo: true });
    expect(await crearAcceso(entrada, d)).toBe('ficha_invalida');
    expect(d.crearUsuario).not.toHaveBeenCalled();
  });
});
