import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { ManagerView } from '../views/ManagerView';
import type { CriterioEvaluacion, DemoUserSession, Departamento, Empleado, PeriodoEvaluacion } from '../types/models';

vi.mock('canvas-confetti', () => ({ default: vi.fn() }));

const session: DemoUserSession = {
  usuarioId: 'usr_jefe_ventas',
  empleadoId: 'emp_jefe_ventas',
  nombre: 'Carlos Morales',
  correo: 'carlos.morales@demo.com',
  cargo: 'Jefe de Ventas',
  rol: 'jefe',
  empresaId: 'emp_andes',
  departamentoId: 'dep_ventas',
};

const departamentos = [
  { id: 'dep_ventas', empresa_id: 'emp_andes', nombre: 'Ventas y Comercial', jefe_id: 'emp_jefe_ventas', created_at: '' },
  { id: 'dep_sistemas', empresa_id: 'emp_andes', nombre: 'Sistemas y Tecnología', jefe_id: 'emp_jefe_sistemas', created_at: '' },
] as Departamento[];

const empleados = [
  { id: 'emp_jefe_ventas', empresa_id: 'emp_andes', usuario_id: 'u0', nombre: 'Carlos Morales', cargo: 'Jefe de Ventas', departamento_id: 'dep_ventas', jefe_id: null, fecha_ingreso: '2024-01-01', tipo_contrato: 'Indefinido', activo: true, created_at: '' },
  { id: 'emp_juan', empresa_id: 'emp_andes', usuario_id: 'u1', nombre: 'Juan Carlos Pérez', cargo: 'Ejecutivo de Cuentas', departamento_id: 'dep_ventas', jefe_id: 'emp_jefe_ventas', fecha_ingreso: '2024-02-01', tipo_contrato: 'Indefinido', activo: true, created_at: '' },
  { id: 'emp_diego', empresa_id: 'emp_andes', usuario_id: 'u2', nombre: 'Diego Cueva', cargo: 'Desarrollador Junior', departamento_id: 'dep_sistemas', jefe_id: 'emp_jefe_sistemas', fecha_ingreso: '2024-03-01', tipo_contrato: 'Indefinido', activo: true, created_at: '' },
] as Empleado[];

const criterios = [
  { id: 'c1', empresa_id: 'emp_andes', nombre: 'Cumplimiento', peso: 1, created_at: '' },
] as CriterioEvaluacion[];
const periodos = [{ id: 'p1', empresa_id: 'emp_andes', nombre: '2026-Q1', estado: 'abierto', fecha_inicio: null, fecha_fin: null, created_at: '' }, { id: 'p2', empresa_id: 'emp_andes', nombre: '2025-Q4', estado: 'cerrado', fecha_inicio: null, fecha_fin: null, created_at: '' }] as PeriodoEvaluacion[];

describe('ManagerView - Selección de colaboradores en Evaluación', () => {
  it('permite evaluar únicamente a colaboradores asignados al jefe', async () => {
    const onSubmitEvaluacion = vi.fn().mockResolvedValue(true);
    render(
      <ManagerView
        session={session}
        solicitudes={[]}
        empleados={[...empleados, { ...empleados[2], id: 'otro_equipo', nombre: 'Otra Persona', departamento_id: 'dep_ventas' }]}
        departamentos={departamentos}
        tiposSolicitud={[]}
        criterios={criterios}
        periodos={periodos}
        evaluaciones={[]}
        onResolveSolicitud={vi.fn()}
        onSubmitEvaluacion={onSubmitEvaluacion}
      />
    );

    expect(screen.getByText('Tu Equipo').previousElementSibling?.textContent).toBe('1');
    fireEvent.click(screen.getByRole('button', { name: /evaluación/i }));
    expect(screen.getByText('1 disponible')).toBeInTheDocument();

    const selector = screen.getByRole('button', { name: 'Seleccionar colaborador del equipo' });
    fireEvent.click(selector);
    expect(screen.queryByRole('button', { name: /diego cueva/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /otra persona/i })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /juan carlos pérez/i }));
    expect(within(selector).getByText('Juan Carlos Pérez')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /guardar y publicar evaluación/i }));
    await waitFor(() => {
      expect(onSubmitEvaluacion).toHaveBeenCalledWith(
        'emp_juan',
        '2026-Q1',
        85,
        [{ criterio_id: 'c1', puntaje: 85, comentario: 'Cumplimiento adecuado del criterio según metas acordadas.' }]
      );
    });
  });

  it('mantiene el formulario visible y comunica un error al fallar el guardado', async () => {
    render(<ManagerView session={session} solicitudes={[]} empleados={empleados} departamentos={departamentos} tiposSolicitud={[]} criterios={criterios} periodos={periodos} evaluaciones={[]} onResolveSolicitud={vi.fn()} onSubmitEvaluacion={vi.fn().mockResolvedValue(false)} />);
    fireEvent.click(screen.getByRole('button', { name: /evaluación/i }));
    fireEvent.click(screen.getByRole('button', { name: /guardar y publicar evaluación/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent('No se pudo guardar');
    expect(screen.getByRole('button', { name: /guardar y publicar evaluación/i })).toBeInTheDocument();
  });

  it('solo ofrece períodos abiertos y bloquea el envío si no existe ninguno', () => {
    const base = { session, solicitudes: [], empleados, departamentos, tiposSolicitud: [], criterios, evaluaciones: [], onResolveSolicitud: vi.fn(), onSubmitEvaluacion: vi.fn() };
    const { rerender } = render(<ManagerView {...base} periodos={periodos} />);
    fireEvent.click(screen.getByRole('button', { name: /evaluación/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Seleccionar período de evaluación' }));
    expect(screen.queryByText('2025-Q4')).not.toBeInTheDocument();
    rerender(<ManagerView {...base} periodos={[periodos[1]]} />);
    expect(screen.getByText('No hay períodos abiertos para evaluar. Contacta a RR. HH.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /guardar y publicar evaluación/i })).toBeDisabled();
  });

  it('distingue un error de carga de la ausencia de períodos', () => {
    const reintentar = vi.fn();
    render(<ManagerView session={session} solicitudes={[]} empleados={empleados} departamentos={departamentos} tiposSolicitud={[]} criterios={criterios} periodos={[]} errorPeriodos onReintentarPeriodos={reintentar} evaluaciones={[]} onResolveSolicitud={vi.fn()} onSubmitEvaluacion={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /evaluación/i }));
    expect(screen.getByRole('alert')).toHaveTextContent('No pudimos cargar los períodos');
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
    expect(reintentar).toHaveBeenCalled();
    expect(screen.getByRole('button', { name: /guardar y publicar evaluación/i })).toBeDisabled();
  });

  it('reajusta el colaborador seleccionado al cambiar los datos de la empresa', () => {
    const { rerender } = render(
      <ManagerView
        session={session}
        solicitudes={[]}
        empleados={empleados}
        departamentos={departamentos}
        tiposSolicitud={[]}
        criterios={criterios}
        evaluaciones={[]}
        onResolveSolicitud={vi.fn()}
        onSubmitEvaluacion={vi.fn()}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /evaluación/i }));
    expect(within(screen.getByRole('button', { name: 'Seleccionar colaborador del equipo' })).getByText('Juan Carlos Pérez')).toBeInTheDocument();

    const empleadosPacifico = [
      { ...empleados[0], id: 'emp_pac_1', empresa_id: 'emp_pacifico', nombre: 'Rosa Andrade', departamento_id: 'dep_pac', jefe_id: session.empleadoId },
    ];
    rerender(
      <ManagerView
        session={{ ...session, empresaId: 'emp_pacifico' }}
        solicitudes={[]}
        empleados={empleadosPacifico}
        departamentos={[]}
        tiposSolicitud={[]}
        criterios={criterios}
        evaluaciones={[]}
        onResolveSolicitud={vi.fn()}
        onSubmitEvaluacion={vi.fn()}
      />
    );
    expect(within(screen.getByRole('button', { name: 'Seleccionar colaborador del equipo' })).getByText('Rosa Andrade')).toBeInTheDocument();
  });

  it('deshabilita la evaluación y explica si no hay equipo asignado', () => {
    render(<ManagerView session={session} solicitudes={[]} empleados={[empleados[0], empleados[2]]} departamentos={departamentos} tiposSolicitud={[]} criterios={criterios} periodos={periodos} evaluaciones={[]} onResolveSolicitud={vi.fn()} onSubmitEvaluacion={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /evaluación/i }));
    expect(screen.getByText(/no tienes colaboradores asignados/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /guardar y publicar evaluación/i })).toBeDisabled();
  });
});
