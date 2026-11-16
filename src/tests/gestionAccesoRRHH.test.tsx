import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { GestionAccesoRRHH } from '../components/GestionAccesoRRHH';

describe('gestión del acceso', () => {
  it('crea una cuenta con el correo de la ficha', async () => {
    const crear = vi.fn().mockResolvedValue('creada');
    render(<GestionAccesoRRHH correo="juan@demo.test" estado="sin_acceso" onCrear={crear} onRevocar={vi.fn()} onVincular={vi.fn()} />);
    fireEvent.change(screen.getByLabelText('Contraseña de acceso'), { target: { value: 'Prueba123456!' } });
    fireEvent.click(screen.getByRole('button', { name: 'Crear acceso' }));
    expect(await screen.findByText('Acceso creado y vinculado correctamente.')).toBeInTheDocument();
    expect(crear).toHaveBeenCalledWith('juan@demo.test', 'Prueba123456!');
  });
  it('solicita confirmación antes de retirar el acceso', async () => {
    const revocar = vi.fn().mockResolvedValue(true);
    render(<GestionAccesoRRHH correo="juan@demo.test" estado="activo" onCrear={vi.fn()} onRevocar={revocar} onVincular={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Retirar acceso' }));
    expect(revocar).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar retiro' }));
    expect(await screen.findByText('Acceso retirado; la ficha y su historial se conservan.')).toBeInTheDocument();
  });
  it('advierte si se creó la cuenta pero no se pudo vincular', async () => {
    render(<GestionAccesoRRHH correo="juan@demo.test" estado="sin_acceso" onCrear={async () => 'sin_vincular'} onRevocar={vi.fn()} onVincular={vi.fn()} />);
    fireEvent.change(screen.getByLabelText('Contraseña de acceso'), { target: { value: 'Prueba123456!' } });
    fireEvent.click(screen.getByRole('button', { name: 'Crear acceso' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('se creó, pero no se vinculó');
  });
  it('permite restablecer la contraseña después de confirmarla', async () => {
    const restablecer = vi.fn().mockResolvedValue('actualizada');
    render(<GestionAccesoRRHH correo="juan@demo.test" estado="activo" onCrear={vi.fn()} onRevocar={vi.fn()} onVincular={vi.fn()} onRestablecer={restablecer} />);
    fireEvent.click(screen.getByRole('button', { name: 'Restablecer contraseña' }));
    fireEvent.change(screen.getByLabelText('Nueva contraseña'), { target: { value: 'Prueba123456!' } });
    fireEvent.change(screen.getByLabelText('Confirmar contraseña'), { target: { value: 'Prueba123456!' } });
    expect(restablecer).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar restablecimiento' }));
    expect(await screen.findByText('Contraseña restablecida correctamente.')).toBeInTheDocument();
    expect(restablecer).toHaveBeenCalledWith('juan@demo.test', 'Prueba123456!');
  });
  it('explica cuando no se puede gestionar una cuenta compartida', async () => {
    render(<GestionAccesoRRHH correo="juan@demo.test" estado="activo" onCrear={vi.fn()} onRevocar={vi.fn()} onVincular={vi.fn()} onRestablecer={async () => 'no_permitida'} />);
    fireEvent.click(screen.getByRole('button', { name: 'Restablecer contraseña' }));
    fireEvent.change(screen.getByLabelText('Nueva contraseña'), { target: { value: 'Prueba123456!' } });
    fireEvent.change(screen.getByLabelText('Confirmar contraseña'), { target: { value: 'Prueba123456!' } });
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar restablecimiento' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('compartida con otra empresa');
  });
  it('no ofrece repetir una operación de resultado incierto', async () => {
    render(<GestionAccesoRRHH correo="juan@demo.test" estado="activo" onCrear={vi.fn()} onRevocar={vi.fn()} onVincular={vi.fn()} onRestablecer={async () => 'sin_confirmar'} />);
    fireEvent.click(screen.getByRole('button', { name: 'Restablecer contraseña' }));
    fireEvent.change(screen.getByLabelText('Nueva contraseña'), { target: { value: 'Prueba123456!' } });
    fireEvent.change(screen.getByLabelText('Confirmar contraseña'), { target: { value: 'Prueba123456!' } });
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar restablecimiento' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('No repitas la operación');
    expect(screen.queryByRole('button', { name: 'Confirmar restablecimiento' })).not.toBeInTheDocument();
  });
});
