import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { App } from '../App';
vi.mock('../services/periodosRRHHRepository', () => ({ fetchPeriodosRRHH: vi.fn().mockResolvedValue({ success: true, data: [] }), crearPeriodoRRHH: vi.fn(), cambiarEstadoPeriodoRRHH: vi.fn() }));

vi.mock('../components/Navbar', () => ({ Navbar: ({ onRoleChange }: { onRoleChange: (rol: string) => void }) => <button onClick={() => onRoleChange('empleado')}>Empleado</button> }));
vi.mock('../components/NotificationModal', () => ({ NotificationModal: () => null }));
vi.mock('../views/ManagerView', () => ({ ManagerView: ({ criterios }: { criterios: { nombre: string }[] }) => <p>Jefe: {criterios.map(c => c.nombre).join(', ')}</p> }));
vi.mock('../views/EmployeeMobileView', () => ({ EmployeeMobileView: ({ criterios }: { criterios: { nombre: string }[] }) => <p>Empleado: {criterios.map(c => c.nombre).join(', ')}</p> }));
vi.mock('../views/AdminView', () => ({ AdminView: () => null }));
vi.mock('../services/repository', () => {
  const lista = vi.fn().mockResolvedValue({ success: true, data: [] });
  return { fetchEmpresas: lista, fetchDepartamentos: lista, fetchEmpleados: vi.fn().mockResolvedValue({ success: true, data: [
    { id: 'j1', usuario_id: 'j', empresa_id: 'emp_andes', activo: true }, { id: 'e1', usuario_id: 'e', jefe_id: 'j1', empresa_id: 'emp_andes', activo: true },
  ] }), fetchUsuariosPorEmpresa: vi.fn().mockResolvedValue({ success: true, data: [
    { id: 'j', empresa_id: 'emp_andes', activo: true, rol: 'jefe' }, { id: 'e', empresa_id: 'emp_andes', activo: true, rol: 'empleado' },
  ] }), fetchTiposSolicitud: lista, fetchSaldos: lista, fetchSolicitudes: lista,
    fetchCriterios: vi.fn().mockResolvedValue({ success: true, data: [{ id: 'c1', nombre: 'Actual', activo: true }, { id: 'c2', nombre: 'Histórico', activo: false }] }),
    fetchEvaluaciones: lista, fetchOnboardingTareas: lista, fetchRegistroActividad: lista, insertSolicitud: vi.fn(), resolveSolicitud: vi.fn(), insertEvaluacion: vi.fn(), toggleOnboardingEstado: vi.fn(), triggerResetDemoData: vi.fn(), deleteSolicitud: vi.fn() };
});

describe('criterios por interfaz', () => {
  it('muestra solo criterios actuales al jefe y conserva los históricos para el empleado', async () => {
    render(<App />);
    expect(await screen.findByText('Jefe: Actual')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Empleado' }));
    expect(await screen.findByText('Empleado: Actual, Histórico')).toBeInTheDocument();
  });
});
