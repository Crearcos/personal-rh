import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { EmployeeMobileView } from '../views/EmployeeMobileView';
import type { DemoUserSession, TipoSolicitud } from '../types/models';

const session = { usuarioId: 'u1', empleadoId: 'e1', nombre: 'Ana Demo', correo: 'ana@demo.com', cargo: 'Analista', rol: 'empleado', empresaId: 'a' } as DemoUserSession;
const tipos = [{ id: 't1', nombre: 'Permiso activo', descuenta_saldo: false, activo: true }, { id: 't2', nombre: 'Permiso inactivo', descuenta_saldo: false, activo: false }] as TipoSolicitud[];
const props = { session, saldo: null, solicitudes: [], onboardingTareas: [], onSubmitSolicitud: vi.fn(), onToggleTarea: vi.fn() };

describe('tipos disponibles para el empleado', () => {
  it('no inventa un saldo cuando no se pudo obtener', () => {
    render(<EmployeeMobileView {...props} tiposSolicitud={tipos} />);
    expect(screen.getByText('Saldo no disponible. Consulta con RR. HH.')).toBeInTheDocument();
    expect(screen.queryByText('15')).not.toBeInTheDocument();
  });
  it('selecciona vacaciones cuando los tipos llegan después de cargar y explica el descuento', () => {
    const vacaciones = { id: 'tipo_vacaciones', nombre: 'Vacaciones Anuales', descuenta_saldo: true, activo: true } as TipoSolicitud;
    const { rerender } = render(<EmployeeMobileView {...props} tiposSolicitud={[]} />);
    rerender(<EmployeeMobileView {...props} tiposSolicitud={[tipos[0], vacaciones]} />);
    expect(screen.getByRole('button', { name: 'Seleccionar tipo de permiso o vacaciones' })).toHaveTextContent('Vacaciones Anuales');
    expect(screen.getByText('Al aprobarse, esta solicitud descontará días de tu saldo de vacaciones.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Seleccionar tipo de permiso o vacaciones' }));
    fireEvent.click(screen.getByRole('button', { name: /Permiso activo/ }));
    expect(screen.getByText('Esta solicitud no descontará días de tu saldo de vacaciones.')).toBeInTheDocument();
  });
  it('ofrece solo los tipos activos', () => {
    render(<EmployeeMobileView {...props} tiposSolicitud={tipos} />);
    fireEvent.click(screen.getByRole('button', { name: 'Seleccionar tipo de permiso o vacaciones' }));
    expect(screen.getAllByText('Permiso activo').length).toBeGreaterThan(0);
    expect(screen.queryByText('Permiso inactivo')).not.toBeInTheDocument();
  });
  it('impide enviar cuando no hay tipos activos', () => {
    render(<EmployeeMobileView {...props} tiposSolicitud={[tipos[1]]} />);
    expect(screen.getByText(/No hay tipos de solicitud disponibles/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Enviar Solicitud al Jefe/i })).toBeDisabled();
  });
  it('mantiene el formulario y muestra el error del servidor si cambian las condiciones', async () => {
    const enviar = vi.fn().mockResolvedValue('Ya existe una solicitud pendiente o aprobada en estas fechas.');
    const { container } = render(<EmployeeMobileView {...props} onSubmitSolicitud={enviar} tiposSolicitud={tipos} />);
    const fechas = container.querySelectorAll('input[type="date"]');
    fireEvent.change(fechas[0], { target: { value: '2026-12-01' } });
    fireEvent.change(fechas[1], { target: { value: '2026-12-02' } });
    fireEvent.change(screen.getByPlaceholderText(/Vacaciones anuales/), { target: { value: 'Motivo' } });
    fireEvent.click(screen.getByRole('button', { name: /Enviar Solicitud al Jefe/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Ya existe una solicitud pendiente');
    expect(screen.getByPlaceholderText(/Vacaciones anuales/)).toHaveValue('Motivo');
  });
});
