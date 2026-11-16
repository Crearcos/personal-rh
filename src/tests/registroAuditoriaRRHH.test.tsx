import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { RegistroAuditoriaRRHH } from '../components/RegistroAuditoriaRRHH';
import type { Empleado, RegistroActividad } from '../types/models';

const empleados = [{ id: 'e1', usuario_id: 'u1', nombre: 'Ana Torres' }] as Empleado[];
const actividades = [
  { id: 'a1', usuario_id: 'u1', accion: 'SOLICITUD_CREADA', detalle: 'Solicitud de vacaciones', fecha: '2026-10-01T12:00:00Z' },
  { id: 'a2', usuario_id: null, accion: 'SOLICITUD_APROBADA', detalle: 'Resolución de ausencia', fecha: '2026-10-02T12:00:00Z' },
] as RegistroActividad[];

describe('registro de auditoría de RRHH', () => {
  it('muestra la cuenta autenticada en los eventos nuevos y permite buscarla', () => {
    const nuevos = [{ id: 'a4', usuario_id: null, actor_auth_id: 'id-auth', actor_email: 'cuenta@demo.test', accion: 'SOLICITUD_CREADA', detalle: 'Registro pendiente', fecha: '2026-10-02T12:00:00Z' }] as RegistroActividad[];
    render(<RegistroAuditoriaRRHH actividades={nuevos} empleados={empleados} />);
    expect(screen.getByText('Cuenta: cuenta@demo.test')).toBeInTheDocument();
    fireEvent.change(screen.getByRole('searchbox', { name: /buscar en actividad/i }), { target: { value: 'cuenta@demo.test' } });
    expect(screen.getByText('Registro pendiente')).toBeInTheDocument();
  });
  it('identifica a la persona cuando existe y muestra una alternativa cuando no', () => {
    render(<RegistroAuditoriaRRHH actividades={actividades} empleados={empleados} />);
    expect(screen.getByText('Ana Torres')).toBeInTheDocument();
    expect(screen.getByText('Usuario no identificado')).toBeInTheDocument();
    expect(screen.getAllByText('Solicitud creada').length).toBeGreaterThan(0);
  });
  it('filtra por búsqueda y permite limpiar el filtro', () => {
    render(<RegistroAuditoriaRRHH actividades={actividades} empleados={empleados} />);
    fireEvent.change(screen.getByRole('searchbox', { name: /buscar en actividad/i }), { target: { value: 'ana' } });
    expect(screen.getByText('Solicitud de vacaciones')).toBeInTheDocument();
    expect(screen.queryByText('Resolución de ausencia')).not.toBeInTheDocument();
    fireEvent.change(screen.getByRole('searchbox', { name: /buscar en actividad/i }), { target: { value: 'sin coincidencias' } });
    expect(screen.getByText('No hay actividades que coincidan con la búsqueda.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Limpiar filtros de actividad' }));
    expect(screen.getByText('Resolución de ausencia')).toBeInTheDocument();
  });
  it('muestra el nombre del colaborador en eventos de evaluación y saldo', () => {
    const saldo = [{ id: 'a3', usuario_id: null, accion: 'SALDO_ACTUALIZADO', detalle: 'Saldo de vacaciones del colaborador e1, año 2026', fecha: '2026-10-02T12:00:00Z' }] as RegistroActividad[];
    render(<RegistroAuditoriaRRHH actividades={saldo} empleados={empleados} />);
    expect(screen.getByText('Saldo de vacaciones del colaborador Ana Torres, año 2026')).toBeInTheDocument();
  });
});
