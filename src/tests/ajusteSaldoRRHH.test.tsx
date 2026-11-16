import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AjusteSaldoRRHH } from '../components/AjusteSaldoRRHH';
import type { SaldoVacaciones } from '../types/models';

const saldo = { id: 's1', empleado_id: 'e1', empresa_id: 'emp_a', anio: 2026, dias_derecho: 15, dias_tomados: 5, dias_pendientes: 10 } as SaldoVacaciones;

describe('ajuste de saldo de vacaciones', () => {
  it('muestra el período y calcula el saldo disponible antes de guardar', () => {
    render(<AjusteSaldoRRHH saldo={saldo} onGuardar={vi.fn()} onCancelar={vi.fn()} />);
    expect(screen.getByText(/2026/)).toBeInTheDocument();
    expect(screen.getByText('5 días')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Días asignados'), { target: { value: '20' } });
    expect(screen.getByText('15 días')).toBeInTheDocument();
  });
  it('impide asignar menos días de los ya tomados', async () => {
    const guardar = vi.fn();
    render(<AjusteSaldoRRHH saldo={saldo} onGuardar={guardar} onCancelar={vi.fn()} />);
    fireEvent.change(screen.getByLabelText('Días asignados'), { target: { value: '4' } });
    fireEvent.click(screen.getByRole('button', { name: /guardar saldo/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent('días tomados');
    expect(guardar).not.toHaveBeenCalled();
  });
  it('envía los días asignados y muestra el error si no se puede guardar', async () => {
    const guardar = vi.fn().mockResolvedValue(false);
    render(<AjusteSaldoRRHH saldo={saldo} onGuardar={guardar} onCancelar={vi.fn()} />);
    fireEvent.change(screen.getByLabelText('Días asignados'), { target: { value: '18' } });
    fireEvent.click(screen.getByRole('button', { name: /guardar saldo/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent('No se pudo guardar');
    expect(guardar).toHaveBeenCalledWith(18);
  });
});
