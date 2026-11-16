import React, { useState } from 'react';
import { Award, ChevronDown, History } from 'lucide-react';
import type { CriterioEvaluacion, Evaluacion } from '../types/models';
import { EvaluationCard } from './EvaluationCard';
import { DetalleEvaluacion } from './DetalleEvaluacion';

interface EvaluacionesEmpleadoProps {
  evaluaciones: Evaluacion[];
  empresaId: string;
  empleadoId: string;
  criterios: CriterioEvaluacion[];
}

function textoContador(total: number, mostrandoHistorial: boolean): string {
  if (total === 0) return '0 registros';
  if (total === 1) return '1 evaluación';
  if (mostrandoHistorial) return `${total} de ${total}`;
  return `Última de ${total}`;
}

function CabeceraEvaluaciones({ total, mostrandoHistorial }: { total: number; mostrandoHistorial: boolean }) {
  return (
    <div className="flex items-center justify-between gap-2 px-1">
      <div className="flex min-w-0 items-center gap-2.5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#86e27f] bg-[#a8ffa1]/40 text-[#004828]">
          <Award aria-hidden="true" className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <h2 className="truncate text-base font-bold tracking-tight text-slate-900">Evaluación de Desempeño</h2>
          <p className="truncate text-xs text-slate-600">Puntaje ponderado y feedback oficial</p>
        </div>
      </div>
      <span className="shrink-0 rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700 tabular-nums">
        {textoContador(total, mostrandoHistorial)}
      </span>
    </div>
  );
}

function EstadoVacioEvaluaciones() {
  return (
    <div className="relative space-y-2.5 overflow-hidden rounded-3xl border border-slate-200/90 bg-white px-5 py-8 text-center shadow-soft">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-10 inset-x-0 mx-auto h-24 w-3/4 rounded-full bg-[#aaaaff]/30 blur-2xl"
      />
      <div className="relative mx-auto flex h-11 w-11 items-center justify-center rounded-2xl border border-[#dcdcf9] bg-[#f0f0ff] text-[#302866]">
        <Award aria-hidden="true" className="h-5 w-5" />
      </div>
      <p className="relative text-sm font-bold text-slate-900">Sin evaluaciones registradas</p>
      <p className="relative mx-auto max-w-xs text-xs leading-relaxed text-slate-600">
        Tu jefatura directa registrará tu evaluación de desempeño ponderada al cierre de cada ciclo.
      </p>
    </div>
  );
}

function HistorialEvaluaciones({ evaluacionesAnteriores, empresaId, empleadoId, criterios, mostrarHistorial, onToggle }: {
  evaluacionesAnteriores: Evaluacion[]; empresaId: string; empleadoId: string; criterios: CriterioEvaluacion[];
  mostrarHistorial: boolean; onToggle: () => void;
}) {
  const total = evaluacionesAnteriores.length;
  return (
    <div className="space-y-3 pt-1">
      <button type="button" onClick={onToggle} aria-expanded={mostrarHistorial}
        className="btn-pressable group flex min-h-[44px] w-full cursor-pointer items-center justify-between rounded-2xl border border-slate-200/90 bg-white px-4 py-3 text-xs font-bold text-slate-700 shadow-soft transition-colors duration-150 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#008262]">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition-colors duration-150 group-hover:bg-[#a8ffa1]/30 group-hover:text-[#004828]">
            <History aria-hidden="true" className="h-3.5 w-3.5" />
          </div>
          <span className="truncate">{mostrarHistorial ? 'Ocultar evaluaciones anteriores' : `Ver evaluaciones anteriores (${total})`}</span>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <span className="rounded-full border border-slate-200 bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-700 tabular-nums">
            {mostrarHistorial ? 'Ocultar' : `${total} ${total === 1 ? 'ciclo' : 'ciclos'}`}
          </span>
          <ChevronDown aria-hidden="true"
            className={`h-4 w-4 text-slate-500 transition-transform duration-200 ease-out group-hover:text-slate-700 ${mostrarHistorial ? 'rotate-180' : ''}`} />
        </div>
      </button>
      {mostrarHistorial && (
        <div className="space-y-3 animate-enter">
          {evaluacionesAnteriores.map((evaluacion) => (
            <React.Fragment key={evaluacion.id}>
              <EvaluationCard evaluacion={evaluacion} isLatest={false} />
              <DetalleEvaluacion evaluacionId={evaluacion.id} empresaId={empresaId} empleadoId={empleadoId} criterios={criterios} />
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
}

export function EvaluacionesEmpleado({ evaluaciones, empresaId, empleadoId, criterios }: EvaluacionesEmpleadoProps) {
  const [mostrarHistorial, setMostrarHistorial] = useState(false);
  const evaluacionReciente = evaluaciones[0];
  const evaluacionesAnteriores = evaluaciones.slice(1);

  return (
    <div className="space-y-3">
      <CabeceraEvaluaciones total={evaluaciones.length} mostrandoHistorial={mostrarHistorial} />
      {!evaluacionReciente ? <EstadoVacioEvaluaciones /> : (
        <div className="space-y-3">
          <EvaluationCard evaluacion={evaluacionReciente} isLatest={true} />
          <DetalleEvaluacion evaluacionId={evaluacionReciente.id} empresaId={empresaId} empleadoId={empleadoId} criterios={criterios} />
          {evaluacionesAnteriores.length > 0 && (
            <HistorialEvaluaciones evaluacionesAnteriores={evaluacionesAnteriores} empresaId={empresaId} empleadoId={empleadoId}
              criterios={criterios} mostrarHistorial={mostrarHistorial} onToggle={() => setMostrarHistorial((anterior) => !anterior)} />
          )}
        </div>
      )}
    </div>
  );
}
