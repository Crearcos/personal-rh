import React from 'react';
import { AlertCircle, Calendar, Check, Clock } from 'lucide-react';
import type { Evaluacion } from '../types/models';
import { getEvaluationTier, type EvaluationNivel } from './evaluationTheme';

interface EvaluationCardProps {
  evaluacion: Evaluacion;
  isLatest?: boolean;
}

function NivelBadge({ nivel, badge, iconColor }: { nivel: EvaluationNivel; badge: string; iconColor: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-extrabold ${badge}`}>
      {nivel === 'Bajo' && <AlertCircle aria-hidden="true" className={`h-3.5 w-3.5 stroke-[2.5] ${iconColor}`} />}
      {nivel === 'Regular' && <Clock aria-hidden="true" className={`h-3.5 w-3.5 stroke-[2.5] ${iconColor}`} />}
      {(nivel === 'Bueno' || nivel === 'Excelente') && (
        <Check aria-hidden="true" className={`h-3.5 w-3.5 stroke-[2.75] ${iconColor}`} />
      )}
      <span>{nivel}</span>
    </span>
  );
}

function CabeceraEvaluacion({ periodo, isLatest, nivel, badge, iconColor }: {
  periodo: string; isLatest: boolean; nivel: EvaluationNivel; badge: string; iconColor: string;
}) {
  return (
    <div className="relative flex items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-bold text-slate-800">
          <Calendar aria-hidden="true" className="h-3.5 w-3.5 text-slate-500" />
          <span>Ciclo {periodo}</span>
        </span>
        <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold tracking-tight ${
          isLatest ? 'bg-slate-900 font-extrabold text-white' : 'bg-slate-100 text-slate-700'
        }`}>
          {isLatest ? 'Última' : 'Histórico'}
        </span>
      </div>
      <NivelBadge nivel={nivel} badge={badge} iconColor={iconColor} />
    </div>
  );
}

export const EvaluationCard: React.FC<EvaluationCardProps> = ({ evaluacion, isLatest = false }) => {
  const puntaje = Number(evaluacion.puntaje_total || 0);
  const tier = getEvaluationTier(puntaje);
  const escala = Math.max(0, Math.min(100, puntaje)) / 100;
  return (
    <div className={`relative overflow-hidden rounded-3xl border bg-white p-5 transition-colors duration-200 ${
      isLatest ? `${tier.cardBorder} shadow-soft` : 'border-slate-200/90 shadow-soft opacity-95'
    }`}>
      <div aria-hidden="true" className={`pointer-events-none absolute -top-10 -right-10 h-36 w-36 rounded-full blur-2xl transition-colors duration-300 ${tier.halo} ${isLatest ? '' : 'opacity-65'}`} />
      <CabeceraEvaluacion periodo={evaluacion.periodo} isLatest={isLatest} nivel={tier.nivel} badge={tier.badge} iconColor={tier.iconColor} />
      <div className="relative mt-4 mb-2 flex items-baseline gap-2">
        <span className={`${isLatest ? 'text-4xl' : 'text-3xl'} font-black tracking-tight tabular-nums ${tier.textStrong}`}>
          {puntaje.toFixed(1)}
        </span>
        <span className="text-xs font-bold text-slate-600">/ 100 pts ponderados</span>
      </div>
      <div className={`relative mb-3 w-full overflow-hidden rounded-full ${isLatest ? 'h-2' : 'h-1.5'} ${tier.track}`} aria-hidden="true">
        <div className={`h-full rounded-full transition-transform duration-300 ease-out ${tier.bar}`}
          style={{ transform: `scaleX(${escala})`, transformOrigin: 'left' }} />
      </div>
      <div className="relative mt-3 space-y-0.5 rounded-2xl border border-slate-100/90 bg-slate-50 p-3.5 text-xs">
        <span className="block text-[11px] font-bold text-slate-700 sm:text-xs">Feedback de Jefatura Directa:</span>
        <p className="text-[11px] font-normal leading-relaxed text-slate-600 sm:text-xs">
          &ldquo;{evaluacion.comentarios || 'Evaluación registrada por jefatura conforme a metas de desempeño.'}&rdquo;
        </p>
      </div>
    </div>
  );
};

