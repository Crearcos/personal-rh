export interface DatosTarea {
  id?: string;
  empleadoId: string;
  tarea: string;
  responsable: string;
  fechaLimite: string;
}

export function validarDatosTarea(datos: DatosTarea): DatosTarea | null {
  const tarea = datos.tarea.trim();
  const responsable = datos.responsable.trim();
  const fecha = new Date(`${datos.fechaLimite}T00:00:00Z`);
  if (!datos.empleadoId.trim() || !tarea || tarea.length > 200 || !responsable || responsable.length > 150) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(datos.fechaLimite) || Number.isNaN(fecha.valueOf()) || fecha.toISOString().slice(0, 10) !== datos.fechaLimite) return null;
  return { ...datos, empleadoId: datos.empleadoId.trim(), tarea, responsable };
}
