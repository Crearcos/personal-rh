import { useState } from 'react';
import { Sliders, Award, CalendarRange } from 'lucide-react';
import type {
  CriterioConfig,
  CriterioEvaluacion,
  DatosTipoSolicitud,
  Solicitud,
  TipoSolicitud,
  PeriodoEvaluacion,
  DatosPeriodoEvaluacion,
} from '../types/models';
import { ConfiguracionTiposRRHH } from './ConfiguracionTiposRRHH';
import { ConfiguracionCriteriosRRHH } from './ConfiguracionCriteriosRRHH';
import { ConfiguracionPeriodosRRHH } from './ConfiguracionPeriodosRRHH';

export function ConfiguracionRRHH({
  tipos,
  solicitudes,
  criterios,
  periodos,
  onGuardarTipo,
  onCambiarEstadoTipo,
  onGuardarCriterios,
  onCrearPeriodo,
  onCambiarEstadoPeriodo,
}: {
  tipos: TipoSolicitud[];
  solicitudes: Solicitud[];
  criterios: CriterioEvaluacion[];
  periodos: PeriodoEvaluacion[];
  onGuardarTipo: (datos: DatosTipoSolicitud) => Promise<boolean>;
  onCambiarEstadoTipo: (id: string, activo: boolean) => Promise<boolean>;
  onGuardarCriterios: (datos: CriterioConfig[]) => Promise<boolean>;
  onCrearPeriodo: (datos: DatosPeriodoEvaluacion) => Promise<boolean>;
  onCambiarEstadoPeriodo: (id: string, estado: 'abierto' | 'cerrado') => Promise<boolean>;
}) {
  const [seccion, setSeccion] = useState<'tipos' | 'criterios' | 'periodos'>('tipos');

  return (
    <div className="space-y-6 sm:space-y-8 animate-enter">
      {/* Selector de Subsecciones de Configuración / Ajustes */}
      <nav
        aria-label="Secciones de configuración"
        className="grid grid-cols-1 sm:grid-cols-3 p-1.5 bg-slate-200/60 rounded-2xl gap-1.5 text-xs font-bold shadow-2xs"
      >
        <button
          type="button"
          aria-pressed={seccion === 'tipos'}
          onClick={() => setSeccion('tipos')}
          className={`btn-pressable py-2.5 px-3 rounded-xl transition-colors duration-150 flex items-center justify-center gap-2 min-h-[44px] cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#008262] ${
            seccion === 'tipos'
              ? 'bg-white text-violet-950 font-black shadow-soft border border-violet-300'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/40 font-semibold'
          }`}
        >
          <Sliders aria-hidden="true" className={`w-4 h-4 shrink-0 stroke-[2.2] ${seccion === 'tipos' ? 'text-violet-600' : 'text-slate-400'}`} />
          <span>Tipos de solicitud</span>
        </button>

        <button
          type="button"
          aria-pressed={seccion === 'criterios'}
          onClick={() => setSeccion('criterios')}
          className={`btn-pressable py-2.5 px-3 rounded-xl transition-colors duration-150 flex items-center justify-center gap-2 min-h-[44px] cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#008262] ${
            seccion === 'criterios'
              ? 'bg-white text-amber-950 font-black shadow-soft border border-amber-300'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/40 font-semibold'
          }`}
        >
          <Award aria-hidden="true" className={`w-4 h-4 shrink-0 stroke-[2.2] ${seccion === 'criterios' ? 'text-amber-600' : 'text-slate-400'}`} />
          <span>Criterios de evaluación</span>
        </button>

        <button
          type="button"
          aria-pressed={seccion === 'periodos'}
          onClick={() => setSeccion('periodos')}
          className={`btn-pressable py-2.5 px-3 rounded-xl transition-colors duration-150 flex items-center justify-center gap-2 min-h-[44px] cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#008262] ${
            seccion === 'periodos'
              ? 'bg-white text-sky-950 font-black shadow-soft border border-sky-300'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/40 font-semibold'
          }`}
        >
          <CalendarRange aria-hidden="true" className={`w-4 h-4 shrink-0 stroke-[2.2] ${seccion === 'periodos' ? 'text-sky-600' : 'text-slate-400'}`} />
          <span>Períodos</span>
        </button>
      </nav>

      {/* Contenido Dinámico de la Subsección */}
      {seccion === 'tipos' && (
        <ConfiguracionTiposRRHH
          tipos={tipos}
          solicitudes={solicitudes}
          onGuardar={onGuardarTipo}
          onCambiarEstado={onCambiarEstadoTipo}
        />
      )}
      {seccion === 'criterios' && (
        <ConfiguracionCriteriosRRHH
          criterios={criterios}
          onGuardar={onGuardarCriterios}
        />
      )}
      {seccion === 'periodos' && (
        <ConfiguracionPeriodosRRHH
          periodos={periodos}
          onCrear={onCrearPeriodo}
          onCambiarEstado={onCambiarEstadoPeriodo}
        />
      )}
    </div>
  );
}
