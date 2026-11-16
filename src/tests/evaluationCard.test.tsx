import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EvaluationCard } from '../components/EvaluationCard';
import type { Evaluacion } from '../types/models';

const crearEvaluacion = (puntaje: number): Evaluacion => ({
  id: `eval-${puntaje}`,
  empresa_id: 'emp_1',
  empleado_id: 'e1',
  evaluador_id: 'j1',
  periodo: '2026-Q1',
  puntaje_total: puntaje,
  comentarios: 'Seguimiento trimestral de desempeño.',
  estado: 'completada',
  created_at: '',
});

describe('EvaluationCard', () => {
  it.each([
    { puntaje: 65, nivel: 'Bajo', haloClass: 'bg-rose-300/45' },
    { puntaje: 69, nivel: 'Bajo', haloClass: 'bg-rose-300/45' },
    { puntaje: 70, nivel: 'Regular', haloClass: 'bg-amber-200/55' },
    { puntaje: 79, nivel: 'Regular', haloClass: 'bg-amber-200/55' },
    { puntaje: 80, nivel: 'Bueno', haloClass: 'bg-sky-200/55' },
    { puntaje: 89, nivel: 'Bueno', haloClass: 'bg-sky-200/55' },
    { puntaje: 90, nivel: 'Excelente', haloClass: 'bg-[#a8ffa1]/50' },
  ])('muestra la categoría $nivel y su halo $haloClass para puntaje $puntaje', ({ puntaje, nivel, haloClass }) => {
    const { container } = render(<EvaluationCard evaluacion={crearEvaluacion(puntaje)} isLatest={true} />);
    expect(screen.getByText(nivel)).toBeInTheDocument();
    const halo = container.querySelector('[aria-hidden="true"]');
    expect(halo).not.toBeNull();
    expect(halo?.classList.contains(haloClass)).toBe(true);
    expect(halo?.classList.contains('pointer-events-none')).toBe(true);
  });

  it('mantiene el halo suavizado cuando la tarjeta es histórica', () => {
    const { container } = render(<EvaluationCard evaluacion={crearEvaluacion(68)} isLatest={false} />);
    expect(screen.getByText('Histórico')).toBeInTheDocument();
    expect(screen.getByText('Bajo')).toBeInTheDocument();
    const halo = container.querySelector('[aria-hidden="true"]');
    expect(halo?.classList.contains('bg-rose-300/45')).toBe(true);
    expect(halo?.classList.contains('opacity-65')).toBe(true);
  });
});
