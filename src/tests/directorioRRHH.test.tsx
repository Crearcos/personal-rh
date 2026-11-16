import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { DirectorioRRHH } from '../components/DirectorioRRHH';
import type { Departamento, Empleado, SaldoVacaciones, Usuario } from '../types/models';

const empleados = [
  { id: 'e1', nombre: 'Ana Torres', cargo: 'Asesora', departamento_id: 'd1', jefe_id: 'e2', fecha_ingreso: '2025-01-10', tipo_contrato: 'Indefinido', activo: true },
  { id: 'e2', nombre: 'Carlos Ruiz', cargo: 'Jefe', departamento_id: 'd1', jefe_id: null, fecha_ingreso: '2024-02-01', tipo_contrato: 'Indefinido', activo: true },
] as Empleado[];
const departamentos = [{ id: 'd1', nombre: 'Ventas' }] as Departamento[];
const saldos = [{ empleado_id: 'e1', anio: 2026, dias_derecho: 15, dias_tomados: 5, dias_pendientes: 10 }] as SaldoVacaciones[];

describe('Directorio de RRHH', () => {
  it('ofrece limpiar los filtros cuando la búsqueda no encuentra colaboradores', () => {
    const limpiar = vi.fn();
    render(<DirectorioRRHH empleados={[]} todosEmpleados={empleados} departamentos={departamentos} saldos={saldos} onLimpiarFiltros={limpiar} />);
    fireEvent.click(screen.getByRole('button', { name: 'Limpiar filtros del directorio' }));
    expect(limpiar).toHaveBeenCalledOnce();
  });
  it('muestra la ficha con jefe y saldo real y permite regresar', () => {
    render(<DirectorioRRHH empleados={empleados} departamentos={departamentos} saldos={saldos} />);
    fireEvent.click(screen.getByRole('button', { name: /ver ficha de Ana Torres/i }));
    const ficha = screen.getByRole('region', { name: /ficha de Ana Torres/i });
    expect(within(ficha).getByText('Carlos Ruiz')).toBeInTheDocument();
    expect(within(ficha).getByText('10/01/2025')).toBeInTheDocument();
    expect(within(ficha).getByText('10 días')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /volver al directorio/i }));
    expect(screen.getByRole('button', { name: /ver ficha de Ana Torres/i })).toBeInTheDocument();
  });
  it('indica cuando no existe saldo en lugar de inventar días', () => {
    render(<DirectorioRRHH empleados={empleados} departamentos={departamentos} saldos={saldos} />);
    fireEvent.click(screen.getByRole('button', { name: /ver ficha de Carlos Ruiz/i }));
    expect(screen.getByText('Sin saldo registrado')).toBeInTheDocument();
  });
  it('permite abrir el ajuste de saldo de la persona seleccionada', () => {
    render(<DirectorioRRHH empleados={empleados} departamentos={departamentos} saldos={saldos} onAjustarSaldo={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /ver ficha de Ana Torres/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Ajustar saldo' }));
    expect(screen.getByRole('region', { name: 'Ajustar saldo' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(screen.getByRole('button', { name: 'Ajustar saldo' })).toBeInTheDocument();
  });
  it('permite acreditar días desde la ficha seleccionada', async () => {
    const acreditar = vi.fn().mockResolvedValue(true);
    render(<DirectorioRRHH empleados={empleados} departamentos={departamentos} saldos={saldos} onAcreditarSaldo={acreditar} />);
    fireEvent.click(screen.getByRole('button', { name: /ver ficha de Ana Torres/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Acreditar días' }));
    fireEvent.change(screen.getByLabelText('Días a acreditar'), { target: { value: '3' } });
    fireEvent.change(screen.getByLabelText('Motivo del ajuste'), { target: { value: 'Prueba de demo' } });
    fireEvent.click(screen.getByRole('button', { name: 'Revisar crédito' }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar crédito' }));
    expect(await screen.findByText('Días acreditados correctamente.')).toBeInTheDocument();
    expect(acreditar).toHaveBeenCalledWith(saldos[0], 3, 'Prueba de demo', expect.any(String));
  });
  it('abre la edición de la ficha y permite guardar los cambios', async () => {
    const editar = vi.fn().mockResolvedValue(true);
    render(<DirectorioRRHH empleados={empleados} departamentos={departamentos} saldos={saldos} onEditarColaborador={editar} />);
    fireEvent.click(screen.getByRole('button', { name: /ver ficha de Ana Torres/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Editar ficha' }));
    fireEvent.change(screen.getByLabelText('Cargo'), { target: { value: 'Asesora senior' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));
    expect(await screen.findByText('Ficha actualizada correctamente.')).toBeInTheDocument();
    expect(editar).toHaveBeenCalledWith(expect.objectContaining({ id: 'e1', cargo: 'Asesora senior' }));
  });
  it('pide confirmación antes de desactivar y permite cancelar', async () => {
    const desactivar = vi.fn().mockResolvedValue(true);
    render(<DirectorioRRHH empleados={empleados} departamentos={departamentos} saldos={saldos} onDesactivarColaborador={desactivar} />);
    fireEvent.click(screen.getByRole('button', { name: /ver ficha de Ana Torres/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Desactivar colaborador' }));
    expect(desactivar).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar desactivación' }));
    fireEvent.click(screen.getByRole('button', { name: 'Desactivar colaborador' }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar desactivación' }));
    expect(await screen.findByText('Colaborador desactivado correctamente.')).toBeInTheDocument();
    expect(desactivar).toHaveBeenCalledWith('e1');
  });
  it('permite reactivar una ficha inactiva', async () => {
    const reactivar = vi.fn().mockResolvedValue(true);
    const inactivo = [{ ...empleados[0], activo: false }];
    render(<DirectorioRRHH empleados={inactivo} departamentos={departamentos} saldos={saldos} onReactivarColaborador={reactivar} />);
    fireEvent.click(screen.getByRole('button', { name: /ver ficha de Ana Torres/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Reactivar colaborador' }));
    expect(await screen.findByText('Colaborador reactivado correctamente.')).toBeInTheDocument();
    expect(reactivar).toHaveBeenCalledWith('e1');
  });
  it('vincula la cuenta de la persona seleccionada', async () => {
    const vincular = vi.fn().mockResolvedValue('vinculada');
    const conUsuario = empleados.map((item) => item.id === 'e1' ? { ...item, usuario_id: 'u1' } : item);
    render(<DirectorioRRHH empleados={conUsuario} usuarios={[{ id: 'u1', rol: 'empleado' } as Usuario]} departamentos={departamentos} saldos={saldos} onConsultarCorreo={async () => 'ana@demo.test'} onVincularCuenta={vincular} />);
    fireEvent.click(screen.getByRole('button', { name: /ver ficha de Ana Torres/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Gestionar acceso' }));
    expect(await screen.findByText('ana@demo.test')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Vincular cuenta' }));
    expect(await screen.findByText('Cuenta vinculada correctamente.')).toBeInTheDocument();
    expect(vincular).toHaveBeenCalledWith('e1', 'ana@demo.test', 'empleado');
  });
  it('permite revisar y cambiar el rol desde la ficha seleccionada', async () => {
    const cambiarRol = vi.fn().mockResolvedValue(true);
    const conUsuario = empleados.map((item) => item.id === 'e1' ? { ...item, usuario_id: 'u1' } : item);
    render(<DirectorioRRHH empleados={conUsuario} usuarios={[{ id: 'u1', rol: 'empleado' } as Usuario]} departamentos={departamentos} saldos={saldos} onCambiarRol={cambiarRol} />);
    fireEvent.click(screen.getByRole('button', { name: /ver ficha de Ana Torres/i }));
    expect(screen.getByText('Colaborador')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Cambiar rol' }));
    fireEvent.change(screen.getByLabelText('Nuevo rol de acceso'), { target: { value: 'jefe' } });
    fireEvent.click(screen.getByRole('button', { name: 'Revisar cambio' }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar cambio de rol' }));
    expect(await screen.findByText('Rol actualizado correctamente.')).toBeInTheDocument();
    expect(cambiarRol).toHaveBeenCalledWith('e1', 'jefe');
  });
});
