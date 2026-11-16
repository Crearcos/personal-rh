import { useState, type FormEvent } from 'react';
import { Award, Building2, Search, Send, Users, X } from 'lucide-react';
import type { CriterioEvaluacion, Departamento, Empleado, EvaluacionScoreSummary, PeriodoEvaluacion } from '../types/models';
import { CustomSelect, type CustomSelectOption } from './CustomSelect';
import { getEvaluationTier } from './evaluationTheme';

interface Props {
  criterios: CriterioEvaluacion[];
  empleados: Empleado[];
  departamentos?: Departamento[];
  selectedEmpleadoId: string;
  periodo: string;
  periodos?: PeriodoEvaluacion[];
  errorPeriodos?: boolean;
  onReintentarPeriodos?: () => void;
  scores: Record<string, number>;
  comentarios: Record<string, string>;
  resultado: EvaluacionScoreSummary;
  isSubmitting: boolean;
  errorGuardado?: string | null;
  onEmpleadoChange: (id: string) => void;
  onPeriodoChange: (periodo: string) => void;
  onScoreChange: (id: string, valor: number) => void;
  onComentarioChange: (id: string, valor: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}

function normalizarTexto(texto: string): string {
  return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function filtrarEmpleados(
  empleados: Empleado[],
  busqueda: string,
  departamentoId: string,
  departamentoPorId: Map<string, string>
): Empleado[] {
  const consulta = normalizarTexto(busqueda.trim());
  return empleados.filter((emp) => {
    if (departamentoId !== 'todos' && emp.departamento_id !== departamentoId) return false;
    if (!consulta) return true;
    const deptoNombre = departamentoPorId.get(emp.departamento_id || '') || '';
    const campos = `${emp.nombre} ${emp.cargo} ${deptoNombre} ${emp.id}`;
    return normalizarTexto(campos).includes(consulta);
  });
}

function ResultadoEvaluacion({ resultado }: { resultado: EvaluacionScoreSummary }) {
  const tier = getEvaluationTier(resultado.puntajeTotal, resultado.desempenoNivel);
  const escala = Math.max(0, Math.min(100, resultado.puntajeTotal)) / 100;
  return (
    <div className={`relative overflow-hidden rounded-3xl border bg-white p-5 shadow-soft transition-colors duration-200 sm:p-6 ${tier.cardBorder}`}>
      <div aria-hidden="true" className={`pointer-events-none absolute -top-10 -right-10 h-40 w-40 rounded-full blur-2xl transition-colors duration-200 ${tier.halo}`} />
      <div className="relative flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-slate-900">Resultado ponderado</p>
          <p className="mt-1 text-xs leading-relaxed text-slate-600">Se actualiza al cambiar cada calificación.</p>
        </div>
        <div className={`flex items-baseline gap-1.5 tabular-nums ${tier.textStrong}`}>
          <span className="text-3xl font-extrabold tracking-tight">{resultado.puntajeTotal.toFixed(1)}</span>
          <span className="text-sm font-semibold text-slate-600">/ 100</span>
        </div>
      </div>
      <div className="relative mt-4 flex items-center gap-3">
        <div className={`h-2 flex-1 overflow-hidden rounded-full ${tier.track}`} aria-hidden="true">
          <div className={`h-full rounded-full transition-transform duration-200 ease-out ${tier.bar}`}
            style={{ transform: `scaleX(${escala})`, transformOrigin: 'left' }} />
        </div>
        <span className={`shrink-0 rounded-full border px-3 py-1 text-xs font-extrabold transition-colors duration-200 ${tier.badge}`}>
          {resultado.desempenoNivel}
        </span>
      </div>
    </div>
  );
}

function Criterio({ criterio, pesoTotal, score, comentario, onScoreChange, onComentarioChange }: {
  criterio: CriterioEvaluacion; pesoTotal: number; score: number; comentario: string;
  onScoreChange: Props['onScoreChange']; onComentarioChange: Props['onComentarioChange'];
}) {
  const porcentaje = pesoTotal > 0 ? Math.round((Number(criterio.peso) / pesoTotal) * 1000) / 10 : 0;
  const tier = getEvaluationTier(score);
  return (
    <section className={`relative overflow-hidden rounded-3xl border bg-white p-5 shadow-soft transition-colors duration-200 sm:p-6 ${tier.cardBorder}`}>
      <div aria-hidden="true" className={`pointer-events-none absolute -top-10 -right-10 h-36 w-36 rounded-full blur-2xl transition-colors duration-200 ${tier.halo}`} />
      <div className="relative flex flex-wrap items-start justify-between gap-2">
        <h4 className="text-base font-bold tracking-tight text-slate-900">{criterio.nombre}</h4>
        <span className="shrink-0 rounded-full bg-[#e8e8ff] px-3 py-1 text-xs font-bold text-[#37316a] tabular-nums">{porcentaje}% del resultado</span>
      </div>
      <div className="relative mt-4 flex flex-wrap items-center justify-between gap-2">
        <label htmlFor={`score-${criterio.id}`} className="text-sm font-semibold text-slate-700">Calificación</label>
        <div className="flex items-center gap-2">
          <span className={`rounded-full border px-2.5 py-0.5 text-xs font-extrabold transition-colors duration-200 ${tier.badge}`}>{tier.nivel}</span>
          <span className={`rounded-lg border px-3 py-1 text-sm font-extrabold tabular-nums transition-colors duration-200 ${tier.badge}`}>{score} <span className="font-medium">/ 100</span></span>
        </div>
      </div>
      <input id={`score-${criterio.id}`} aria-label={`Calificación de ${criterio.nombre}`} type="range" min="50" max="100"
        value={score} onChange={(event) => onScoreChange(criterio.id, Number(event.target.value))}
        className={`relative mt-1 h-11 w-full cursor-pointer ${tier.sliderAccent} focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#008262]`} />
      <div className="relative -mt-1 flex justify-between text-xs font-medium text-slate-600 tabular-nums"><span>50</span><span>100</span></div>
      <label htmlFor={`comentario-${criterio.id}`} className="relative mt-4 block text-xs font-semibold text-slate-700">Observaciones <span className="font-normal">(opcional)</span></label>
      <input id={`comentario-${criterio.id}`} aria-label={`Observaciones sobre ${criterio.nombre}`} type="text"
        placeholder="Describe un ejemplo o aspecto a mejorar" value={comentario}
        onChange={(event) => onComentarioChange(criterio.id, event.target.value)}
        className="relative mt-2 min-h-[44px] w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#008262]" />
    </section>
  );
}

function FiltroColaboradores({ busqueda, departamentoId, departamentos, onBusquedaChange, onDepartamentoChange }: {
  busqueda: string; departamentoId: string; departamentos: Departamento[];
  onBusquedaChange: (valor: string) => void; onDepartamentoChange: (valor: string) => void;
}) {
  const opcionesDepartamento: CustomSelectOption[] = [
    { value: 'todos', label: 'Todos los departamentos' },
    ...departamentos.map((depto) => ({ value: depto.id, label: depto.nombre })),
  ];
  return (
    <div className="relative z-30 grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div className="space-y-2">
        <label htmlFor="buscar-colaborador-eval" className="text-sm font-semibold text-slate-700">Buscar colaborador</label>
        <div className="relative">
          <Search aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input id="buscar-colaborador-eval" type="text" inputMode="search" value={busqueda}
            onChange={(event) => onBusquedaChange(event.target.value)} placeholder="Nombre, cargo o departamento..."
            className="min-h-[46px] w-full rounded-xl border border-slate-200 bg-slate-50/80 py-2.5 pl-10 pr-11 text-sm font-medium text-slate-900 placeholder:text-slate-500 hover:bg-slate-100/80 focus-visible:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#008262]" />
          {busqueda.trim().length > 0 && (
            <button type="button" onClick={() => onBusquedaChange('')} aria-label="Limpiar búsqueda"
              className="btn-pressable absolute right-0.5 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-lg text-slate-500 hover:text-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#008262]">
              <X aria-hidden="true" className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
      <div className="space-y-2">
        <p className="text-sm font-semibold text-slate-700">Departamento</p>
        <CustomSelect value={departamentoId} onChange={onDepartamentoChange} options={opcionesDepartamento}
          icon={<Building2 aria-hidden="true" className="h-4 w-4" />} ariaLabel="Filtrar colaboradores por departamento" />
      </div>
    </div>
  );
}

function DatosEvaluacion({ props, empleadosFiltrados, departamentoPorId, onResetFiltros }: {
  props: Props; empleadosFiltrados: Empleado[]; departamentoPorId: Map<string, string>; onResetFiltros: () => void;
}) {
  const count = empleadosFiltrados.length;
  const opcionesColaborador: CustomSelectOption[] = empleadosFiltrados.map((emp) => {
    const deptoNombre = departamentoPorId.get(emp.departamento_id || '');
    return { value: emp.id, label: emp.nombre, description: deptoNombre ? `${emp.cargo} · ${deptoNombre}` : emp.cargo };
  });
  return (
    <div className="relative z-20 grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold text-slate-700">Colaborador</p>
          <span className="rounded-full bg-[#e8e8ff] px-2.5 py-0.5 text-xs font-bold text-[#37316a] tabular-nums">
            {count} {count === 1 ? 'disponible' : 'disponibles'}
          </span>
        </div>
        <CustomSelect value={props.selectedEmpleadoId} onChange={props.onEmpleadoChange} options={opcionesColaborador}
          placeholder={count > 0 ? `Selecciona un colaborador (${count})` : 'Sin colaboradores coincidentes'}
          icon={<Users aria-hidden="true" className="h-4 w-4" />} ariaLabel="Seleccionar colaborador del equipo" />
        {count === 0 && props.empleados.length === 0 && <p className="text-sm text-slate-600">No tienes colaboradores asignados. Contacta a RR. HH.</p>}
        {count === 0 && props.empleados.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">
            <span>No hay colaboradores que coincidan con los filtros.</span>
            <button type="button" onClick={onResetFiltros}
              className="btn-pressable min-h-[44px] rounded-lg bg-white px-3 py-2 font-bold text-[#005266] shadow-2xs ring-1 ring-slate-200 hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#008262]">
              Restablecer filtros
            </button>
          </div>
        )}
      </div>
      <div className="space-y-2"><p className="text-sm font-semibold text-slate-700">Período de evaluación</p>
        {props.errorPeriodos ? <div role="alert" className="text-sm text-rose-700"><p>No pudimos cargar los períodos.</p><button type="button" onClick={props.onReintentarPeriodos} className="mt-2 min-h-11 rounded-xl border border-slate-300 px-4 font-semibold text-slate-800 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-emerald-600">Reintentar</button></div> : props.periodos?.length ? <CustomSelect value={props.periodo} onChange={props.onPeriodoChange} options={props.periodos.map((periodo) => ({ value: periodo.nombre, label: periodo.nombre, description: periodo.fecha_inicio && periodo.fecha_fin ? `${periodo.fecha_inicio.split('-').reverse().join('/')} – ${periodo.fecha_fin.split('-').reverse().join('/')}` : 'Fechas no registradas' }))} ariaLabel="Seleccionar período de evaluación" /> :
          <p className="text-sm text-slate-600">No hay períodos abiertos para evaluar. Contacta a RR. HH.</p>}
      </div>
    </div>
  );
}

export function EvaluacionJefe(props: Props) {
  const [busqueda, setBusqueda] = useState('');
  const [departamentoId, setDepartamentoId] = useState('todos');
  const departamentos = props.departamentos ?? [];
  const departamentoPorId = new Map(departamentos.map((depto) => [depto.id, depto.nombre]));
  const empleadosFiltrados = filtrarEmpleados(props.empleados, busqueda, departamentoId, departamentoPorId);
  const pesoTotal = props.criterios.reduce((total, criterio) => total + Number(criterio.peso), 0);
  const resetFiltros = () => {
    setBusqueda('');
    setDepartamentoId('todos');
  };
  return (
    <form onSubmit={props.onSubmit} className="space-y-4">
      <div className="relative z-20 space-y-5 rounded-3xl border border-slate-200/90 bg-white p-5 shadow-soft sm:p-6">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden rounded-3xl">
          <div className="absolute -top-12 inset-x-0 mx-auto h-24 w-4/5 rounded-full bg-[#aaaaff]/40 blur-3xl" />
        </div>
        <div className="relative flex items-start gap-3 border-b border-slate-200 pb-5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#e8e8ff] text-[#37316a]"><Award aria-hidden="true" className="h-5 w-5" /></div>
          <div><h2 className="text-lg font-bold tracking-tight text-slate-900">Evaluación de desempeño</h2>
            <p className="mt-1 text-sm leading-relaxed text-slate-600">Valora los criterios del colaborador y acompaña tu calificación con observaciones.</p></div>
        </div>
        <FiltroColaboradores busqueda={busqueda} departamentoId={departamentoId} departamentos={departamentos}
          onBusquedaChange={setBusqueda} onDepartamentoChange={setDepartamentoId} />
        <DatosEvaluacion props={props} empleadosFiltrados={empleadosFiltrados} departamentoPorId={departamentoPorId}
          onResetFiltros={resetFiltros} />
      </div>
      <ResultadoEvaluacion resultado={props.resultado} />
      <div className="relative overflow-hidden rounded-3xl border border-slate-200/90 bg-white p-5 shadow-soft sm:p-6">
        <div aria-hidden="true" className="pointer-events-none absolute -top-10 -right-10 h-28 w-28 rounded-full bg-[#aaaaff]/25 blur-2xl" />
        <h3 className="relative text-base font-bold tracking-tight text-slate-900">Criterios de evaluación</h3>
        <p className="relative mt-1 max-w-prose text-sm leading-relaxed text-slate-600">El peso indica cuánto influye cada criterio en la nota final. Ajusta cada calificación entre 50 y 100.</p>
      </div>
      {props.criterios.length === 0 ? <p className="rounded-3xl border border-slate-200/90 bg-white p-5 text-sm text-slate-600 shadow-soft">No hay criterios de evaluación disponibles</p> : (
        <div className="space-y-4">{props.criterios.map((criterio) => <Criterio key={criterio.id} criterio={criterio} pesoTotal={pesoTotal}
          score={props.scores[criterio.id] ?? 85} comentario={props.comentarios[criterio.id] ?? ''}
          onScoreChange={props.onScoreChange} onComentarioChange={props.onComentarioChange} />)}</div>
      )}
      {props.errorGuardado && <p role="alert" className="rounded-2xl border border-rose-200 bg-white p-4 text-sm text-rose-700">{props.errorGuardado}</p>}
      <button type="submit" disabled={props.isSubmitting || props.errorPeriodos || props.criterios.length === 0 || !props.selectedEmpleadoId || !props.periodos?.some((periodo) => periodo.nombre === props.periodo && periodo.estado === 'abierto')}
        className="btn-pressable flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-[#aaaaff] px-4 py-3 text-sm font-bold text-[#141440] hover:bg-[#9999ef] disabled:cursor-not-allowed disabled:opacity-50">
        <Send aria-hidden="true" className="h-4 w-4" /><span>{props.isSubmitting ? 'Registrando evaluación...' : 'Guardar y publicar evaluación'}</span>
      </button>
    </form>
  );
}
