import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { PanelGeneralRRHH } from '../components/PanelGeneralRRHH';
import type { Departamento, Empleado, Evaluacion, Solicitud, TipoSolicitud } from '../types/models';

const empleados = [{ id: 'e1', nombre: 'Ana Torres', departamento_id: 'd1' }] as Empleado[];
const departamentos = [{ id: 'd1', nombre: 'Ventas' }] as Departamento[];
const tipos = [{ id: 't1', nombre: 'Vacaciones' }] as TipoSolicitud[];
const solicitud = (id: string, estado: string, desde: string, hasta: string) => ({
  id, empleado_id: 'e1', tipo_id: 't1', estado, fecha_desde: desde, fecha_hasta: hasta, motivo: 'Viaje', dias: 3,
}) as Solicitud;

describe('Panel general de RRHH', () => {
  afterEach(() => vi.useRealTimers());
  it('muestra pendientes, ausencias aprobadas que se solapan con la semana y evaluaciones en curso', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 10, 11, 12));
    const solicitudes = [solicitud('p1', 'pendiente', '2026-12-01', '2026-12-03'),
      solicitud('a1', 'aprobada', '2026-11-08', '2026-11-10'),
      solicitud('a2', 'aprobada', '2026-11-16', '2026-11-17'),
      solicitud('r1', 'rechazada', '2026-11-11', '2026-11-12')];
    const evaluaciones = [{ id: 'v1', empleado_id: 'e1', periodo: '2026-Q4', estado: 'en_curso' },
      { id: 'v2', empleado_id: 'e1', periodo: '2026-Q3', estado: 'cerrada' }] as Evaluacion[];
    render(<PanelGeneralRRHH solicitudes={solicitudes} evaluaciones={evaluaciones} empleados={empleados} departamentos={departamentos} tiposSolicitud={tipos} />);
    const pendientes = screen.getByRole('region', { name: 'Solicitudes pendientes' });
    const ausencias = screen.getByRole('region', { name: 'Ausencias de la semana' });
    const curso = screen.getByRole('region', { name: 'Evaluaciones en curso' });
    expect(within(pendientes).getByText('Ana Torres')).toBeInTheDocument();
    expect(within(ausencias).getByText('08/11/2026 – 10/11/2026')).toBeInTheDocument();
    expect(within(ausencias).queryByText('16/11/2026 – 17/11/2026')).not.toBeInTheDocument();
    expect(within(curso).getByText('2026-Q4')).toBeInTheDocument();
    expect(within(curso).queryByText('2026-Q3')).not.toBeInTheDocument();
  });
  it('presenta estados vacíos sin inventar datos', () => {
    render(<PanelGeneralRRHH solicitudes={[]} evaluaciones={[]} empleados={[]} departamentos={[]} tiposSolicitud={[]} />);
    expect(screen.getByText('No hay solicitudes pendientes.')).toBeInTheDocument();
    expect(screen.getByText('No hay ausencias aprobadas esta semana.')).toBeInTheDocument();
    expect(screen.getByText('No hay evaluaciones en curso.')).toBeInTheDocument();
  });
  it('muestra un error de carga sin presentar datos vacíos como resultados', () => {
    render(<PanelGeneralRRHH solicitudes={[]} evaluaciones={[]} empleados={[]} departamentos={[]} tiposSolicitud={[]} errorCarga onReintentar={vi.fn()} />);
    expect(screen.getByRole('alert')).toHaveTextContent('No pudimos cargar el panel');
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeInTheDocument();
    expect(screen.queryByText('No hay solicitudes pendientes.')).not.toBeInTheDocument();
  });
});
