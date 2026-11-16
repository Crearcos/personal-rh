import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AccesoRRHH } from '../components/AccesoRRHH';

describe('acceso a PersonalHR', () => {
  it('envía el correo y la contraseña ingresados', async () => {
    const ingresar = vi.fn().mockResolvedValue(true);
    render(<AccesoRRHH onIngresar={ingresar} />);
    fireEvent.change(screen.getByLabelText('Correo'), { target: { value: 'admin@example.com' } });
    fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'una-clave-segura' } });
    fireEvent.click(screen.getByRole('button', { name: 'Ingresar' }));
    await waitFor(() => expect(ingresar).toHaveBeenCalledWith('admin@example.com', 'una-clave-segura'));
  });

  it('muestra un error seguro si falla el acceso', async () => {
    render(<AccesoRRHH onIngresar={vi.fn().mockResolvedValue(false)} />);
    fireEvent.change(screen.getByLabelText('Correo'), { target: { value: 'admin@example.com' } });
    fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'incorrecta' } });
    fireEvent.click(screen.getByRole('button', { name: 'Ingresar' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('No pudimos iniciar sesión');
  });
});
