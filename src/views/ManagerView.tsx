import React, { useState, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { 
  Calendar, 
  Clock, 
  Award, 
  Briefcase,
  Tag,
  Users,
  CheckCircle2,
  Check,
  X
} from 'lucide-react';
import type { 
  Solicitud, 
  Empleado, 
  CriterioEvaluacion, 
  DemoUserSession,
  Evaluacion,
  Departamento,
  TipoSolicitud,
  PeriodoEvaluacion
} from '../types/models';
import { calculateWeightedEvaluationScore } from '../services/evaluation.service';
import { EvaluacionJefe } from '../components/EvaluacionJefe';
import { AusenciasEquipo } from '../components/AusenciasEquipo';
import {
  SolicitudDecisionModal,
  type SolicitudModalAction,
} from '../components/SolicitudDecisionModal';

interface ManagerViewProps {
  session: DemoUserSession;
  solicitudes: Solicitud[];
  empleados: Empleado[];
  criterios: CriterioEvaluacion[];
  evaluaciones: Evaluacion[];
  departamentos?: Departamento[];
  tiposSolicitud?: TipoSolicitud[];
  periodos?: PeriodoEvaluacion[];
  errorPeriodos?: boolean;
  onReintentarPeriodos?: () => void;
  onResolveSolicitud: (solicitudId: string, accion: 'aprobada' | 'rechazada', comentario: string) => Promise<string | null>;
  onSubmitEvaluacion: (
    empleadoId: string, 
    periodo: string, 
    puntajeTotal: number, 
    respuestas: { criterio_id: string; puntaje: number; comentario: string }[]
  ) => Promise<boolean>;
}

// Formateador de rangos de fechas: "10 - 13 nov 2026"
const formatFechaRango = (desdeStr?: string, hastaStr?: string): string => {
  if (!desdeStr) return '';
  if (!hastaStr) return desdeStr;
  const meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  const pDesde = desdeStr.split('-');
  const pHasta = hastaStr.split('-');
  if (pDesde.length === 3 && pHasta.length === 3) {
    const diaD = parseInt(pDesde[2], 10);
    const mesD = parseInt(pDesde[1], 10) - 1;
    const anioD = pDesde[0];
    const diaH = parseInt(pHasta[2], 10);
    const mesH = parseInt(pHasta[1], 10) - 1;
    const anioH = pHasta[0];
    if (mesD === mesH && anioD === anioH) {
      return `${diaD} - ${diaH} ${meses[mesD] || ''} ${anioD}`;
    }
    return `${diaD} ${meses[mesD] || ''} - ${diaH} ${meses[mesH] || ''} ${anioH}`;
  }
  return `${desdeStr} al ${hastaStr}`;
};

export const ManagerView: React.FC<ManagerViewProps> = ({
  session,
  solicitudes,
  empleados,
  criterios,
  evaluaciones: _evaluaciones,
  departamentos = [],
  tiposSolicitud = [],
  periodos = [],
  errorPeriodos = false,
  onReintentarPeriodos,
  onResolveSolicitud,
  onSubmitEvaluacion,
}) => {
  const [activeTab, setActiveTab] = useState<'pendientes' | 'calendario' | 'evaluar'>('pendientes');
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [errorResolucion, setErrorResolucion] = useState<string | null>(null);
  const [modalAction, setModalAction] = useState<SolicitudModalAction | null>(null);
  const [modalComentario, setModalComentario] = useState<string>('');

  // Departamento del jefe activo
  const departamentoNombre = useMemo(() => {
    const dep = departamentos.find((d) => d.id === session.departamentoId);
    return dep ? dep.nombre : 'Sin departamento asignado';
  }, [departamentos, session.departamentoId]);

  // Filtro estricto del equipo a cargo (Regla del Brief: "Un jefe solo ve a su equipo")
  const miEquipo = useMemo(() => {
    return empleados.filter(
      (e) => e.empresa_id === session.empresaId && e.activo && e.jefe_id === session.empleadoId && e.id !== session.empleadoId
    );
  }, [empleados, session.empleadoId, session.empresaId]);

  const miEquipoIds = useMemo(() => new Set(miEquipo.map((e) => e.id)), [miEquipo]);

  // Solicitudes del equipo a cargo
  const solicitudesEquipo = useMemo(() => {
    return solicitudes.filter((s) => miEquipoIds.has(s.empleado_id));
  }, [solicitudes, miEquipoIds]);

  const pendientes = useMemo(() => {
    return solicitudesEquipo.filter((s) => s.estado === 'pendiente');
  }, [solicitudesEquipo]);

  const aprobadas = useMemo(() => {
    return solicitudesEquipo.filter((s) => s.estado === 'aprobada');
  }, [solicitudesEquipo]);

  // Estado para la evaluación de desempeño ponderada
  const [selectedEmpleadoId, setSelectedEmpleadoId] = useState(
    () => miEquipo[0]?.id || ''
  );
  const empleadoEvaluadoId = miEquipo.some((e) => e.id === selectedEmpleadoId)
    ? selectedEmpleadoId
    : (miEquipo[0]?.id || '');
  const [periodoSeleccionado, setPeriodoEval] = useState('');
  const periodosAbiertos = periodos.filter((periodo) => periodo.empresa_id === session.empresaId && periodo.estado === 'abierto');
  const periodoEval = periodosAbiertos.some((periodo) => periodo.nombre === periodoSeleccionado) ? periodoSeleccionado : periodosAbiertos[0]?.nombre || '';
  const [scores, setScores] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    criterios.forEach((c) => { initial[c.id] = 85; });
    return initial;
  });
  const [comentariosEval, setComentariosEval] = useState<Record<string, string>>({});
  const [isSubmittingEval, setIsSubmittingEval] = useState(false);
  const [errorEvaluacion, setErrorEvaluacion] = useState<string | null>(null);

  // Cálculo ponderado en vivo
  const respuestasCalculo = useMemo(() => {
    return criterios.map((c) => ({
      criterioId: c.id,
      puntaje: scores[c.id] ?? 85,
    }));
  }, [criterios, scores]);

  const evaluacionCalculada = useMemo(() => {
    return calculateWeightedEvaluationScore(criterios, respuestasCalculo);
  }, [criterios, respuestasCalculo]);

  // Manejo de resolución: comentario opcional en aprobación, obligatorio en rechazo
  const handleResolve = async (solicitudId: string, accion: 'aprobada' | 'rechazada', customComment?: string) => {
    const trimmedComment = customComment?.trim();
    if (accion === 'rechazada' && !trimmedComment) {
      return; // Motivo obligatorio para rechazo
    }

    setResolvingId(solicitudId);
    setErrorResolucion(null);
    const comentarioFinal = trimmedComment || 'Aprobado conforme a la planificación de cobertura del equipo de ventas';

    let error: string | null;
    try {
      error = await onResolveSolicitud(solicitudId, accion, comentarioFinal);
    } catch {
      error = 'No se pudo resolver la solicitud. Inténtalo nuevamente.';
    }
    setResolvingId(null);
    if (error) { setErrorResolucion(error); return; }
    setModalAction(null);
    setModalComentario('');
    if (accion === 'aprobada') {
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
    }
  };

  const handleScoreChange = (criterioId: string, value: number) => {
    setScores((prev) => ({ ...prev, [criterioId]: value }));
  };

  const handleSaveEvaluacion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!empleadoEvaluadoId || !periodoEval || errorPeriodos) return;

    setIsSubmittingEval(true);
    setErrorEvaluacion(null);
    const respuestasFormatted = criterios.map((c) => ({
      criterio_id: c.id,
      puntaje: scores[c.id] ?? 85,
      comentario: comentariosEval[c.id] || 'Cumplimiento adecuado del criterio según metas acordadas.',
    }));

    try {
      const guardada = await onSubmitEvaluacion(empleadoEvaluadoId, periodoEval, evaluacionCalculada.puntajeTotal, respuestasFormatted);
      if (!guardada) { setErrorEvaluacion('No se pudo guardar la evaluación. El equipo, los criterios o el período pueden haber cambiado; actualiza la página e inténtalo nuevamente.'); return; }
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
      setActiveTab('pendientes');
    } catch {
      setErrorEvaluacion('No se pudo guardar la evaluación. Comprueba la conexión e inténtalo nuevamente.');
    } finally { setIsSubmittingEval(false); }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-5 animate-enter">
      
      {/* 1. TÍTULO Y SUBTÍTULO EXTERNOS (Exacto al Boceto) */}
      <div className="space-y-1 px-1">
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          Panel de Jefatura
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 font-medium">
          Gestion de equipo, aprobaciones y desempeño
        </p>
      </div>

      {/* 2. TARJETA EJECUTIVA DE CARLOS MORALES (Fiel al Boceto y Simétrica) */}
      <div className="relative overflow-hidden bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-soft flex flex-col gap-4">
        {/* Halo de luz decorativo superior con opacidad reforzada (#aaaaff/40) */}
        <div 
          className="absolute -top-12 inset-x-0 mx-auto w-4/5 h-24 rounded-full bg-[#aaaaff]/40 blur-3xl pointer-events-none"
          aria-hidden="true" 
        />

        {/* Identidad del Jefe: Carlos Morales + Maletín Morado "Jefe de ventas" + Tag Cian "Ventas y Comercial" */}
        <div className="relative space-y-1">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight leading-snug">
            {session.nombre}
          </h2>
          <div className="flex flex-wrap items-center gap-2 pt-0.5 text-xs sm:text-sm font-semibold text-slate-700">
            <div className="flex items-center gap-1.5 text-slate-800">
              <Briefcase className="w-4 h-4 text-[#8b5cf6] fill-[#8b5cf6]/20 stroke-[2.2]" />
              <span>Jefe de ventas</span>
            </div>
            <span className="w-1.5 h-1.5 rounded-full bg-slate-300" aria-hidden="true" />
            <div className="flex items-center gap-1.5 text-slate-800">
              <Tag className="w-4 h-4 text-[#06b6d4] fill-[#06b6d4]/20 stroke-[2.2]" />
              <span>{departamentoNombre}</span>
            </div>
          </div>
        </div>

        {/* Contenedor Interior Blanco para las 3 Métricas con División y Halos Suaves de Color */}
        <div className="relative overflow-hidden bg-white rounded-2xl border border-slate-200/80 p-3.5 sm:p-5 shadow-2xs">
          {/* Halos interiores sutiles: Esquina inferior izquierda (verde lima), Centro inferior (celeste), Esquina inferior derecha (naranja) */}
          <div 
            className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full blur-2xl pointer-events-none"
            style={{ backgroundColor: 'rgba(138, 233, 34, 0.20)' }}
            aria-hidden="true" 
          />
          <div 
            className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-24 h-20 rounded-full blur-2xl pointer-events-none"
            style={{ backgroundColor: 'rgba(14, 165, 233, 0.20)' }}
            aria-hidden="true" 
          />
          <div 
            className="absolute -bottom-6 -right-6 w-24 h-24 rounded-full blur-2xl pointer-events-none"
            style={{ backgroundColor: 'rgba(249, 115, 22, 0.20)' }}
            aria-hidden="true" 
          />

          {/* Grid de 3 Columnas Simétricas con Divisores Verticales */}
          <div className="relative z-10 grid grid-cols-3 divide-x divide-slate-100">
            {/* Columna 1: Pendientes */}
            <div className="flex items-center justify-center py-1 sm:py-2 px-1">
              <div className="flex items-start gap-1.5 sm:gap-2.5">
                <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-[#8ae922] text-white flex items-center justify-center flex-shrink-0 shadow-xs mt-0.5">
                  <Clock className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5 stroke-[2.5]" />
                </div>
                <div className="flex flex-col items-start min-w-0">
                  <span className="text-2xl sm:text-3xl font-black text-slate-900 tabular-nums leading-none tracking-tight">
                    {pendientes.length}
                  </span>
                  <span className="text-[10px] sm:text-xs font-semibold text-slate-600 block pt-1 whitespace-nowrap">
                    Pendientes
                  </span>
                  <div className="flex items-center gap-0.5 sm:gap-1 pt-1.5 opacity-90">
                    {[...Array(6)].map((_, i) => (
                      <span key={i} className="w-1.5 sm:w-2 h-[3px] rounded-full bg-[#8ae922]" />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Columna 2: Tu Equipo */}
            <div className="flex items-center justify-center py-1 sm:py-2 px-1">
              <div className="flex items-start gap-1.5 sm:gap-2.5">
                <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-[#0ea5e9] text-white flex items-center justify-center flex-shrink-0 shadow-xs mt-0.5">
                  <Users className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5 stroke-[2.5]" />
                </div>
                <div className="flex flex-col items-start min-w-0">
                  <span className="text-2xl sm:text-3xl font-black text-slate-900 tabular-nums leading-none tracking-tight">
                    {miEquipo.length}
                  </span>
                  <span className="text-[10px] sm:text-xs font-semibold text-slate-600 block pt-1 whitespace-nowrap">
                    Tu Equipo
                  </span>
                  <div className="flex items-center gap-0.5 sm:gap-1 pt-1.5 opacity-90">
                    {[...Array(6)].map((_, i) => (
                      <span key={i} className="w-1.5 sm:w-2 h-[3px] rounded-full bg-[#0ea5e9]" />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Columna 3: Ausencias */}
            <div className="flex items-center justify-center py-1 sm:py-2 px-1">
              <div className="flex items-start gap-1.5 sm:gap-2.5">
                <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-[#f97316] text-white flex items-center justify-center flex-shrink-0 shadow-xs mt-0.5">
                  <Calendar className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5 stroke-[2.5]" />
                </div>
                <div className="flex flex-col items-start min-w-0">
                  <span className="text-2xl sm:text-3xl font-black text-slate-900 tabular-nums leading-none tracking-tight">
                    {aprobadas.length}
                  </span>
                  <span className="text-[10px] sm:text-xs font-semibold text-slate-600 block pt-1 whitespace-nowrap">
                    Ausencias
                  </span>
                  <div className="flex items-center gap-0.5 sm:gap-1 pt-1.5 opacity-90">
                    {[...Array(6)].map((_, i) => (
                      <span key={i} className="w-1.5 sm:w-2 h-[3px] rounded-full bg-[#f97316]" />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. BARRA DE NAVEGACIÓN SEGMENTADA (Separada, Táctil y Simétrica sin cortes) */}
      <div className="grid grid-cols-3 p-1.5 bg-slate-200/60 rounded-2xl gap-1 text-xs font-bold shadow-2xs">
        <button
          type="button"
          onClick={() => setActiveTab('pendientes')}
          className={`btn-pressable py-2.5 px-1 sm:px-2 rounded-xl transition-all flex items-center justify-center gap-1.5 min-h-[44px] cursor-pointer ${
            activeTab === 'pendientes'
              ? 'bg-white text-[#1a1a4e] font-black shadow-soft border border-[#aaaaff]/40'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
          }`}
        >
          {pendientes.length > 0 ? (
            <span className="w-5 h-5 rounded-full bg-[#aaaaff] text-[#1a1a4b] text-[11px] font-black flex items-center justify-center tabular-nums flex-shrink-0 shadow-2xs">
              {pendientes.length}
            </span>
          ) : (
            <Clock className="w-3.5 h-3.5 flex-shrink-0" />
          )}
          <span className="whitespace-nowrap text-[11px] sm:text-xs font-bold">Solicitudes</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('calendario')}
          className={`btn-pressable py-2.5 px-1 sm:px-2 rounded-xl transition-all flex items-center justify-center gap-1 sm:gap-1.5 min-h-[44px] cursor-pointer ${
            activeTab === 'calendario'
              ? 'bg-white text-[#1a1a4e] font-black shadow-soft border border-[#aaaaff]/40'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
          }`}
        >
          <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="whitespace-nowrap text-[11px] sm:text-xs font-bold">Ausencias</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('evaluar')}
          className={`btn-pressable py-2.5 px-1 sm:px-2 rounded-xl transition-all flex items-center justify-center gap-1 sm:gap-1.5 min-h-[44px] cursor-pointer ${
            activeTab === 'evaluar'
              ? 'bg-white text-[#1a1a4e] font-black shadow-soft border border-[#aaaaff]/40'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
          }`}
        >
          <Award className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="whitespace-nowrap text-[11px] sm:text-xs font-bold">Evaluación</span>
        </button>
      </div>

      {/* PESTAÑA 1: SOLICITUDES PENDIENTES (Resolución rápida con 1 toque) */}
      {activeTab === 'pendientes' && (
        <div className="space-y-4 animate-enter">
          {pendientes.length === 0 ? (
            <div className="p-10 text-center bg-white rounded-3xl border border-slate-200/90 shadow-soft space-y-2.5">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-center text-emerald-600 mx-auto shadow-2xs">
                <CheckCircle2 className="w-6 h-6 stroke-[2.2]" />
              </div>
              <h4 className="text-sm font-bold text-slate-800">
                ¡Todas las solicitudes han sido resueltas!
              </h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                El equipo de {departamentoNombre} se encuentra al día. Las nuevas solicitudes que envíen tus colaboradores aparecerán aquí.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {pendientes.map((sol) => {
                const emp = empleados.find((e) => e.id === sol.empleado_id);
                const tipo = tiposSolicitud.find((t) => t.id === sol.tipo_id);
                const isVacaciones = tipo ? tipo.descuenta_saldo : true;

                const avatarBg = isVacaciones ? 'bg-[#a78bfa]' : 'bg-[#00d2d3]';
                const topGlow = isVacaciones ? 'bg-[#aaaaff]/30' : 'bg-[#00d2d3]/25';
                const taglineColor = isVacaciones ? 'text-[#7c3aed] border-[#7c3aed]/50' : 'text-[#0284c7] border-[#0284c7]/50';

                return (
                  <div 
                    key={sol.id} 
                    className="relative overflow-hidden bg-white p-5 rounded-3xl border border-slate-200/90 shadow-soft space-y-3.5 transition-all duration-200 hover:shadow-md"
                  >
                    {/* Halo superior según el tipo de solicitud (Lavanda para vacaciones, Cian para permisos) */}
                    <div 
                      className={`absolute -top-10 inset-x-0 mx-auto w-4/5 h-16 rounded-full ${topGlow} blur-2xl pointer-events-none`} 
                      aria-hidden="true" 
                    />

                    {/* Fila 1: Avatar + Colaborador + Días */}
                    <div className="relative flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-11 h-11 rounded-full ${avatarBg} text-slate-900 font-bold text-base flex items-center justify-center flex-shrink-0 shadow-2xs`}>
                          {emp ? emp.nombre.charAt(0) : 'C'}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-base font-bold text-slate-900 tracking-tight truncate">
                            {emp?.nombre || 'Colaborador'}
                          </h4>
                          <p className="text-xs text-slate-500 font-medium truncate">
                            {emp?.cargo || 'Colaborador'}
                          </p>
                        </div>
                      </div>

                      <div className="text-right flex-shrink-0">
                        <span className="text-base sm:text-lg font-bold text-slate-900 tabular-nums">
                          {sol.dias} {sol.dias === 1 ? 'dia' : 'dias'}
                        </span>
                      </div>
                    </div>

                    {/* Fila 2: Subrayado Punteado + Fechas */}
                    <div className="relative flex items-center justify-between text-xs pt-0.5">
                      <span className={`${taglineColor} border-b border-dotted font-semibold pb-0.5`}>
                        Solicitud por {tipo?.nombre.toLowerCase() || (isVacaciones ? 'vacaciones anuales' : 'calamidad domestica')}
                      </span>

                      <div className="flex items-center gap-1.5 text-slate-600 font-medium">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{formatFechaRango(sol.fecha_desde, sol.fecha_hasta)}</span>
                      </div>
                    </div>

                    {/* Fila 3: Burbuja de Motivo */}
                    <div className="relative bg-slate-100/70 p-3.5 rounded-2xl border border-slate-100/80 space-y-0.5">
                      <span className="font-bold text-slate-700 text-xs block">
                        Motivo del colaborador:
                      </span>
                      <p className="text-slate-600 text-xs leading-relaxed">
                        "{sol.motivo}"
                      </p>
                    </div>

                    {/* Fila 4: Botones de Acción (Rechazar punteado + Aprobar degradado verde) */}
                    <div className="relative flex items-center gap-2.5 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setModalAction({ solicitudId: sol.id, tipo: 'rechazar' });
                          setModalComentario('');
                        }}
                        className="btn-pressable flex-1 py-2.5 sm:py-3 bg-white hover:bg-rose-50/50 active:scale-[0.98] text-rose-500 border border-dashed border-rose-400 rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                      >
                        <X className="w-4 h-4 stroke-[2.5]" />
                        <span>Rechazar</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setModalAction({ solicitudId: sol.id, tipo: 'aprobar' });
                          setModalComentario('');
                        }}
                        className="btn-pressable flex-1 py-2.5 sm:py-3 bg-gradient-to-r from-[#7bf02d] to-[#4ce675] hover:brightness-105 active:scale-[0.98] text-[#004e1e] rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                      >
                        <Check className="w-4 h-4 stroke-[3]" />
                        <span>Aprobar</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* PESTAÑA 2: CALENDARIO DE AUSENCIAS DEL EQUIPO */}
      {activeTab === 'calendario' && (
        <AusenciasEquipo solicitudes={aprobadas} empleados={empleados}
          departamentos={departamentos} tiposSolicitud={tiposSolicitud} />
      )}

      {/* PESTAÑA 3: EVALUACIÓN DE DESEMPEÑO PONDERADA */}
      {activeTab === 'evaluar' && (
        <EvaluacionJefe criterios={criterios} empleados={miEquipo} departamentos={departamentos.filter((d) => miEquipo.some((e) => e.departamento_id === d.id))} periodos={periodosAbiertos} errorPeriodos={errorPeriodos} onReintentarPeriodos={onReintentarPeriodos} errorGuardado={errorEvaluacion}
          selectedEmpleadoId={empleadoEvaluadoId} periodo={periodoEval} scores={scores} comentarios={comentariosEval}
          resultado={evaluacionCalculada} isSubmitting={isSubmittingEval} onEmpleadoChange={setSelectedEmpleadoId}
          onPeriodoChange={setPeriodoEval} onScoreChange={handleScoreChange}
          onComentarioChange={(id, valor) => setComentariosEval((prev) => ({ ...prev, [id]: valor }))}
          onSubmit={handleSaveEvaluacion} />
      )}

      {/* 4. MODAL DE DOBLE CONFIRMACIÓN: APROBAR / RECHAZAR SOLICITUD (Exacto al Boceto) */}
      <SolicitudDecisionModal
        modalAction={modalAction}
        error={errorResolucion}
        comentario={modalComentario}
        isResolving={Boolean(modalAction && resolvingId === modalAction.solicitudId)}
        onComentarioChange={setModalComentario}
        onConfirm={() => {
          if (!modalAction) return;
          const accion = modalAction.tipo === 'aprobar' ? 'aprobada' : 'rechazada';
          void handleResolve(modalAction.solicitudId, accion, modalComentario);
        }}
        onClose={() => { setModalAction(null); setErrorResolucion(null); }}
      />
    </div>
  );
};
