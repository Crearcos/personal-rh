import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ConfiguracionCriteriosRRHH } from '../components/ConfiguracionCriteriosRRHH';
import type { CriterioEvaluacion } from '../types/models';

const criterios = [{ id: 'c1', nombre: 'Objetivos', peso: 0.6, activo: true }, { id: 'c2', nombre: 'Equipo', peso: 0.4, activo: true }, { id: 'c3', nombre: 'Anterior', peso: 1, activo: false }] as CriterioEvaluacion[];

describe('configuración de criterios', () => {
  it('muestra solamente los criterios activos y su peso', () => {
    render(<ConfiguracionCriteriosRRHH criterios={criterios} onGuardar={vi.fn()} />);
    expect(screen.getByDisplayValue('Objetivos')).toBeInTheDocument();
    expect(screen.getByDisplayValue('60')).toBeInTheDocument();
    expect(screen.queryByDisplayValue('Anterior')).not.toBeInTheDocument();
  });
  it('impide guardar si los pesos no suman 100%', async () => {
    const guardar = vi.fn();
    render(<ConfiguracionCriteriosRRHH criterios={criterios} onGuardar={guardar} />);
    fireEvent.change(screen.getByLabelText('Peso de Objetivos'), { target: { value: '50' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar criterios' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('100');
    expect(guardar).not.toHaveBeenCalled();
  });
  it('guarda las ponderaciones normalizadas para nuevos ciclos', async () => {
    const guardar = vi.fn().mockResolvedValue(true);
    render(<ConfiguracionCriteriosRRHH criterios={criterios} onGuardar={guardar} />);
    fireEvent.click(screen.getByRole('button', { name: 'Guardar criterios' }));
    expect(await screen.findByText('Criterios actualizados correctamente.')).toBeInTheDocument();
    expect(guardar).toHaveBeenCalledWith([{ nombre: 'Objetivos', peso: 0.6 }, { nombre: 'Equipo', peso: 0.4 }]);
  });
});
