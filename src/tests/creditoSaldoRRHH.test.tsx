import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { CreditoSaldoRRHH } from '../components/CreditoSaldoRRHH';
import type { SaldoVacaciones } from '../types/models';

const saldo = { id: 's1', empresa_id: 'a', empleado_id: 'e1', anio: 2026, dias_derecho: 15, dias_tomados: 15, dias_pendientes: 0 } as SaldoVacaciones;

describe('acreditar días de vacaciones', () => {
  it('previsualiza el crédito y pide confirmación antes de aplicarlo', async () => {
    const guardar = vi.fn().mockResolvedValue(true);
    render(<CreditoSaldoRRHH saldo={saldo} onGuardar={guardar} onCancelar={vi.fn()} />);
    fireEvent.change(screen.getByLabelText('Días a acreditar'), { target: { value: '15' } });
    fireEvent.change(screen.getByLabelText('Motivo del ajuste'), { target: { value: 'Prueba de demo' } });
    expect(screen.getByText('15 días disponibles')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Revisar crédito' }));
    expect(guardar).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar crédito' }));
    await waitFor(() => expect(guardar).toHaveBeenCalledWith(15, 'Prueba de demo', expect.any(String)));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Confirmar crédito' })).toBeEnabled());
  });
  it('rechaza cantidad nula y motivo vacío', () => {
    const guardar = vi.fn();
    render(<CreditoSaldoRRHH saldo={saldo} onGuardar={guardar} onCancelar={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Revisar crédito' }));
    expect(guardar).not.toHaveBeenCalled();
  });
});
