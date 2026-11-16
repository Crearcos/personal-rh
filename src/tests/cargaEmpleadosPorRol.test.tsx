import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { App } from '../App';
vi.mock('../services/periodosRRHHRepository', () => ({ fetchPeriodosRRHH: vi.fn().mockResolvedValue({ success: true, data: [] }), crearPeriodoRRHH: vi.fn(), cambiarEstadoPeriodoRRHH: vi.fn() }));
import { fetchEmpleados } from '../services/repository';

vi.mock('../components/Navbar', () => ({ Navbar: ({ onRoleChange }: { onRoleChange: (rol: string) => void }) => <>
  <button onClick={() => onRoleChange('admin')}>RRHH</button><button onClick={() => onRoleChange('jefe')}>Jefe</button>
</> }));
vi.mock('../components/NotificationModal', () => ({ NotificationModal: () => null }));
vi.mock('../views/EmployeeMobileView', () => ({ EmployeeMobileView: () => null }));
vi.mock('../views/ManagerView', () => ({ ManagerView: ({ empleados }: { empleados: { nombre: string }[] }) => <div>Jefatura: {empleados.map((item) => item.nombre).join(', ')}</div> }));
vi.mock('../views/AdminView', () => ({ AdminView: ({ empleados }: { empleados: { nombre: string }[] }) => <div>RRHH: {empleados.map((item) => item.nombre).join(', ')}</div> }));
vi.mock('../services/repository', () => {
  const lista = vi.fn().mockResolvedValue({ success: true, data: [] });
  return { fetchEmpresas: lista, fetchDepartamentos: lista, fetchEmpleados: vi.fn(), fetchUsuariosPorEmpresa: vi.fn().mockResolvedValue({ success: true, data: [
    { id: 'j', empresa_id: 'emp_andes', rol: 'jefe', activo: true }, { id: 'a', empresa_id: 'emp_andes', rol: 'admin', activo: true },
  ] }), fetchTiposSolicitud: lista,
    fetchSaldos: lista, fetchSolicitudes: lista, fetchCriterios: lista, fetchEvaluaciones: lista,
    fetchOnboardingTareas: lista, fetchRegistroActividad: lista, insertSolicitud: vi.fn(), resolveSolicitud: vi.fn(),
    insertEvaluacion: vi.fn(), toggleOnboardingEstado: vi.fn(), triggerResetDemoData: vi.fn(), deleteSolicitud: vi.fn() };
});

describe('Carga de empleados por rol', () => {
  beforeEach(() => {
    vi.mocked(fetchEmpleados).mockImplementation(async (_empresa, incluirInactivos) => ({ success: true, data: [
      { id: '1', nombre: 'Activo', activo: true, empresa_id: 'emp_andes', usuario_id: incluirInactivos ? 'a' : 'j' },
      ...(incluirInactivos ? [{ id: '2', nombre: 'Inactivo', activo: false }] : []),
    ] as never }));
  });
  it('solicita inactivos solo al entrar en RRHH y mantiene el filtro del jefe', async () => {
    render(<App />);
    await screen.findByText('Jefatura: Activo');
    expect(fetchEmpleados).toHaveBeenLastCalledWith('emp_andes', false);
    fireEvent.click(screen.getByRole('button', { name: 'RRHH' }));
    await screen.findByText('RRHH: Activo, Inactivo');
    expect(fetchEmpleados).toHaveBeenLastCalledWith('emp_andes', true);
    fireEvent.click(screen.getByRole('button', { name: 'Jefe' }));
    await screen.findByText('Jefatura: Activo');
    await waitFor(() => expect(fetchEmpleados).toHaveBeenLastCalledWith('emp_andes', false));
  });
});
