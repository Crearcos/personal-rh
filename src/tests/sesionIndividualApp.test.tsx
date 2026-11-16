import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { App } from '../App';

vi.mock('../components/Navbar', () => ({ Navbar: ({ permitirCambioRol, onEmpresaChange }: { permitirCambioRol: boolean; onEmpresaChange: (id: string) => void }) => <div>{permitirCambioRol ? 'Roles disponibles' : 'Rol fijo'}<button onClick={() => onEmpresaChange('a')}>Empresa A</button></div> }));
vi.mock('../components/NotificationModal', () => ({ NotificationModal: () => null }));
vi.mock('../views/EmployeeMobileView', () => ({ EmployeeMobileView: ({ session, onDeleteSolicitud }: { session: { nombre: string }; onDeleteSolicitud?: unknown }) => <div>Empleado: {session.nombre} {onDeleteSolicitud ? 'Eliminación habilitada' : 'Historial protegido'}</div> }));
vi.mock('../views/ManagerView', () => ({ ManagerView: ({ session }: { session: { nombre: string } }) => <div>Jefe: {session.nombre}</div> }));
vi.mock('../views/AdminView', () => ({ AdminView: () => <div>RRHH</div> }));
vi.mock('../services/periodosRRHHRepository', () => ({ fetchPeriodosRRHH: vi.fn().mockResolvedValue({ success: true, data: [] }) }));
vi.mock('../services/repository', () => {
  const lista = vi.fn().mockResolvedValue({ success: true, data: [] });
  return { fetchEmpresas: lista, fetchDepartamentos: lista, fetchTiposSolicitud: lista, fetchSaldos: lista, fetchSolicitudes: lista,
    fetchCriterios: lista, fetchEvaluaciones: lista, fetchOnboardingTareas: lista, fetchRegistroActividad: lista,
    fetchUsuariosPorEmpresa: vi.fn().mockResolvedValue({ success: true, data: [
      { id: 'u1', empresa_id: 'a', rol: 'jefe', activo: true }, { id: 'u2', empresa_id: 'a', rol: 'jefe', activo: true },
      { id: 'u3', empresa_id: 'b', rol: 'jefe', activo: true },
      { id: 'u4', empresa_id: 'a', rol: 'empleado', activo: true },
    ] }), fetchEmpleados: vi.fn().mockResolvedValue({ success: true, data: [
      { id: 'e1', usuario_id: 'u1', empresa_id: 'a', nombre: 'Otra persona', activo: true },
      { id: 'e2', usuario_id: 'u2', empresa_id: 'a', nombre: 'Jefa vinculada', activo: true },
      { id: 'e3', usuario_id: 'u3', empresa_id: 'b', nombre: 'Jefa B', activo: true },
      { id: 'e4', usuario_id: 'u4', empresa_id: 'a', nombre: 'Empleado A', activo: true },
    ] }), insertSolicitud: vi.fn(), resolveSolicitud: vi.fn(), insertEvaluacion: vi.fn(), toggleOnboardingEstado: vi.fn(),
    triggerResetDemoData: vi.fn(), deleteSolicitud: vi.fn() };
});

describe('sesión individual', () => {
  it('muestra la misma carga a pantalla completa antes de mostrar la navegación', async () => {
    render(<App empresasAutorizadas={['a']} accesos={[{ empresa_id: 'a', rol: 'jefe', empleado_id: 'e2' }]} />);
    expect(screen.getByRole('status', { name: 'Cargando PersonalHR' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Empresa A' })).not.toBeInTheDocument();
    expect(await screen.findByText('Jefe: Jefa vinculada')).toBeInTheDocument();
  });
  it('utiliza la persona vinculada y no permite cambiar de rol', async () => {
    render(<App empresasAutorizadas={['a']} accesos={[{ empresa_id: 'a', rol: 'jefe', empleado_id: 'e2' }]} />);
    expect(await screen.findByText('Jefe: Jefa vinculada')).toBeInTheDocument();
    expect(screen.getByText('Rol fijo')).toBeInTheDocument();
    expect(screen.queryByText('Jefe: Otra persona')).not.toBeInTheDocument();
  });
  it('limita el rol según la empresa, aunque sea administrador en otra', async () => {
    render(<App empresasAutorizadas={['b', 'a']} accesos={[
      { empresa_id: 'b', rol: 'admin', empleado_id: null },
      { empresa_id: 'a', rol: 'jefe', empleado_id: 'e2' },
    ]} />);
    expect(await screen.findByText('Jefe: Jefa B')).toBeInTheDocument();
    expect(screen.getByText('Roles disponibles')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Empresa A' }));
    expect(await screen.findByText('Jefe: Jefa vinculada')).toBeInTheDocument();
    expect(screen.getByText('Rol fijo')).toBeInTheDocument();
  });
  it('protege el historial y no ofrece borrar solicitudes', async () => {
    render(<App empresasAutorizadas={['a']} accesos={[{ empresa_id: 'a', rol: 'empleado', empleado_id: 'e4' }]} />);
    expect(await screen.findByText('Empleado: Empleado A Historial protegido')).toBeInTheDocument();
  });
  it('no sustituye una identidad ausente por otra persona de la empresa', async () => {
    render(<App empresasAutorizadas={['a']} accesos={[{ empresa_id: 'a', rol: 'jefe', empleado_id: 'inexistente' }]} />);
    expect(await screen.findByText('Cuenta no disponible')).toBeInTheDocument();
    expect(screen.queryByText(/Jefe: Otra persona/)).not.toBeInTheDocument();
  });
});
