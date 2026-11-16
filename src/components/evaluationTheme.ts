import type { CriterioEvaluacion, EvaluacionScoreSummary } from '../types/models';

export type EvaluationNivel = EvaluacionScoreSummary['desempenoNivel'];
export type CriterionPaletteKey = 'periwinkle' | 'sky' | 'mint' | 'amber' | 'teal';

export interface EvaluationTierTheme {
  nivel: EvaluationNivel;
  halo: string;
  cardBorder: string;
  badge: string;
  iconColor: string;
  textStrong: string;
  track: string;
  bar: string;
  sliderAccent: string;
}

export interface CriterionTheme {
  key: CriterionPaletteKey;
  halo: string;
  dot: string;
  badge: string;
  track: string;
  bar: string;
  accentText: string;
}

const EVALUATION_TIERS: Record<EvaluationNivel, EvaluationTierTheme> = {
  Bajo: {
    nivel: 'Bajo',
    halo: 'bg-rose-300/45',
    cardBorder: 'border-rose-200/90',
    badge: 'bg-rose-100 text-rose-900 border-rose-200',
    iconColor: 'text-rose-800',
    textStrong: 'text-rose-950',
    track: 'bg-rose-100',
    bar: 'bg-gradient-to-r from-rose-300 to-rose-500',
    sliderAccent: 'accent-rose-600',
  },
  Regular: {
    nivel: 'Regular',
    halo: 'bg-amber-200/55',
    cardBorder: 'border-amber-200/90',
    badge: 'bg-amber-100 text-amber-950 border-amber-200',
    iconColor: 'text-amber-800',
    textStrong: 'text-amber-950',
    track: 'bg-amber-100',
    bar: 'bg-gradient-to-r from-amber-300 to-amber-500',
    sliderAccent: 'accent-amber-600',
  },
  Bueno: {
    nivel: 'Bueno',
    halo: 'bg-sky-200/55',
    cardBorder: 'border-sky-200/90',
    badge: 'bg-sky-100 text-sky-900 border-sky-200',
    iconColor: 'text-sky-800',
    textStrong: 'text-sky-950',
    track: 'bg-sky-100',
    bar: 'bg-gradient-to-r from-sky-300 to-sky-500',
    sliderAccent: 'accent-sky-600',
  },
  Excelente: {
    nivel: 'Excelente',
    halo: 'bg-[#a8ffa1]/50',
    cardBorder: 'border-[#86e27f]/80',
    badge: 'bg-[#a8ffa1] text-[#004828] border-[#86e27f]',
    iconColor: 'text-[#004828]',
    textStrong: 'text-[#003820]',
    track: 'bg-emerald-100',
    bar: 'bg-gradient-to-r from-[#a8ffa1] to-[#5ec942]',
    sliderAccent: 'accent-[#008262]',
  },
};

export function resolveEvaluationNivel(puntaje: number): EvaluationNivel {
  if (puntaje >= 90) return 'Excelente';
  if (puntaje >= 80) return 'Bueno';
  if (puntaje >= 70) return 'Regular';
  return 'Bajo';
}

export function getEvaluationTier(puntaje: number, nivel?: EvaluationNivel): EvaluationTierTheme {
  const resolved = nivel ?? resolveEvaluationNivel(puntaje);
  return EVALUATION_TIERS[resolved];
}

const CRITERION_THEMES: Record<CriterionPaletteKey, CriterionTheme> = {
  periwinkle: {
    key: 'periwinkle',
    halo: 'bg-[#aaaaff]/35',
    dot: 'bg-[#5b5be6]',
    badge: 'bg-[#eeeeff] text-[#302866] border-[#d6d6ff]',
    track: 'bg-[#f0f0ff]',
    bar: 'bg-gradient-to-r from-[#aaaaff] to-[#5b5be6]',
    accentText: 'text-[#37316a]',
  },
  sky: {
    key: 'sky',
    halo: 'bg-sky-200/45',
    dot: 'bg-[#0284c7]',
    badge: 'bg-sky-50 text-[#005266] border-sky-200',
    track: 'bg-sky-50',
    bar: 'bg-gradient-to-r from-sky-300 to-[#0284c7]',
    accentText: 'text-[#005266]',
  },
  mint: {
    key: 'mint',
    halo: 'bg-[#a8ffa1]/40',
    dot: 'bg-[#00a379]',
    badge: 'bg-emerald-50 text-[#004828] border-[#9be894]',
    track: 'bg-emerald-50',
    bar: 'bg-gradient-to-r from-[#a8ffa1] to-[#00a379]',
    accentText: 'text-[#004828]',
  },
  amber: {
    key: 'amber',
    halo: 'bg-amber-200/45',
    dot: 'bg-amber-600',
    badge: 'bg-amber-50 text-amber-950 border-amber-200',
    track: 'bg-amber-50',
    bar: 'bg-gradient-to-r from-amber-300 to-amber-600',
    accentText: 'text-amber-900',
  },
  teal: {
    key: 'teal',
    halo: 'bg-teal-200/45',
    dot: 'bg-teal-700',
    badge: 'bg-teal-50 text-teal-950 border-teal-200',
    track: 'bg-teal-50',
    bar: 'bg-gradient-to-r from-teal-300 to-teal-600',
    accentText: 'text-teal-900',
  },
};

const CRITERION_ORDER: readonly CriterionPaletteKey[] = ['periwinkle', 'sky', 'mint', 'amber', 'teal'];

function matchCriterionKey(nombre: string): CriterionPaletteKey | null {
  const limpio = nombre.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  if (/(objetiv|meta|desempeno|productiv|resultado)/.test(limpio)) return 'periwinkle';
  if (/(equipo|comunica|cliente|servicio|colabora)/.test(limpio)) return 'sky';
  if (/(iniciativa|resolucion|problema|proactiv|innov|creativ)/.test(limpio)) return 'mint';
  if (/(puntualidad|compromiso|responsab|asistencia|etica)/.test(limpio)) return 'amber';
  return null;
}

export function getCriterionThemeByIndex(index: number): CriterionTheme {
  const key = CRITERION_ORDER[index % CRITERION_ORDER.length];
  return CRITERION_THEMES[key];
}

export function assignCriterionThemes(criterios: readonly CriterioEvaluacion[]): Map<string, CriterionTheme> {
  const mapa = new Map<string, CriterionTheme>();
  const usados = new Set<CriterionPaletteKey>();

  criterios.forEach((criterio, index) => {
    const preferido = matchCriterionKey(criterio.nombre);
    const disponible = CRITERION_ORDER.find((key) => !usados.has(key));
    const elegido =
      preferido && !usados.has(preferido)
        ? preferido
        : disponible ?? CRITERION_ORDER[index % CRITERION_ORDER.length];
    usados.add(elegido);
    mapa.set(criterio.id, CRITERION_THEMES[elegido]);
  });

  return mapa;
}

