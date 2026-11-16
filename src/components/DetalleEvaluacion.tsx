import { useEffect, useState } from 'react';
import { BarChart3, MessageSquareText } from 'lucide-react';
import { fetchRespuestasEvaluacion } from '../services/repository';
import type { CriterioEvaluacion, RespuestaEvaluacion } from '../types/models';
import { assignCriterionThemes, getCriterionThemeByIndex, type CriterionTheme } from './evaluationTheme';

interface Props {
  evaluacionId: string;
  empresaId: string;
  empleadoId: string;
  criterios: CriterioEvaluacion[];
}

type Estado = { tipo: 'cargando' } | { tipo: 'error' } | { tipo: 'listo'; respuestas: RespuestaEvaluacion[] };

function ResultadoCriterio({ respuesta, nombre, pesoPorcentaje, theme }: {
  respuesta: RespuestaEvaluacion; nombre: string; pesoPorcentaje: number; theme: CriterionTheme;
}) {
  const puntaje = Number(respuesta.puntaje);
  const proporcion = Math.max(0, Math.min(100, puntaje)) / 100;
  return (
    <li data-criterion-color={theme.key} className="relative overflow-hidden px-5 py-5 sm:px-6">
      <div aria-hidden="true" className={`pointer-events-none absolute -top-8 -right-8 h-28 w-28 rounded-full blur-2xl ${theme.halo}`} />
      <div className="relative flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-2.5">
          <span aria-hidden="true" className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${theme.dot}`} />
          <div className="min-w-0">
            <h4 className="min-w-0 break-words text-sm font-bold leading-snug text-slate-900">{nombre}</h4>
            {pesoPorcentaje > 0 && (
              <p className={`mt-0.5 text-xs font-semibold tabular-nums ${theme.accentText}`}>Peso en el ciclo: {pesoPorcentaje}%</p>
            )}
          </div>
        </div>
        <span className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-extrabold tabular-nums ${theme.badge}`}>
          {puntaje} / 100
        </span>
      </div>
      <div role="img" aria-label={`${nombre}: ${puntaje} de 100 puntos`} className={`relative mt-3 h-2 overflow-hidden rounded-full ${theme.track}`}>
        <div className={`h-full rounded-full transition-transform duration-300 ease-out ${theme.bar}`}
          style={{ transform: `scaleX(${proporcion})`, transformOrigin: 'left' }} />
      </div>
      <div className="relative mt-3.5 flex items-start gap-2 text-sm leading-relaxed text-slate-700">
        <MessageSquareText aria-hidden="true" className={`mt-0.5 h-4 w-4 shrink-0 ${theme.accentText}`} />
        <div className="min-w-0 max-w-prose">
          <p className="text-xs font-bold text-slate-700">Comentario de jefatura</p>
          <p className="mt-1 whitespace-pre-wrap break-words">{respuesta.comentario?.trim() || 'Sin comentario para este criterio'}</p>
        </div>
      </div>
    </li>
  );
}

function CabeceraDetalle({ cantidadCriterios }: { cantidadCriterios: number | null }) {
  return (
    <div className="flex items-center justify-between gap-2 px-1">
      <div className="flex min-w-0 items-center gap-2.5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#dcdcf9] bg-[#f0f0ff] text-[#302866]">
          <BarChart3 aria-hidden="true" className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <h3 className="truncate text-base font-bold tracking-tight text-slate-900">Resultados por criterio</h3>
          <p className="truncate text-xs text-slate-600">Detalle ponderado y observaciones de jefatura</p>
        </div>
      </div>
      {cantidadCriterios !== null && cantidadCriterios > 0 && (
        <span className="shrink-0 rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700 tabular-nums">
          {cantidadCriterios} {cantidadCriterios === 1 ? 'criterio' : 'criterios'}
        </span>
      )}
    </div>
  );
}

function ListaCriterios({ respuestas, criterios }: { respuestas: RespuestaEvaluacion[]; criterios: CriterioEvaluacion[] }) {
  const themeMap = assignCriterionThemes(criterios);
  const idsRespondidos = new Set(respuestas.map((respuesta) => respuesta.criterio_id));
  const criteriosRespondidos = criterios.filter((criterio) => idsRespondidos.has(criterio.id));
  const pesoTotal = criteriosRespondidos.length === idsRespondidos.size
    ? criteriosRespondidos.reduce((total, criterio) => total + Number(criterio.peso || 0), 0)
    : 0;

  return (
    <ul className="relative -m-5 divide-y divide-slate-100 sm:-m-6">
      {respuestas.map((respuesta, index) => {
        const criterio = criterios.find((item) => item.id === respuesta.criterio_id);
        const theme = themeMap.get(respuesta.criterio_id) ?? getCriterionThemeByIndex(index);
        const pesoPorcentaje =
          criterio && pesoTotal > 0 ? Math.round((Number(criterio.peso) / pesoTotal) * 1000) / 10 : 0;

        return (
          <ResultadoCriterio
            key={respuesta.id}
            respuesta={respuesta}
            nombre={criterio?.nombre || 'Criterio no disponible'}
            pesoPorcentaje={pesoPorcentaje}
            theme={theme}
          />
        );
      })}
    </ul>
  );
}

function ContenidoDetalle({ estado, criterios, reintentar }: { estado: Estado; criterios: CriterioEvaluacion[]; reintentar: () => void }) {
  if (estado.tipo === 'cargando') {
    return <p role="status" className="relative py-2 text-sm text-slate-600">Cargando resultados por criterio...</p>;
  }
  if (estado.tipo === 'error') {
    return (
      <div role="alert" className="relative space-y-3 py-2 text-sm text-slate-700">
        <p>No pudimos cargar el detalle de esta evaluación.</p>
        <button
          type="button"
          onClick={reintentar}
          className="btn-pressable min-h-[44px] cursor-pointer rounded-xl border border-emerald-300 px-4 font-bold text-emerald-900 hover:bg-emerald-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#008262]"
        >
          Reintentar
        </button>
      </div>
    );
  }
  if (estado.respuestas.length === 0) {
    return <p className="relative py-2 text-sm text-slate-600">Esta evaluación no tiene detalle por criterio registrado.</p>;
  }
  return <ListaCriterios respuestas={estado.respuestas} criterios={criterios} />;
}

export function DetalleEvaluacion({ evaluacionId, empresaId, empleadoId, criterios }: Props) {
  const [estado, setEstado] = useState<Estado>({ tipo: 'cargando' });
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    let vigente = true;
    setEstado({ tipo: 'cargando' });
    void fetchRespuestasEvaluacion(evaluacionId, empresaId, empleadoId)
      .then((resultado) => {
        if (!vigente) return;
        setEstado(resultado.success ? { tipo: 'listo', respuestas: resultado.data ?? [] } : { tipo: 'error' });
      })
      .catch(() => {
        if (vigente) setEstado({ tipo: 'error' });
      });
    return () => {
      vigente = false;
    };
  }, [evaluacionId, empresaId, empleadoId, intento]);

  const cantidadCriterios = estado.tipo === 'listo' ? estado.respuestas.length : null;

  return (
    <section aria-label="Resultados por criterio" className="space-y-3 pt-2">
      <CabeceraDetalle cantidadCriterios={cantidadCriterios} />
      <div className="relative overflow-hidden rounded-3xl border border-slate-200/90 bg-white p-5 shadow-soft sm:p-6">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-12 -left-12 h-32 w-32 rounded-full bg-[#aaaaff]/20 blur-3xl"
        />
        <ContenidoDetalle estado={estado} criterios={criterios} reintentar={() => setIntento((anterior) => anterior + 1)} />
      </div>
    </section>
  );
}
