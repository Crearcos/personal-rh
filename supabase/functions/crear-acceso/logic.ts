export type Entrada = { empresa: string; empleado: string; correo: string; password: string; rol: 'empleado' | 'jefe' | 'admin' };
export type Dependencias = {
  verificarAdministrador: (empresa: string) => Promise<boolean>;
  consultarFicha: (empresa: string, empleado: string) => Promise<{ correo: string; rol: string; activo: boolean } | null>;
  crearUsuario: (correo: string, password: string) => Promise<boolean>;
  vincular: (empresa: string, empleado: string, correo: string, rol: Entrada['rol']) => Promise<boolean>;
};
export type Resultado = 'creada' | 'prohibida' | 'ficha_invalida' | 'no_creada' | 'sin_vincular' | 'datos_invalidos';

function validaEntrada(valor: unknown): valor is Entrada {
  if (!valor || typeof valor !== 'object') return false;
  const v = valor as Partial<Entrada>;
  return typeof v.empresa === 'string' && v.empresa.length > 0 && v.empresa.length <= 128
    && typeof v.empleado === 'string' && v.empleado.length > 0 && v.empleado.length <= 128
    && typeof v.correo === 'string' && v.correo.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.correo)
    && typeof v.password === 'string' && v.password.length >= 10 && v.password.length <= 72
    && typeof v.rol === 'string' && ['empleado', 'jefe', 'admin'].includes(v.rol);
}

export async function crearAcceso(entrada: unknown, d: Dependencias): Promise<Resultado> {
  if (!validaEntrada(entrada)) return 'datos_invalidos';
  const correo = entrada.correo.trim().toLowerCase();
  if (!await d.verificarAdministrador(entrada.empresa)) return 'prohibida';
  const ficha = await d.consultarFicha(entrada.empresa, entrada.empleado);
  if (!ficha || !ficha.activo || ficha.rol !== entrada.rol || ficha.correo.trim().toLowerCase() !== correo) return 'ficha_invalida';
  try { if (!await d.crearUsuario(correo, entrada.password)) return 'no_creada'; }
  catch { return 'no_creada'; }
  try { if (!await d.vincular(entrada.empresa, entrada.empleado, correo, entrada.rol)) return 'sin_vincular'; }
  catch { return 'sin_vincular'; }
  return 'creada';
}
