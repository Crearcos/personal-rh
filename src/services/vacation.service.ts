import type { SaldoVacaciones, Solicitud, SolicitudValidationResult } from '../types/models';

/**
 * Calcula los días calendario inclusivos entre dos fechas ISO (YYYY-MM-DD)
 */
export function calculateVacationDays(fechaDesde: string, fechaHasta: string): number {
  const start = new Date(fechaDesde);
  const end = new Date(fechaHasta);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    throw new Error('Fechas inválidas provistas para el cálculo de vacaciones.');
  }

  if (start > end) {
    throw new Error('La fecha inicial no puede ser posterior a la fecha final.');
  }

  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  return Number(diffDays.toFixed(1));
}

/**
 * Detecta solapamiento entre un rango de fechas y solicitudes existentes
 */
export function hasDateOverlap(
  solicitudesExistentes: readonly Solicitud[],
  nuevaDesde: string,
  nuevaHasta: string,
  ignorarSolicitudId?: string
): boolean {
  const newStart = new Date(nuevaDesde).getTime();
  const newEnd = new Date(nuevaHasta).getTime();

  return solicitudesExistentes.some((sol) => {
    if (sol.id === ignorarSolicitudId) return false;
    if (sol.estado === 'rechazada') return false;

    const solStart = new Date(sol.fecha_desde).getTime();
    const solEnd = new Date(sol.fecha_hasta).getTime();

    // Rango superpuesto si no termina antes ni empieza después
    return newStart <= solEnd && newEnd >= solStart;
  });
}

/**
 * Valida la viabilidad de una solicitud de vacaciones contra el saldo y solapamientos
 */
export function validateVacationRequest(
  saldoActual: SaldoVacaciones | null,
  solicitudesExistentes: readonly Solicitud[],
  fechaDesde: string,
  fechaHasta: string,
  descuentaSaldo: boolean = true
): SolicitudValidationResult {
  let diasCalculados = 0;

  try {
    diasCalculados = calculateVacationDays(fechaDesde, fechaHasta);
  } catch (error) {
    return {
      isValid: false,
      diasCalculados: 0,
      diasDisponibles: saldoActual?.dias_pendientes ?? 0,
      errorMessage: error instanceof Error ? error.message : 'Error al calcular días',
    };
  }

  const diasDisponibles = saldoActual ? Number(saldoActual.dias_pendientes) : 0;

  if (descuentaSaldo && fechaDesde.slice(0, 4) !== fechaHasta.slice(0, 4)) {
    return { isValid: false, diasCalculados, diasDisponibles, errorMessage: 'Registra una solicitud separada por cada año.' };
  }
  if (descuentaSaldo && saldoActual && saldoActual.anio !== Number(fechaDesde.slice(0, 4))) {
    return { isValid: false, diasCalculados, diasDisponibles: 0, errorMessage: 'No está disponible el saldo para el año seleccionado.' };
  }

  if (descuentaSaldo && diasCalculados > diasDisponibles) {
    return {
      isValid: false,
      diasCalculados,
      diasDisponibles,
      errorMessage: `Días solicitados (${diasCalculados}) superan el saldo disponible (${diasDisponibles}).`,
    };
  }

  if (hasDateOverlap(solicitudesExistentes, fechaDesde, fechaHasta)) {
    return {
      isValid: false,
      diasCalculados,
      diasDisponibles,
      errorMessage: 'Ya existe una solicitud pendiente o aprobada en este rango de fechas.',
    };
  }

  return {
    isValid: true,
    diasCalculados,
    diasDisponibles,
  };
}

/**
 * Aplica deducción inmutable de saldo de vacaciones tras aprobación
 */
export function deductVacationBalance(
  saldoActual: SaldoVacaciones,
  diasADescontar: number
): SaldoVacaciones {
  const dias = Math.max(0, diasADescontar);
  const nuevosTomados = Number((Number(saldoActual.dias_tomados) + dias).toFixed(1));
  const nuevosPendientes = Number((Number(saldoActual.dias_derecho) - nuevosTomados).toFixed(1));

  return {
    ...saldoActual,
    dias_tomados: nuevosTomados,
    dias_pendientes: Math.max(0, nuevosPendientes),
  };
}

