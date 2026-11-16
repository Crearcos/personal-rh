import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { DetalleEvaluacion } from '../components/DetalleEvaluacion';
import { fetchRespuestasEvaluacion } from '../services/repository';
import type { CriterioEvaluacion, RespuestaEvaluacion } from '../types/models';

vi.mock('../services/repository', () => ({ fetchRespuestasEvaluacion: vi.fn() }));

const criterios = [
  { id: 'c1', nombre: 'Trabajo en equipo', peso: 0.3 },
  { id: 'c2', nombre: 'Comunicación', peso: 0.7 },
] as CriterioEvaluacion[];

const respuestas = [
  { id: 'r1', evaluacion_id: 'eval1', criterio_id: 'c1', puntaje: 85, comentario: 'Colabora con el equipo' },
  { id: 'r2', evaluacion_id: 'eval1', criterio_id: 'c2', puntaje: 70, comentario: null },
] as RespuestaEvaluacion[];

describe('DetalleEvaluacion', () => {
  beforeEach(() => vi.resetAllMocks());

  it('carga las respuestas de la evaluación y muestra cada nota y comentario', async () => {
    vi.mocked(fetchRespuestasEvaluacion).mockResolvedValue({ success: true, data: respuestas });
    render(<DetalleEvaluacion evaluacionId="eval1" empresaId="emp1" empleadoId="e1" criterios={criterios} />);
    expect(await screen.findByText('Trabajo en equipo')).toBeInTheDocument();
    expect(fetchRespuestasEvaluacion).toHaveBeenCalledWith('eval1', 'emp1', 'e1');
    expect(screen.getByText('Colabora con el equipo')).toBeInTheDocument();
    expect(screen.getByText('Sin comentario para este criterio')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Trabajo en equipo: 85 de 100 puntos' })).toBeInTheDocument();
  });

  it('asigna un color distintivo y halo decorativo a cada criterio sin colisiones', async () => {
    const criteriosEmpresa = [
      { id: 'crit_1', nombre: 'Cumplimiento de Objetivos', peso: 0.35 },
      { id: 'crit_2', nombre: 'Trabajo en Equipo y Comunicación', peso: 0.25 },
      { id: 'crit_3', nombre: 'Iniciativa y Resolución de Problemas', peso: 0.2 },
      { id: 'crit_4', nombre: 'Puntualidad y Compromiso', peso: 0.2 },
    ] as CriterioEvaluacion[];
    const respuestasEmpresa = [
      { id: 'r1', evaluacion_id: 'eval1', criterio_id: 'crit_1', puntaje: 83, comentario: 'Cumple metas' },
      { id: 'r2', evaluacion_id: 'eval1', criterio_id: 'crit_2', puntaje: 83, comentario: 'Buen apoyo' },
      { id: 'r3', evaluacion_id: 'eval1', criterio_id: 'crit_3', puntaje: 83, comentario: 'Proactivo' },
      { id: 'r4', evaluacion_id: 'eval1', criterio_id: 'crit_4', puntaje: 100, comentario: 'Excelente' },
    ] as RespuestaEvaluacion[];

    vi.mocked(fetchRespuestasEvaluacion).mockResolvedValue({ success: true, data: respuestasEmpresa });
    const { container } = render(
      <DetalleEvaluacion evaluacionId="eval1" empresaId="emp_andes" empleadoId="emp_juan" criterios={criteriosEmpresa} />
    );

    expect(await screen.findByText('Cumplimiento de Objetivos')).toBeInTheDocument();
    const heading = screen.getByRole('heading', { name: 'Resultados por criterio' });
    expect(heading.closest('.rounded-3xl')).toBeNull();
    expect(screen.getByText('4 criterios')).toBeInTheDocument();
    expect(screen.getByText('Peso en el ciclo: 35%')).toBeInTheDocument();
    expect(screen.getByText('Peso en el ciclo: 25%')).toBeInTheDocument();

    const items = Array.from(container.querySelectorAll('li[data-criterion-color]'));
    expect(items).toHaveLength(4);
    const colores = items.map((item) => item.getAttribute('data-criterion-color'));
    expect(new Set(colores).size).toBe(4);
    expect(colores).toEqual(['periwinkle', 'sky', 'mint', 'amber']);

    const halos = Array.from(container.querySelectorAll('[aria-hidden="true"]')).filter(
      (el) => el.classList.contains('pointer-events-none') && (el.classList.contains('blur-2xl') || el.classList.contains('blur-3xl'))
    );
    expect(halos.length).toBeGreaterThanOrEqual(5);
  });

  it('asigna colores distintos incluso cuando criterios personalizados comparten temática', async () => {
    vi.mocked(fetchRespuestasEvaluacion).mockResolvedValue({ success: true, data: respuestas });
    const { container } = render(
      <DetalleEvaluacion evaluacionId="eval1" empresaId="emp1" empleadoId="e1" criterios={criterios} />
    );
    await screen.findByText('Trabajo en equipo');
    const items = Array.from(container.querySelectorAll('li[data-criterion-color]'));
    expect(items).toHaveLength(2);
    const colores = items.map((item) => item.getAttribute('data-criterion-color'));
    expect(new Set(colores).size).toBe(2);
  });

  it('calcula los pesos históricos solo con los criterios respondidos en esa evaluación', async () => {
    vi.mocked(fetchRespuestasEvaluacion).mockResolvedValue({ success: true, data: respuestas });
    const criteriosConPosteriores = [...criterios, { id: 'c3', nombre: 'Criterio de un ciclo posterior', peso: 1 }] as CriterioEvaluacion[];
    render(<DetalleEvaluacion evaluacionId="eval1" empresaId="emp1" empleadoId="e1" criterios={criteriosConPosteriores} />);
    expect(await screen.findByText('Peso en el ciclo: 30%')).toBeInTheDocument();
    expect(screen.getByText('Peso en el ciclo: 70%')).toBeInTheDocument();
  });

  it('explica cuándo no existen respuestas registradas', async () => {
    vi.mocked(fetchRespuestasEvaluacion).mockResolvedValue({ success: true, data: [] });
    render(<DetalleEvaluacion evaluacionId="eval1" empresaId="emp1" empleadoId="e1" criterios={criterios} />);
    expect(await screen.findByText('Esta evaluación no tiene detalle por criterio registrado.')).toBeInTheDocument();
  });

  it('permite reintentar cuando falla la carga', async () => {
    vi.mocked(fetchRespuestasEvaluacion)
      .mockResolvedValueOnce({ success: false, error: 'error' })
      .mockResolvedValueOnce({ success: true, data: respuestas });
    render(<DetalleEvaluacion evaluacionId="eval1" empresaId="emp1" empleadoId="e1" criterios={criterios} />);
    expect(await screen.findByText('No pudimos cargar el detalle de esta evaluación.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
    expect(await screen.findByText('Colabora con el equipo')).toBeInTheDocument();
  });
});
