import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { CorreoColaboradorRRHH } from '../components/CorreoColaboradorRRHH';

describe('correo del colaborador', () => {
  it('carga el correo actual y permite guardar otro', async () => {
    const guardar = vi.fn().mockResolvedValue(true);
    render(<CorreoColaboradorRRHH onConsultar={vi.fn().mockResolvedValue('antes@demo.com')} onGuardar={guardar} onCancelar={vi.fn()} />);
    const entrada = await screen.findByLabelText('Correo');
    expect(entrada).toHaveValue('antes@demo.com');
    fireEvent.change(entrada, { target: { value: 'NUEVO@demo.com' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar correo' }));
    expect(await screen.findByRole('status')).toHaveTextContent('Correo actualizado');
    expect(guardar).toHaveBeenCalledWith('nuevo@demo.com');
  });
  it('muestra un error si no se puede obtener el correo', async () => {
    render(<CorreoColaboradorRRHH onConsultar={vi.fn().mockResolvedValue(null)} onGuardar={vi.fn()} onCancelar={vi.fn()} />);
    expect(await screen.findByRole('alert')).toHaveTextContent('No se pudo cargar');
  });
});
