import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ConfiguracionPeriodosRRHH } from '../components/ConfiguracionPeriodosRRHH';
import type { PeriodoEvaluacion } from '../types/models';

const periodos = [{ id: 'p1', empresa_id: 'a', nombre: '2025-Q4', fecha_inicio: null, fecha_fin: null, estado: 'cerrado', created_at: '' }, { id: 'p2', empresa_id: 'a', nombre: '2026-Q1', fecha_inicio: null, fecha_fin: null, estado: 'abierto', created_at: '' }] as PeriodoEvaluacion[];

describe('períodos de evaluación', () => {
  it('identifica períodos históricos sin inventar sus fechas', () => {
    render(<ConfiguracionPeriodosRRHH periodos={periodos} onCrear={vi.fn()} onCambiarEstado={vi.fn()} />);
    expect(screen.getByText('2025-Q4')).toBeInTheDocument();
    expect(screen.getAllByText('Fechas no registradas')).toHaveLength(2);
  });
  it('valida las fechas y crea un período', async () => {
    const crear = vi.fn().mockResolvedValue(true);
    render(<ConfiguracionPeriodosRRHH periodos={periodos} onCrear={crear} onCambiarEstado={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Nuevo período' }));
    fireEvent.change(screen.getByLabelText('Nombre del período'), { target: { value: '  2026-Q4  ' } });
    fireEvent.change(screen.getByLabelText('Fecha de inicio'), { target: { value: '2026-10-01' } });
    fireEvent.change(screen.getByLabelText('Fecha de fin'), { target: { value: '2026-09-30' } });
    fireEvent.click(screen.getByRole('button', { name: 'Crear período' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('fecha de inicio');
    expect(crear).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText('Fecha de fin'), { target: { value: '2026-12-31' } });
    fireEvent.click(screen.getByRole('button', { name: 'Crear período' }));
    expect(await screen.findByText('Período creado correctamente.')).toBeInTheDocument();
    expect(crear).toHaveBeenCalledWith({ nombre: '2026-Q4', fechaInicio: '2026-10-01', fechaFin: '2026-12-31' });
  });
  it('pide confirmación antes de cerrar un período', async () => {
    const cambiar = vi.fn().mockResolvedValue(true);
    render(<ConfiguracionPeriodosRRHH periodos={periodos} onCrear={vi.fn()} onCambiarEstado={cambiar} />);
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar 2026-Q1' }));
    expect(cambiar).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar cierre' }));
    expect(await screen.findByText('Estado actualizado correctamente.')).toBeInTheDocument();
    expect(cambiar).toHaveBeenCalledWith('p2', 'cerrado');
  });
});
