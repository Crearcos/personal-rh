import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { EvaluacionesEmpleado } from '../components/EvaluacionesEmpleado';
import { fetchRespuestasEvaluacion } from '../services/repository';
import type { CriterioEvaluacion, Evaluacion, RespuestaEvaluacion } from '../types/models';

vi.mock('../services/repository', () => ({ fetchRespuestasEvaluacion: vi.fn() }));

const criterios = [
  { id: 'crit_1', nombre: 'Cumplimiento de Objetivos', peso: 0.5 },
  { id: 'crit_2', nombre: 'Iniciativa y Resolución de Problemas', peso: 0.5 },
] as CriterioEvaluacion[];

const evaluaciones = [
  {
    id: 'eval_reciente',
    empresa_id: 'emp_1',
    empleado_id: 'e1',
    evaluador_id: 'j1',
    periodo: '2026-Q1',
    puntaje_total: 92,
    comentarios: 'Gran cierre de trimestre.',
    estado: 'completada',
    created_at: '2026-04-01T10:00:00Z',
  },
  {
    id: 'eval_anterior',
    empresa_id: 'emp_1',
    empleado_id: 'e1',
    evaluador_id: 'j1',
    periodo: '2025-Q4',
    puntaje_total: 81,
    comentarios: 'Progreso constante.',
    estado: 'completada',
    created_at: '2026-01-10T10:00:00Z',
  },
] as Evaluacion[];

const respuestasBase = [
  { id: 'r1', evaluacion_id: 'eval_reciente', criterio_id: 'crit_1', puntaje: 94, comentario: 'Superó meta' },
  { id: 'r2', evaluacion_id: 'eval_reciente', criterio_id: 'crit_2', puntaje: 90, comentario: 'Buena iniciativa' },
] as RespuestaEvaluacion[];

describe('EvaluacionesEmpleado', () => {
  beforeEach(() => vi.resetAllMocks());

  it('muestra un estado vacío sobrio con halo decorativo cuando no hay evaluaciones', () => {
    const { container } = render(
      <EvaluacionesEmpleado evaluaciones={[]} empresaId="emp_1" empleadoId="e1" criterios={criterios} />
    );

    expect(screen.getByText('Sin evaluaciones registradas')).toBeInTheDocument();
    expect(screen.getByText('0 registros')).toBeInTheDocument();
    const halo = container.querySelector('[aria-hidden="true"].blur-2xl');
    expect(halo).not.toBeNull();
    expect(halo?.classList.contains('pointer-events-none')).toBe(true);
  });

  it('muestra la evaluación más reciente con criterios coloreados y permite desplegar el historial sin transition-all', async () => {
    vi.mocked(fetchRespuestasEvaluacion).mockImplementation(async (evaluacionId) => ({
      success: true,
      data: evaluacionId === 'eval_reciente'
        ? respuestasBase
        : [
            { id: 'r3', evaluacion_id: 'eval_anterior', criterio_id: 'crit_1', puntaje: 80, comentario: 'Cumplimiento histórico estable' },
          ] as RespuestaEvaluacion[],
    }));

    render(
      <EvaluacionesEmpleado evaluaciones={evaluaciones} empresaId="emp_1" empleadoId="e1" criterios={criterios} />
    );

    const mainHeading = screen.getByRole('heading', { level: 2, name: 'Evaluación de Desempeño' });
    const criteriaHeading = screen.getByRole('heading', { level: 3, name: 'Resultados por criterio' });
    expect(mainHeading.closest('.rounded-3xl')).toBeNull();
    expect(criteriaHeading.closest('.rounded-3xl')).toBeNull();
    expect(mainHeading.classList.contains('text-base')).toBe(true);
    expect(criteriaHeading.classList.contains('text-base')).toBe(true);
    expect(screen.getByText('Última de 2')).toBeInTheDocument();
    expect(screen.getByText('Excelente')).toBeInTheDocument();
    expect(await screen.findByText('Superó meta')).toBeInTheDocument();

    const toggleButton = screen.getByRole('button', { name: /ver evaluaciones anteriores/i });
    expect(toggleButton).toHaveAttribute('aria-expanded', 'false');
    expect(toggleButton.classList.contains('transition-all')).toBe(false);
    expect(toggleButton.classList.contains('min-h-[44px]')).toBe(true);

    fireEvent.click(toggleButton);
    expect(toggleButton).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Histórico')).toBeInTheDocument();
    expect(screen.getByText('Ciclo 2025-Q4')).toBeInTheDocument();
    expect(await screen.findByText('Cumplimiento histórico estable')).toBeInTheDocument();
  });
});
