import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { CambiarContrasena } from '../components/CambiarContrasena';
import { Navbar } from '../components/Navbar';

describe('cambio de contraseña', () => {
  it('ofrece el acceso al cambio de contraseña para la cuenta conectada', () => {
    const abrir = vi.fn();
    render(<Navbar currentRole="empleado" permitirCambioRol={false} onRoleChange={vi.fn()} empresas={[]} selectedEmpresaId="a" onEmpresaChange={vi.fn()} onResetDemo={vi.fn()} isResetting={false} onCambiarContrasena={abrir} />);
    fireEvent.click(screen.getByRole('button', { name: 'Cambiar contraseña de mi cuenta' }));
    expect(abrir).toHaveBeenCalledOnce();
  });
  it('verifica la confirmación antes de enviar', async () => {
    const guardar = vi.fn();
    render(<CambiarContrasena onGuardar={guardar} onVolver={vi.fn()} />);
    fireEvent.change(screen.getByLabelText('Contraseña actual'), { target: { value: 'Actual12345!' } });
    fireEvent.change(screen.getByLabelText('Nueva contraseña'), { target: { value: 'Nueva12345!' } });
    fireEvent.change(screen.getByLabelText('Confirmar nueva contraseña'), { target: { value: 'Distinta12345!' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar contraseña' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('no coinciden');
    expect(guardar).not.toHaveBeenCalled();
  });
  it('confirma el cambio y elimina las contraseñas del formulario', async () => {
    const guardar = vi.fn().mockResolvedValue('actualizada');
    render(<CambiarContrasena onGuardar={guardar} onVolver={vi.fn()} />);
    fireEvent.change(screen.getByLabelText('Contraseña actual'), { target: { value: 'Actual12345!' } });
    fireEvent.change(screen.getByLabelText('Nueva contraseña'), { target: { value: 'Nueva12345!' } });
    fireEvent.change(screen.getByLabelText('Confirmar nueva contraseña'), { target: { value: 'Nueva12345!' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar contraseña' }));
    expect(await screen.findByRole('status')).toHaveTextContent('Contraseña actualizada');
    expect(screen.queryByLabelText('Contraseña actual')).not.toBeInTheDocument();
    expect(guardar).toHaveBeenCalledWith('Actual12345!', 'Nueva12345!');
  });
});
