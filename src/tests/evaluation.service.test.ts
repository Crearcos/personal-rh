import { describe, it, expect } from 'vitest';
import { calculateWeightedEvaluationScore } from '../services/evaluation.service';
import type { CriterioEvaluacion } from '../types/models';

describe('Evaluation Service (Codex Business Logic)', () => {
  const criteriosMock: CriterioEvaluacion[] = [
    { id: 'crit_1', empresa_id: 'emp_andes', nombre: 'Cumplimiento', peso: 0.4, activo: true, created_at: '' },
    { id: 'crit_2', empresa_id: 'emp_andes', nombre: 'Trabajo en Equipo', peso: 0.3, activo: true, created_at: '' },
    { id: 'crit_3', empresa_id: 'emp_andes', nombre: 'Iniciativa', peso: 0.3, activo: true, created_at: '' },
  ];

  it('calcula la ponderación correcta para puntajes altos (Excelente)', () => {
    const respuestas = [
      { criterioId: 'crit_1', puntaje: 95 },
      { criterioId: 'crit_2', puntaje: 90 },
      { criterioId: 'crit_3', puntaje: 90 },
    ];

    // (95*0.4 + 90*0.3 + 90*0.3) = 38 + 27 + 27 = 92
    const res = calculateWeightedEvaluationScore(criteriosMock, respuestas);
    expect(res.puntajeTotal).toBe(92);
    expect(res.desempenoNivel).toBe('Excelente');
  });

  it('asigna el nivel "Bueno" para calificaciones entre 80 y 89', () => {
    const respuestas = [
      { criterioId: 'crit_1', puntaje: 85 },
      { criterioId: 'crit_2', puntaje: 80 },
      { criterioId: 'crit_3', puntaje: 85 },
    ];

    const res = calculateWeightedEvaluationScore(criteriosMock, respuestas);
    expect(res.puntajeTotal).toBe(83.5);
    expect(res.desempenoNivel).toBe('Bueno');
  });

  it('asigna el nivel "Regular" para calificaciones entre 70 y 79', () => {
    const respuestas = [
      { criterioId: 'crit_1', puntaje: 70 },
      { criterioId: 'crit_2', puntaje: 75 },
      { criterioId: 'crit_3', puntaje: 72 },
    ];

    const res = calculateWeightedEvaluationScore(criteriosMock, respuestas);
    expect(res.desempenoNivel).toBe('Regular');
  });

  it('asigna el nivel "Bajo" para calificaciones menores a 70', () => {
    const respuestas = [
      { criterioId: 'crit_1', puntaje: 50 },
      { criterioId: 'crit_2', puntaje: 60 },
      { criterioId: 'crit_3', puntaje: 55 },
    ];

    const res = calculateWeightedEvaluationScore(criteriosMock, respuestas);
    expect(res.desempenoNivel).toBe('Bajo');
  });

  it('retorna 0 y "Bajo" de forma segura si no hay criterios o respuestas', () => {
    const res = calculateWeightedEvaluationScore([], []);
    expect(res.puntajeTotal).toBe(0);
    expect(res.desempenoNivel).toBe('Bajo');
  });
});

