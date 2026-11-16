import { describe, expect, it } from 'vitest';
import { prepararReporteAusencias, prepararReporteEvaluaciones } from '../services/reportesRRHH';
import type { Departamento, Empleado, Evaluacion, Solicitud, TipoSolicitud } from '../types/models';

const empleados = [{ id: 'e1', nombre: 'Ana Torres', departamento_id: 'd1' }] as Empleado[];
const departamentos = [{ id: 'd1', nombre: 'Ventas' }] as Departamento[];
const tipos = [{ id: 't1', nombre: 'Vacaciones' }] as TipoSolicitud[];
const solicitudes = [
  { id: 's1', empleado_id: 'e1', tipo_id: 't1', estado: 'aprobada', fecha_desde: '2026-02-28', fecha_hasta: '2026-03-03', dias: 4, motivo: 'Descanso' },
  { id: 's2', empleado_id: 'e1', tipo_id: 't1', estado: 'pendiente', fecha_desde: '2026-03-10', fecha_hasta: '2026-03-11', dias: 2 },
  { id: 's3', empleado_id: 'e1', tipo_id: 't1', estado: 'aprobada', fecha_desde: '2026-04-01', fecha_hasta: '2026-04-02', dias: 2 },
] as Solicitud[];

describe('reportes de RRHH', () => {
  it('incluye ausencias aprobadas que se solapan con el período', () => {
    const resultado = prepararReporteAusencias(solicitudes, empleados, departamentos, tipos, '2026-03-01', '2026-03-31');
    expect(resultado).toHaveLength(1);
    expect(resultado[0]).toMatchObject({ nombre: 'Ana Torres', departamento: 'Ventas', tipo: 'Vacaciones', desde: '2026-02-28', hasta: '2026-03-03', dias: 4, motivo: 'Descanso' });
  });
  it('no inventa nombres cuando falta información relacionada', () => {
    const resultado = prepararReporteAusencias(solicitudes, [], [], [], '2026-03-01', '2026-03-31');
    expect(resultado[0]).toMatchObject({ nombre: 'Colaborador no disponible', departamento: 'No disponible', tipo: 'No disponible' });
  });
  it('incluye solo evaluaciones cerradas del ciclo seleccionado', () => {
    const evaluaciones = [
      { id: 'v1', empleado_id: 'e1', periodo: '2026-Q1', estado: 'cerrada', puntaje_total: 86.4, comentarios: 'Buen trabajo' },
      { id: 'v2', empleado_id: 'e1', periodo: '2026-Q1', estado: 'en_curso', puntaje_total: 0 },
      { id: 'v3', empleado_id: 'e1', periodo: '2026-Q2', estado: 'cerrada', puntaje_total: 90 },
    ] as Evaluacion[];
    const resultado = prepararReporteEvaluaciones(evaluaciones, empleados, departamentos, '2026-Q1');
    expect(resultado).toHaveLength(1);
    expect(resultado[0]).toMatchObject({ nombre: 'Ana Torres', departamento: 'Ventas', periodo: '2026-Q1', puntaje: 86.4, comentario: 'Buen trabajo' });
  });
});
