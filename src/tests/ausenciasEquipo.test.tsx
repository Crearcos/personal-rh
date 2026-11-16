import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { AusenciasEquipo } from '../components/AusenciasEquipo';
import type { Departamento, Empleado, Solicitud, TipoSolicitud } from '../types/models';

const empleado = { id: 'e1', nombre: 'Ana Torres', cargo: 'Asesora', departamento_id: 'd1' } as Empleado;
const departamento = { id: 'd1', nombre: 'Ventas' } as Departamento;
const tipo = { id: 't1', nombre: 'Vacaciones' } as TipoSolicitud;
const solicitud = (id: string, desde: string, hasta: string): Solicitud => ({
  id, empleado_id: 'e1', tipo_id: 't1', fecha_desde: desde, fecha_hasta: hasta,
  dias: 3, motivo: 'Viaje familiar', estado: 'aprobada', empresa_id: 'empresa',
  comentario: null, aprobador_id: null, fecha_resolucion: null, created_at: '',
});

describe('AusenciasEquipo', () => {
  afterEach(() => vi.useRealTimers());

  it('distingue ausencias actuales, próximas y finalizadas y muestra sus datos', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 10, 11, 12));
    render(<AusenciasEquipo solicitudes={[
      solicitud('pasada', '2026-10-01', '2026-10-03'),
      solicitud('proxima', '2026-12-01', '2026-12-03'),
      solicitud('actual', '2026-11-10', '2026-11-12'),
    ]} empleados={[empleado]} departamentos={[departamento]} tiposSolicitud={[tipo]} />);
    const actual = screen.getByRole('region', { name: /ausentes hoy/i });
    expect(within(actual).getByText('Ana Torres')).toBeInTheDocument();
    expect(within(actual).getByText('Ventas')).toBeInTheDocument();
    expect(within(actual).getByText('Viaje familiar')).toBeInTheDocument();
    expect(within(actual).getByText('10/11/2026')).toBeInTheDocument();
    expect(within(actual).getByText('12/11/2026')).toBeInTheDocument();
    expect(screen.getByRole('region', { name: /próximas ausencias/i })).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: /ausencias finalizadas/i })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /historial/i }));
    expect(screen.getByRole('region', { name: /ausencias finalizadas/i })).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: /ausentes hoy/i })).not.toBeInTheDocument();
    expect(screen.getByText('01/10/2026')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /actuales y próximas/i }));
    expect(screen.getByRole('region', { name: /ausentes hoy/i })).toBeInTheDocument();
  });

  it('indica claramente cuando nadie está ausente hoy', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 10, 11, 12));
    render(<AusenciasEquipo solicitudes={[solicitud('proxima', '2026-12-01', '2026-12-03')]}
      empleados={[empleado]} departamentos={[departamento]} tiposSolicitud={[tipo]} />);
    expect(screen.getByText('Nadie está ausente hoy')).toBeInTheDocument();
    expect(screen.getByRole('region', { name: /próximas ausencias/i })).toBeInTheDocument();
  });

  it('explica cuando no hay ausencias aprobadas', () => {
    render(<AusenciasEquipo solicitudes={[]} empleados={[]} departamentos={[]} tiposSolicitud={[]} />);
    expect(screen.getByText('Aún no hay ausencias aprobadas')).toBeInTheDocument();
  });

  it('usa el selector personalizado sin select nativo, muestra halos decorativos y filtra por departamento', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 10, 11, 12));
    const otro = { ...empleado, id: 'e2', nombre: 'Luis Solís', departamento_id: 'd2' };
    const jefe = { ...empleado, id: 'j1', nombre: 'Carlos Morales' };
    const operaciones = { id: 'd2', nombre: 'Operaciones' } as Departamento;
    const { container } = render(<AusenciasEquipo solicitudes={[
      { ...solicitud('ventas', '2026-11-10', '2026-11-12'), aprobador_id: 'j1' },
      { ...solicitud('operaciones', '2026-11-10', '2026-11-12'), empleado_id: 'e2' },
      { ...solicitud('historia', '2026-10-01', '2026-10-03'), empleado_id: 'e2' },
    ]} empleados={[empleado, otro, jefe]} departamentos={[departamento, operaciones]} tiposSolicitud={[tipo]} />);
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
    const halos = Array.from(container.querySelectorAll('.blur-2xl, .blur-3xl'));
    expect(halos.length).toBeGreaterThanOrEqual(3);
    halos.forEach((halo) => {
      expect(halo.closest('[aria-hidden="true"]')).not.toBeNull();
      expect(halo.closest('.pointer-events-none')).not.toBeNull();
    });
    expect(screen.getByText('Carlos Morales')).toBeInTheDocument();
    expect(screen.getByText('No registrado')).toBeInTheDocument();
    const selector = screen.getByRole('button', { name: 'Filtrar por departamento' });
    expect(selector.closest('.overflow-hidden')).toBeNull();
    expect(selector).toHaveAttribute('aria-expanded', 'false');
    expect(within(selector).getByText('Todos los departamentos')).toBeInTheDocument();
    fireEvent.click(selector);
    expect(selector).toHaveAttribute('aria-expanded', 'true');
    fireEvent.click(screen.getByRole('button', { name: /operaciones/i }));
    expect(selector).toHaveAttribute('aria-expanded', 'false');
    expect(within(selector).getByText('Operaciones')).toBeInTheDocument();
    expect(screen.queryByText('Ana Torres')).not.toBeInTheDocument();
    expect(screen.getByText('Luis Solís')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /historial/i }));
    expect(screen.getByText('01/10/2026')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Filtrar por departamento' }));
    fireEvent.click(screen.getByRole('button', { name: /ventas/i }));
    expect(screen.queryByText('01/10/2026')).not.toBeInTheDocument();
    expect(screen.getByText('No hay ausencias finalizadas para este departamento')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Filtrar por departamento' }));
    fireEvent.click(screen.getByRole('button', { name: /todos los departamentos/i }));
    expect(screen.getByText('01/10/2026')).toBeInTheDocument();
  });
});
