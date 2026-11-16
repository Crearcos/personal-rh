export type Dependencias = {
  reservar: (empresa: string, empleado: string, correo: string) => Promise<{ estado: 'reservada'; cuenta: string } | { estado: 'denegada' } | { estado: 'sin_confirmar' }>;
  actualizar: (cuenta: string, password: string) => Promise<'actualizada' | 'rechazada' | 'sin_confirmar'>;
  finalizar: (exitosa: boolean) => Promise<boolean>;
};
type Entrada = { empresa: string; empleado: string; correo: string; password: string };
type Resultado = 'actualizada' | 'rechazada' | 'no_permitida' | 'sin_confirmar' | 'datos_invalidos';
function valida(valor: unknown): valor is Entrada {
  if (!valor || typeof valor !== 'object') return false;
  const e = valor as Partial<Entrada>;
  return typeof e.empresa === 'string' && e.empresa.length > 0 && e.empresa.length <= 128
    && typeof e.empleado === 'string' && e.empleado.length > 0 && e.empleado.length <= 128
    && typeof e.correo === 'string' && e.correo.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.correo)
    && typeof e.password === 'string' && e.password.length >= 10 && e.password.length <= 72;
}
export async function restablecerClave(entrada: unknown, d: Dependencias): Promise<Resultado> {
  if (!valida(entrada)) return 'datos_invalidos';
  let reserva: Awaited<ReturnType<Dependencias['reservar']>>;
  try { reserva = await d.reservar(entrada.empresa, entrada.empleado, entrada.correo.trim().toLowerCase()); }
  catch { return 'sin_confirmar'; }
  if (reserva.estado === 'denegada') return 'no_permitida';
  if (reserva.estado === 'sin_confirmar') return 'sin_confirmar';
  try {
    const resultado = await d.actualizar(reserva.cuenta, entrada.password);
    if (resultado === 'sin_confirmar') return 'sin_confirmar';
    return await d.finalizar(resultado === 'actualizada') ? resultado : 'sin_confirmar';
  } catch { return 'sin_confirmar'; }
}
