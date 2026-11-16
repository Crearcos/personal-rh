import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { OnboardingRRHH } from '../components/OnboardingRRHH';
import type { Departamento, Empleado, OnboardingTarea } from '../types/models';

const empleados = [
  { id: 'e1', nombre: 'Ana Torres', cargo: 'Analista', departamento_id: 'd1', fecha_ingreso: '2026-01-10' },
  { id: 'e2', nombre: 'Luis Vera', cargo: 'Asesor', departamento_id: 'd1', fecha_ingreso: '2026-02-05' },
] as Empleado[];
const tareas = [
  { id: 't1', empleado_id: 'e1', tarea: 'Recibir equipo', responsable: 'Sistemas', fecha_limite: '2026-01-15', estado: 'en_progreso' },
  { id: 't2', empleado_id: 'e1', tarea: 'Conocer equipo', responsable: 'Jefatura', fecha_limite: '2026-01-16', estado: 'completada' },
  { id: 't3', empleado_id: 'e2', tarea: 'Inducción', responsable: 'RRHH', fecha_limite: '2026-02-07', estado: 'pendiente' },
] as OnboardingTarea[];

describe('seguimiento de onboarding', () => {
  it('agrupa por colaborador y muestra su avance real', () => {
    render(<OnboardingRRHH empleados={empleados} departamentos={[]} tareas={tareas} onCambiarEstado={vi.fn()} />);
    expect(screen.getByText('Ana Torres')).toBeInTheDocument();
    expect(screen.getByText('Luis Vera')).toBeInTheDocument();
    expect(screen.getByText('1 de 2 tareas completadas')).toBeInTheDocument();
  });
  it('permite buscar por nombre y consultar los estados y responsables', () => {
    render(<OnboardingRRHH empleados={empleados} departamentos={[]} tareas={tareas} onCambiarEstado={vi.fn()} />);
    fireEvent.change(screen.getByRole('searchbox', { name: /buscar colaborador/i }), { target: { value: 'ana' } });
    expect(screen.queryByText('Luis Vera')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /ver incorporación de Ana Torres/i }));
    const detalle = screen.getByRole('region', { name: /incorporación de Ana Torres/i });
    expect(within(detalle).getByLabelText('Estado de Recibir equipo')).toHaveValue('en_progreso');
    expect(within(detalle).getByText('Sistemas')).toBeInTheDocument();
    expect(within(detalle).getByText('15/01/2026')).toBeInTheDocument();
  });
  it('encuentra personas por departamento y recupera la lista tras una búsqueda sin resultados', () => {
    render(<OnboardingRRHH empleados={empleados} departamentos={[{ id: 'd1', nombre: 'Tecnología' } as Departamento]} tareas={tareas} onCambiarEstado={vi.fn()} />);
    const buscar = screen.getByRole('searchbox', { name: /buscar colaborador/i });
    fireEvent.change(buscar, { target: { value: 'tecnologia' } });
    expect(screen.getByText('Ana Torres')).toBeInTheDocument();
    fireEvent.change(buscar, { target: { value: 'sin coincidencias' } });
    fireEvent.click(screen.getByRole('button', { name: 'Limpiar búsqueda de incorporación' }));
    expect(screen.getByText('Ana Torres')).toBeInTheDocument();
    expect(screen.getByText('Luis Vera')).toBeInTheDocument();
  });
  it('permite cambiar el estado y muestra errores si falla el guardado', async () => {
    const cambiar = vi.fn().mockResolvedValue(false);
    render(<OnboardingRRHH empleados={empleados} departamentos={[]} tareas={tareas} onCambiarEstado={cambiar} />);
    fireEvent.click(screen.getByRole('button', { name: /ver incorporación de Ana Torres/i }));
    fireEvent.change(screen.getByLabelText('Estado de Recibir equipo'), { target: { value: 'completada' } });
    expect(await screen.findByRole('alert')).toHaveTextContent('No se pudo confirmar');
    expect(cambiar).toHaveBeenCalledWith('t1', 'completada');
  });
  it('permite registrar una tarea para un colaborador sin tareas previas', async () => {
    const guardar = vi.fn().mockResolvedValue(true);
    render(<OnboardingRRHH empleados={empleados} departamentos={[]} tareas={tareas.filter(t => t.empleado_id === 'e1')} onCambiarEstado={vi.fn()} onGuardarTarea={guardar} />);
    fireEvent.click(screen.getByRole('button', { name: /nueva tarea/i }));
    fireEvent.change(screen.getByLabelText('Colaborador'), { target: { value: 'e2' } });
    fireEvent.change(screen.getByLabelText('Tarea'), { target: { value: '  Primera inducción  ' } });
    fireEvent.change(screen.getByLabelText('Responsable'), { target: { value: 'RRHH' } });
    fireEvent.change(screen.getByLabelText('Fecha límite'), { target: { value: '2026-02-12' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar tarea' }));
    expect(await screen.findByText('Tarea guardada correctamente.')).toBeInTheDocument();
    expect(guardar).toHaveBeenCalledWith(expect.objectContaining({ empleadoId: 'e2', tarea: 'Primera inducción', responsable: 'RRHH', fechaLimite: '2026-02-12' }));
  });
  it('permite editar una tarea existente sin cambiar su colaborador', async () => {
    const guardar = vi.fn().mockResolvedValue(true);
    render(<OnboardingRRHH empleados={empleados} departamentos={[]} tareas={tareas} onCambiarEstado={vi.fn()} onGuardarTarea={guardar} />);
    fireEvent.click(screen.getByRole('button', { name: /ver incorporación de Ana Torres/i }));
    fireEvent.click(screen.getByRole('button', { name: /editar Recibir equipo/i }));
    fireEvent.change(screen.getByLabelText('Tarea'), { target: { value: 'Recibir equipo de trabajo' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));
    expect(await screen.findByText('Tarea guardada correctamente.')).toBeInTheDocument();
    expect(guardar).toHaveBeenCalledWith(expect.objectContaining({ id: 't1', empleadoId: 'e1', tarea: 'Recibir equipo de trabajo' }));
  });
  it('solicita confirmación antes de eliminar una tarea y permite cancelar', async () => {
    const eliminar = vi.fn().mockResolvedValue(true);
    render(<OnboardingRRHH empleados={empleados} departamentos={[]} tareas={tareas} onCambiarEstado={vi.fn()} onEliminarTarea={eliminar} />);
    fireEvent.click(screen.getByRole('button', { name: /ver incorporación de Ana Torres/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Eliminar Recibir equipo' }));
    expect(eliminar).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar eliminación' }));
    expect(eliminar).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Eliminar Recibir equipo' }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar eliminación' }));
    expect(await screen.findByText('Tarea eliminada correctamente.')).toBeInTheDocument();
    expect(eliminar).toHaveBeenCalledWith('t1', 'e1');
  });
  it('informa un error cuando no se puede eliminar', async () => {
    render(<OnboardingRRHH empleados={empleados} departamentos={[]} tareas={tareas} onCambiarEstado={vi.fn()} onEliminarTarea={vi.fn().mockResolvedValue(false)} />);
    fireEvent.click(screen.getByRole('button', { name: /ver incorporación de Ana Torres/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Eliminar Recibir equipo' }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar eliminación' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('No se pudo eliminar');
  });
});
