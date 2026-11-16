import type { CriterioEvaluacion, EvaluacionScoreSummary } from '../types/models';

export interface EvaluacionItemInput {
  criterioId: string;
  puntaje: number;
}

/**
 * Calcula el puntaje total ponderado y el nivel de desempeño
 */
export function calculateWeightedEvaluationScore(
  criterios: readonly CriterioEvaluacion[],
  respuestas: readonly EvaluacionItemInput[]
): EvaluacionScoreSummary {
  if (criterios.length === 0 || respuestas.length === 0) {
    return { puntajeTotal: 0, desempenoNivel: 'Bajo' };
  }

  let sumaPonderada = 0;
  let pesoTotal = 0;

  for (const resp of respuestas) {
    const criterio = criterios.find((c) => c.id === resp.criterioId);
    if (!criterio) continue;

    const peso = Number(criterio.peso);
    const puntajeClamped = Math.min(100, Math.max(0, resp.puntaje));

    sumaPonderada += puntajeClamped * peso;
    pesoTotal += peso;
  }

  if (pesoTotal <= 0) {
    return { puntajeTotal: 0, desempenoNivel: 'Bajo' };
  }

  const puntajeFinal = Number((sumaPonderada / pesoTotal).toFixed(2));

  let desempenoNivel: EvaluacionScoreSummary['desempenoNivel'] = 'Bajo';
  if (puntajeFinal >= 90) {
    desempenoNivel = 'Excelente';
  } else if (puntajeFinal >= 80) {
    desempenoNivel = 'Bueno';
  } else if (puntajeFinal >= 70) {
    desempenoNivel = 'Regular';
  }

  return {
    puntajeTotal: puntajeFinal,
    desempenoNivel,
  };
}

