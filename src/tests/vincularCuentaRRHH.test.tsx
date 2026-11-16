import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { VincularCuentaRRHH } from '../components/VincularCuentaRRHH';

describe('vincular cuenta de colaborador', () => {
  it('muestra el correo de la ficha y vincula solo al confirmar', async () => {
    const vincular = vi.fn().mockResolvedValue('vinculada');
    render(<VincularCuentaRRHH onConsultar={async () => 'ana@demo.test'} onVincular={vincular} onVolver={vi.fn()} />);
    expect(await screen.findByText('ana@demo.test')).toBeInTheDocument();
    expect(vincular).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Vincular cuenta' }));
    expect(await screen.findByText('Cuenta vinculada correctamente.')).toBeInTheDocument();
  });
  it('explica qué revisar si no se puede vincular', async () => {
    render(<VincularCuentaRRHH onConsultar={async () => 'ana@demo.test'} onVincular={async () => null} onVolver={vi.fn()} />);
    fireEvent.click(await screen.findByRole('button', { name: 'Vincular cuenta' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('cuenta confirmada');
  });
});
