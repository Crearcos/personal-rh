import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { RolColaboradorRRHH } from '../components/RolColaboradorRRHH';

describe('gestión del rol de una ficha', () => {
  it('muestra el impacto y solicita confirmación antes de cambiarlo', async () => {
    const guardar = vi.fn().mockResolvedValue(true);
    render(<RolColaboradorRRHH rolActual="empleado" onGuardar={guardar} onCancelar={vi.fn()} />);
    fireEvent.change(screen.getByLabelText('Nuevo rol de acceso'), { target: { value: 'admin' } });
    expect(screen.getByText(/acceso administrativo a toda la empresa/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Revisar cambio' }));
    expect(guardar).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar cambio de rol' }));
    expect(await screen.findByText('Rol actualizado correctamente.')).toBeInTheDocument();
    expect(guardar).toHaveBeenCalledWith('admin');
  });
  it('explica si no se puede completar el cambio', async () => {
    render(<RolColaboradorRRHH rolActual="jefe" onGuardar={vi.fn().mockResolvedValue(false)} onCancelar={vi.fn()} />);
    fireEvent.change(screen.getByLabelText('Nuevo rol de acceso'), { target: { value: 'empleado' } });
    fireEvent.click(screen.getByRole('button', { name: 'Revisar cambio' }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar cambio de rol' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Revisa si tiene personas a cargo');
  });
});
