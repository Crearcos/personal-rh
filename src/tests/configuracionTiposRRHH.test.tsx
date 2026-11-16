import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ConfiguracionTiposRRHH } from '../components/ConfiguracionTiposRRHH';
import type { Solicitud, TipoSolicitud } from '../types/models';

const tipos = [
  { id: 't1', nombre: 'Vacaciones', descuenta_saldo: true, activo: true },
  { id: 't2', nombre: 'Permiso especial', descuenta_saldo: false, activo: true },
] as TipoSolicitud[];
const solicitudes = [{ id: 's1', tipo_id: 't1' }] as Solicitud[];

describe('configuración de tipos de solicitud', () => {
  it('explica cuáles tipos afectan el saldo y protege los que tienen historial', () => {
    render(<ConfiguracionTiposRRHH tipos={tipos} solicitudes={solicitudes} onGuardar={vi.fn()} onCambiarEstado={vi.fn()} />);
    expect(screen.getByText(/^Descuenta vacaciones/)).toBeInTheDocument();
    expect(screen.getByText(/^No descuenta vacaciones/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Editar Vacaciones' })).toBeDisabled();
    expect(screen.getByText(/tiene solicitudes asociadas/i)).toBeInTheDocument();
  });
  it('crea un tipo con nombre normalizado', async () => {
    const guardar = vi.fn().mockResolvedValue(true);
    render(<ConfiguracionTiposRRHH tipos={tipos} solicitudes={solicitudes} onGuardar={guardar} onCambiarEstado={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Nuevo tipo' }));
    fireEvent.change(screen.getByLabelText('Nombre del tipo'), { target: { value: '  Permiso de estudio  ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar tipo' }));
    expect(await screen.findByText('Tipo guardado correctamente.')).toBeInTheDocument();
    expect(guardar).toHaveBeenCalledWith({ nombre: 'Permiso de estudio', descuentaSaldo: false });
  });
  it('solicita confirmación antes de desactivar un tipo', async () => {
    const cambiar = vi.fn().mockResolvedValue(true);
    render(<ConfiguracionTiposRRHH tipos={tipos} solicitudes={solicitudes} onGuardar={vi.fn()} onCambiarEstado={cambiar} />);
    fireEvent.click(screen.getByRole('button', { name: 'Desactivar Permiso especial' }));
    expect(cambiar).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar desactivación' }));
    expect(await screen.findByText('Estado actualizado correctamente.')).toBeInTheDocument();
    expect(cambiar).toHaveBeenCalledWith('t2', false);
  });
});
