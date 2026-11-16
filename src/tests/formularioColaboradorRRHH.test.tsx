import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { FormularioColaboradorRRHH } from '../components/FormularioColaboradorRRHH';
import type { Departamento, Empleado } from '../types/models';

const departamentos = [{ id: 'd1', nombre: 'Ventas' }] as Departamento[];
const empleados = [{ id: 'e1', nombre: 'Carlos Ruiz', activo: true }] as Empleado[];

describe('nuevo colaborador', () => {
  it('registra los datos normalizados y permite seleccionar un jefe', async () => {
    const guardar = vi.fn().mockResolvedValue(true);
    render(<FormularioColaboradorRRHH departamentos={departamentos} empleados={empleados} onGuardar={guardar} onCancelar={vi.fn()} />);
    fireEvent.change(screen.getByLabelText('Nombre completo'), { target: { value: ' Ana Demo ' } });
    fireEvent.change(screen.getByLabelText('Correo'), { target: { value: 'ANA@demo.com' } });
    fireEvent.change(screen.getByLabelText('Cargo'), { target: { value: 'Analista' } });
    fireEvent.change(screen.getByLabelText('Departamento'), { target: { value: 'd1' } });
    fireEvent.change(screen.getByLabelText('Jefe inmediato'), { target: { value: 'e1' } });
    fireEvent.change(screen.getByLabelText('Fecha de ingreso'), { target: { value: '2026-01-01' } });
    fireEvent.click(screen.getByRole('button', { name: 'Crear colaborador' }));
    expect(await screen.findByText('Colaborador creado correctamente.')).toBeInTheDocument();
    expect(guardar).toHaveBeenCalledWith(expect.objectContaining({ nombre: 'Ana Demo', correo: 'ana@demo.com', departamentoId: 'd1', jefeId: 'e1' }));
  });
  it('muestra un error si no se puede guardar', async () => {
    const guardar = vi.fn().mockResolvedValue(false);
    render(<FormularioColaboradorRRHH departamentos={departamentos} empleados={empleados} onGuardar={guardar} onCancelar={vi.fn()} />);
    fireEvent.change(screen.getByLabelText('Nombre completo'), { target: { value: 'Ana Demo' } });
    fireEvent.change(screen.getByLabelText('Correo'), { target: { value: 'ana@demo.com' } });
    fireEvent.change(screen.getByLabelText('Cargo'), { target: { value: 'Analista' } });
    fireEvent.change(screen.getByLabelText('Departamento'), { target: { value: 'd1' } });
    fireEvent.change(screen.getByLabelText('Fecha de ingreso'), { target: { value: '2026-01-01' } });
    fireEvent.click(screen.getByRole('button', { name: 'Crear colaborador' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('No se pudo crear');
  });
  it('permite elegir el rol y explica los permisos de RR. HH.', async () => {
    const guardar = vi.fn().mockResolvedValue(true);
    render(<FormularioColaboradorRRHH departamentos={departamentos} empleados={empleados} onGuardar={guardar} onCancelar={vi.fn()} />);
    fireEvent.change(screen.getByLabelText('Nombre completo'), { target: { value: 'Ana Demo' } });
    fireEvent.change(screen.getByLabelText('Correo'), { target: { value: 'ana@demo.com' } });
    fireEvent.change(screen.getByLabelText('Cargo'), { target: { value: 'Analista' } });
    fireEvent.change(screen.getByLabelText('Departamento'), { target: { value: 'd1' } });
    fireEvent.change(screen.getByLabelText('Fecha de ingreso'), { target: { value: '2026-01-01' } });
    fireEvent.change(screen.getByLabelText('Rol de acceso'), { target: { value: 'admin' } });
    expect(screen.getByText(/administra la información de toda la empresa/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Crear colaborador' }));
    await screen.findByText('Colaborador creado correctamente.');
    expect(guardar).toHaveBeenCalledWith(expect.objectContaining({ rol: 'admin' }));
  });
});
