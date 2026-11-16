import { describe, expect, it, vi } from 'vitest';
import { restablecerClave, type Dependencias } from '../../supabase/functions/restablecer-clave/logic';
const entrada = { empresa: 'empresa', empleado: 'empleado', correo: 'empleado@demo.test', password: 'ClaveNueva123!' };
function deps(): Dependencias { return { reservar: vi.fn().mockResolvedValue({ estado: 'reservada', cuenta: 'cuenta' }), actualizar: vi.fn().mockResolvedValue('actualizada'), finalizar: vi.fn().mockResolvedValue(true) }; }
describe('restablecimiento administrativo', () => {
  it('reserva antes de cambiar la contraseña y finaliza después', async () => {
    const d = deps(); expect(await restablecerClave(entrada, d)).toBe('actualizada');
    expect(d.reservar).toHaveBeenCalledWith('empresa', 'empleado', 'empleado@demo.test');
    expect(d.actualizar).toHaveBeenCalledWith('cuenta', 'ClaveNueva123!');
    expect(d.finalizar).toHaveBeenCalledWith(true);
  });
  it('rechaza sin actualizar si no hay reserva', async () => {
    const d = deps(); vi.mocked(d.reservar).mockResolvedValue({ estado: 'denegada' });
    expect(await restablecerClave(entrada, d)).toBe('no_permitida'); expect(d.actualizar).not.toHaveBeenCalled();
  });
  it('avisa si no se puede confirmar si se creó la reserva', async () => {
    const d = deps(); vi.mocked(d.reservar).mockRejectedValue(new Error('red'));
    expect(await restablecerClave(entrada, d)).toBe('sin_confirmar');
    expect(d.actualizar).not.toHaveBeenCalled();
  });
  it('conserva la reserva si no se puede confirmar la actualización', async () => {
    const d = deps(); vi.mocked(d.actualizar).mockRejectedValue(new Error('red'));
    expect(await restablecerClave(entrada, d)).toBe('sin_confirmar'); expect(d.finalizar).not.toHaveBeenCalled();
  });
  it('libera la reserva cuando Auth rechaza el cambio de forma concluyente', async () => {
    const d = deps(); vi.mocked(d.actualizar).mockResolvedValue('rechazada');
    expect(await restablecerClave(entrada, d)).toBe('rechazada');
    expect(d.finalizar).toHaveBeenCalledWith(false);
  });
  it('rechaza una contraseña débil sin usar servicios', async () => {
    const d = deps(); expect(await restablecerClave({ ...entrada, password: '123' }, d)).toBe('datos_invalidos');
    expect(d.reservar).not.toHaveBeenCalled();
  });
});
