import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { App } from '../App';

vi.mock('../components/Navbar', () => ({ Navbar: ({ onRoleChange, onEmpresaChange }: { onRoleChange: (rol: string) => void; onEmpresaChange: (id: string) => void }) => <>
  <button onClick={() => onEmpresaChange('emp_pacifico')}>Pacífico</button><button onClick={() => onRoleChange('empleado')}>Empleado</button><button onClick={() => onRoleChange('admin')}>RRHH</button>
</> }));
vi.mock('../components/NotificationModal', () => ({ NotificationModal: () => null }));
vi.mock('../views/ManagerView', () => ({ ManagerView: ({ session }: { session: { nombre: string } }) => <p>Jefe: {session.nombre}</p> }));
vi.mock('../views/EmployeeMobileView', () => ({ EmployeeMobileView: ({ session }: { session: { nombre: string } }) => <p>Empleado: {session.nombre}</p> }));
vi.mock('../views/AdminView', () => ({ AdminView: ({ session }: { session: { nombre: string } }) => <p>RRHH: {session.nombre}</p> }));
vi.mock('../services/periodosRRHHRepository', () => ({ fetchPeriodosRRHH: vi.fn().mockResolvedValue({ success: true, data: [] }) }));
vi.mock('../services/repository', () => {
  const lista = vi.fn().mockResolvedValue({ success: true, data: [] });
  const usuarios = [
    { id: 'ja', empresa_id: 'emp_andes', rol: 'jefe', activo: true },
    { id: 'eb', empresa_id: 'emp_pacifico', rol: 'empleado', activo: true },
    { id: 'ab', empresa_id: 'emp_pacifico', rol: 'admin', activo: true },
  ];
  const empleados = [
    { id: 'j1', usuario_id: 'ja', empresa_id: 'emp_andes', nombre: 'Jefe Andes', activo: true },
    { id: 'e2', usuario_id: 'eb', empresa_id: 'emp_pacifico', nombre: 'Empleada Pacífico', activo: true },
    { id: 'a2', usuario_id: 'ab', empresa_id: 'emp_pacifico', nombre: 'Admin Pacífico', activo: true },
  ];
  return { fetchEmpresas: lista, fetchDepartamentos: lista,
    fetchUsuariosPorEmpresa: vi.fn(async (empresa: string) => ({ success: true, data: usuarios.filter((u) => u.empresa_id === empresa) })),
    fetchEmpleados: vi.fn(async (empresa: string) => ({ success: true, data: empleados.filter((e) => e.empresa_id === empresa) })),
    fetchTiposSolicitud: lista, fetchSaldos: lista, fetchSolicitudes: lista, fetchCriterios: lista, fetchEvaluaciones: lista,
    fetchOnboardingTareas: lista, fetchRegistroActividad: lista };
});

describe('identidad de demostración al cambiar de empresa', () => {
  it('no mezcla personas y muestra la vista ausente con claridad', async () => {
    render(<App />);
    expect(await screen.findByText('Jefe: Jefe Andes')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Pacífico' }));
    expect(await screen.findByText(/no tiene una persona activa asignada al rol de jefe/i)).toBeInTheDocument();
    expect(screen.queryByText('Jefe: Jefe Andes')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Empleado' }));
    expect(await screen.findByText('Empleado: Empleada Pacífico')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'RRHH' }));
    expect(await screen.findByText('RRHH: Admin Pacífico')).toBeInTheDocument();
  });
});
