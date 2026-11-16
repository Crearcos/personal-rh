import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ReportesRRHH } from '../components/ReportesRRHH';
import type { Empleado, Solicitud, TipoSolicitud, Evaluacion } from '../types/models';

const { descargar } = vi.hoisted(() => ({ descargar: vi.fn() }));
vi.mock('../services/exportacionReportesRRHH', () => ({ descargarReporte: descargar }));
const empleados = [{ id: 'e1', nombre: 'Ana', departamento_id: null }] as Empleado[];
const solicitudes = [{ id: 's1', empleado_id: 'e1', tipo_id: 't1', estado: 'aprobada', fecha_desde: '2026-03-01', fecha_hasta: '2026-03-03', dias: 3, motivo: 'Descanso' }] as Solicitud[];
const tipos = [{ id: 't1', nombre: 'Vacaciones' }] as TipoSolicitud[];
const evaluaciones = [{ id: 'v1', empleado_id: 'e1', periodo: '2026-Q1', estado: 'cerrada', puntaje_total: 85, comentarios: 'Bien' }] as Evaluacion[];

describe('vista de reportes', () => {
  it('filtra las ausencias y exporta las filas coincidentes', () => {
    render(<ReportesRRHH empleados={empleados} departamentos={[]} solicitudes={solicitudes} tiposSolicitud={tipos} evaluaciones={evaluaciones} nombreEmpresa="Empresa demo" />);
    fireEvent.change(screen.getByLabelText('Ausencias desde'), { target: { value: '2026-03-01' } });
    fireEvent.change(screen.getByLabelText('Ausencias hasta'), { target: { value: '2026-03-31' } });
    expect(screen.getByText(/1 ausencia encontrada/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Descargar ausencias en Excel' }));
    expect(descargar).toHaveBeenCalledWith('excel', 'Ausencias', 'Empresa demo', expect.any(String), expect.any(Array), expect.arrayContaining([expect.arrayContaining(['Ana', 'Descanso', 3])]));
  });
  it('no habilita exportación cuando el intervalo es inválido', () => {
    render(<ReportesRRHH empleados={empleados} departamentos={[]} solicitudes={solicitudes} tiposSolicitud={tipos} evaluaciones={evaluaciones} nombreEmpresa="Empresa demo" />);
    fireEvent.change(screen.getByLabelText('Ausencias desde'), { target: { value: '2026-04-01' } });
    fireEvent.change(screen.getByLabelText('Ausencias hasta'), { target: { value: '2026-03-01' } });
    expect(screen.getByRole('alert')).toHaveTextContent('fecha inicial');
    expect(screen.getByRole('button', { name: 'Descargar ausencias en PDF' })).toBeDisabled();
  });
  it('bloquea la exportación incluso si una ausencia abarca un rango de fechas invertido', () => {
    const ausenciaLarga = [{ ...solicitudes[0], fecha_desde: '2026-03-01', fecha_hasta: '2026-04-30' }] as Solicitud[];
    render(<ReportesRRHH empleados={empleados} departamentos={[]} solicitudes={ausenciaLarga} tiposSolicitud={tipos} evaluaciones={evaluaciones} nombreEmpresa="Empresa demo" />);
    fireEvent.change(screen.getByLabelText('Ausencias desde'), { target: { value: '2026-04-15' } });
    fireEvent.change(screen.getByLabelText('Ausencias hasta'), { target: { value: '2026-03-15' } });
    expect(screen.getByRole('alert')).toHaveTextContent('fecha inicial');
    expect(screen.getByRole('button', { name: 'Descargar ausencias en Excel' })).toBeDisabled();
    expect(screen.queryByText('Descanso')).not.toBeInTheDocument();
  });
  it('explica por qué un reporte sin resultados no se puede descargar', () => {
    render(<ReportesRRHH empleados={empleados} departamentos={[]} solicitudes={[]} tiposSolicitud={tipos} evaluaciones={[]} nombreEmpresa="Empresa demo" />);
    expect(screen.getByText('No hay ausencias en el período seleccionado. Cambia las fechas para buscar otros resultados.')).toBeInTheDocument();
    expect(screen.getByText('No hay evaluaciones cerradas para el ciclo seleccionado.')).toBeInTheDocument();
  });
  it('filtra resultados por ciclo y descarga el PDF correspondiente', () => {
    descargar.mockClear();
    render(<ReportesRRHH empleados={empleados} departamentos={[]} solicitudes={solicitudes} tiposSolicitud={tipos} evaluaciones={evaluaciones} nombreEmpresa="Empresa demo" />);
    fireEvent.change(screen.getByLabelText('Ciclo de evaluación'), { target: { value: '2026-Q1' } });
    fireEvent.click(screen.getByRole('button', { name: 'Descargar evaluaciones en PDF' }));
    expect(descargar).toHaveBeenCalledWith('pdf', 'Evaluaciones', 'Empresa demo', 'Ciclo 2026-Q1', expect.any(Array), expect.arrayContaining([expect.arrayContaining(['Ana', '2026-Q1', 85, 'Bien'])]));
  });
});
