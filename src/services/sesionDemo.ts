import type { DemoUserSession, Empleado, Usuario, UserRole } from '../types/models';

function candidatos(empresa: string, rol: UserRole, usuarios: readonly Usuario[], empleados: readonly Empleado[]) {
  return empleados.flatMap((empleado) => {
    if (!empleado.activo || empleado.empresa_id !== empresa) return [];
    const usuario = usuarios.find((item) => item.id === empleado.usuario_id && item.empresa_id === empresa && item.activo && item.rol === rol);
    return usuario ? [{ empleado, usuario }] : [];
  });
}

export function resolverSesionDemo(empresa: string, rol: UserRole, usuarios: readonly Usuario[], empleados: readonly Empleado[]): DemoUserSession | null {
  const opciones = candidatos(empresa, rol, usuarios, empleados);
  const jefes = candidatos(empresa, 'jefe', usuarios, empleados);
  const jefeDemo = jefes.find(({ empleado }) => empleado.id === 'emp_jefe_ventas') ?? jefes[0];
  const preferido = rol === 'jefe' ? jefeDemo : rol === 'empleado'
    ? opciones.find(({ empleado }) => empleado.id === 'emp_juan' && empleado.jefe_id === jefeDemo?.empleado.id)
      ?? opciones.find(({ empleado }) => empleado.jefe_id && empleado.jefe_id === jefeDemo?.empleado.id)
    : opciones.find(({ empleado }) => empleado.id === 'emp_admin');
  const elegido = preferido ?? opciones[0];
  if (!elegido) return null;
  const { empleado, usuario } = elegido;
  return { usuarioId: usuario.id, empleadoId: empleado.id, nombre: empleado.nombre, correo: usuario.correo,
    cargo: empleado.cargo, rol, empresaId: empresa, departamentoId: empleado.departamento_id };
}

export function resolverSesionIndividual(empresa: string, rol: UserRole, empleadoId: string, usuarios: readonly Usuario[], empleados: readonly Empleado[]): DemoUserSession | null {
  const elegido = candidatos(empresa, rol, usuarios, empleados).find(({ empleado }) => empleado.id === empleadoId);
  if (!elegido) return null;
  const { empleado, usuario } = elegido;
  return { usuarioId: usuario.id, empleadoId: empleado.id, nombre: empleado.nombre, correo: usuario.correo,
    cargo: empleado.cargo, rol, empresaId: empresa, departamentoId: empleado.departamento_id };
}
