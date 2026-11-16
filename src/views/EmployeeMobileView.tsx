import React, { useState, useMemo, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { 
  Calendar, 
  Clock, 
  Send, 
  AlertCircle, 
  ClipboardCheck, 
  Info,
  X,
  Check,
  Trash2,
  Sparkles,
  Award,
  User
} from 'lucide-react';
import type { 
  SaldoVacaciones, 
  Solicitud, 
  TipoSolicitud, 
  OnboardingTarea,
  Evaluacion,
  CriterioEvaluacion,
  DemoUserSession 
} from '../types/models';
import { validateVacationRequest } from '../services/vacation.service';
import { tareaVencida as isTareaVencida } from '../services/fechaTareaVencida';
import { CustomSelect, type CustomSelectOption } from '../components/CustomSelect';
import { EvaluacionesEmpleado } from '../components/EvaluacionesEmpleado';

// Formato de fechas compacto y legible idéntico al boceto: "10 - 13 nov 2026"
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

// Formato de fecha corta para tareas idéntico al boceto: "26 oct"
const formatFechaCorta = (fechaStr?: string): string => {
  if (!fechaStr) return '';
  const meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  const partes = fechaStr.split('-');
  if (partes.length === 3) {
    const dia = parseInt(partes[2], 10);
    const mesIdx = parseInt(partes[1], 10) - 1;
    return `${dia} ${meses[mesIdx] || ''}`;
  }
  return fechaStr;
};

// Separador inteligente de área y persona responsable para jerarquía visual
const parseResponsable = (resp?: string): { area?: string; persona: string } => {
  if (!resp) return { persona: 'Asignado' };
  const partes = resp.split(/[·•]/).map((s) => s.trim());
  if (partes.length >= 2) {
    return { area: partes[0], persona: partes.slice(1).join(' · ') };
  }
  return { persona: resp };
};

interface EmployeeMobileViewProps {
  session: DemoUserSession;
  nombreDepartamento?: string;
  saldo: SaldoVacaciones | null;
  solicitudes: Solicitud[];
  tiposSolicitud: TipoSolicitud[];
  onboardingTareas: OnboardingTarea[];
  evaluaciones?: Evaluacion[];
  criterios?: CriterioEvaluacion[];
  onSubmitSolicitud: (tipoId: string, desde: string, hasta: string, motivo: string) => Promise<boolean | string>;
  onToggleTarea: (tareaId: string, nuevoEstado: 'pendiente' | 'en_progreso' | 'completada') => Promise<boolean>;
  onDeleteSolicitud?: (solicitudId: string) => Promise<boolean>;
}

export const EmployeeMobileView: React.FC<EmployeeMobileViewProps> = ({
  session,
  nombreDepartamento,
  saldo,
  solicitudes,
  tiposSolicitud,
  onboardingTareas,
  evaluaciones = [],
  criterios = [],
  onSubmitSolicitud,
  onToggleTarea,
  onDeleteSolicitud,
}) => {
  const [activeTab, setActiveTab] = useState<'solicitar' | 'historial' | 'desempeno'>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      if (tabParam === 'historial') return 'historial';
      if (tabParam === 'desempeno' || tabParam === 'evaluaciones' || tabParam === 'onboarding' || tabParam === 'tramites') {
        return 'desempeno';
      }
    }
    return 'solicitar';
  });
  const tiposActivos = useMemo(() => tiposSolicitud.filter((tipo) => tipo.activo !== false), [tiposSolicitud]);
  const [tipoId, setTipoId] = useState(
    () => tiposActivos.find((t) => t.id === 'tipo_vacaciones')?.id || tiposActivos[0]?.id || ''
  );
  useEffect(() => {
    if (!tiposActivos.some((tipo) => tipo.id === tipoId)) {
      setTipoId(tiposActivos.find((tipo) => tipo.id === 'tipo_vacaciones')?.id || tiposActivos[0]?.id || '');
    }
  }, [tiposActivos, tipoId]);
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [motivo, setMotivo] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [showInfoTooltip, setShowInfoTooltip] = useState(false);
  const [solicitudAEliminar, setSolicitudAEliminar] = useState<Solicitud | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteNotice, setDeleteNotice] = useState<string | null>(null);
  const [errorTarea, setErrorTarea] = useState<string | null>(null);
  const [tareaActualizando, setTareaActualizando] = useState<string | null>(null);

  const cambiarEstadoTarea = async (id: string, estado: 'pendiente' | 'completada') => {
    if (tareaActualizando) return;
    setErrorTarea(null);
    setTareaActualizando(id);
    try {
      if (!(await onToggleTarea(id, estado))) setErrorTarea('No se pudo actualizar la tarea. Inténtalo nuevamente.');
    } catch {
      setErrorTarea('No se pudo actualizar la tarea. Inténtalo nuevamente.');
    } finally {
      setTareaActualizando(null);
    }
  };

  const selectedTipo = tiposActivos.find((t) => t.id === tipoId);
  const descuentaSaldo = selectedTipo ? selectedTipo.descuenta_saldo : true;

  // Metadatos útiles, diferenciados y contextuales para cada tipo de solicitud
  const getTipoDetalles = (t: TipoSolicitud) => {
    const id = t.id.toLowerCase();
    const nombre = t.nombre.toLowerCase();

    if (t.descuenta_saldo) {
      return {
        badge: 'Descuenta Saldo' as const,
        badgeColor: 'amber' as const,
        description: 'Descuenta días de tu saldo disponible de vacaciones',
      };
    }
    if (id.includes('medico') || nombre.includes('médic') || nombre.includes('iess')) {
      return {
        badge: 'Sin Descuento' as const,
        badgeColor: 'emerald' as const,
        description: 'Consultas de salud o reposo médico con certificado',
      };
    }
    if (id.includes('calamidad') || nombre.includes('calamidad')) {
      return {
        badge: 'Sin Descuento' as const,
        badgeColor: 'emerald' as const,
        description: 'Duelo, siniestro o emergencia familiar justificada',
      };
    }
    if (id.includes('paternidad') || nombre.includes('matern') || nombre.includes('patern')) {
      return {
        badge: 'Sin Descuento' as const,
        badgeColor: 'emerald' as const,
        description: 'Licencia por nacimiento o cuidado del recién nacido',
      };
    }
    return {
      badge: 'Sin Descuento' as const,
      badgeColor: 'emerald' as const,
      description: 'Gestiones personales o bancarias autorizadas por jefatura',
    };
  };

  // Opciones formateadas con diseño enriquecido y descripciones útiles y claras
  const tipoOptions: CustomSelectOption[] = useMemo(() => {
    return tiposActivos.map((t) => {
      const meta = getTipoDetalles(t);
      return {
        value: t.id,
        label: t.nombre,
        badge: meta.badge,
        badgeColor: meta.badgeColor,
        description: meta.description,
      };
    });
  }, [tiposActivos]);

  const misSolicitudes = useMemo(() => {
    return solicitudes.filter((s) => s.empleado_id === session.empleadoId);
  }, [solicitudes, session.empleadoId]);

  const misEvaluaciones = useMemo(() => {
    return (evaluaciones || []).filter((e) => e.empleado_id === session.empleadoId);
  }, [evaluaciones, session.empleadoId]);

  const tareasCompletadas = useMemo(() => {
    return onboardingTareas.filter((t) => t.estado === 'completada').length;
  }, [onboardingTareas]);

  const pctOnboarding = onboardingTareas.length > 0
    ? Math.round((tareasCompletadas / onboardingTareas.length) * 100)
    : 0;

  const tareasPendientes = useMemo(() => {
    return onboardingTareas.filter((t) => t.estado !== 'completada');
  }, [onboardingTareas]);

  const tareasCompletadasList = useMemo(() => {
    return onboardingTareas.filter((t) => t.estado === 'completada');
  }, [onboardingTareas]);

  // Configuración visual reactiva del módulo de Onboarding con cambio dinámico de color
  const onboardingTier = useMemo(() => {
    const total = onboardingTareas.length;
    const pendientes = tareasPendientes.length;
    const vencidas = tareasPendientes.filter((t) => isTareaVencida(t.fecha_limite)).length;

    // Caso 1: Hay tareas vencidas (Alerta prioritaria - Ámbar / Rojo suave)
    if (vencidas > 0) {
      return {
        tipo: 'vencidas' as const,
        border: 'border-rose-200/90',
        aura: 'bg-rose-200/50',
        iconBg: 'bg-rose-50 border-rose-200 text-rose-600',
        badgeBg: 'bg-[#fee2e2] text-[#e11d48] border border-[#fecdd3]',
        badgeText: `${vencidas} ${vencidas === 1 ? 'vencida' : 'vencidas'}`,
        badgeIcon: AlertCircle,
        progressBar: 'bg-gradient-to-r from-amber-400 via-rose-400 to-rose-500',
        statusText: 'Requiere atención',
        statusTextColor: 'text-rose-600',
      };
    }

    // Caso 2: 100% completado (Éxito total - Verde Lima institucional #a8ffa1 a #5ec942)
    if (total > 0 && pendientes === 0) {
      return {
        tipo: 'completado' as const,
        border: 'border-[#a8ffa1]',
        aura: 'bg-[#a8ffa1]/50',
        iconBg: 'bg-[#a8ffa1]/30 border-[#86e27f] text-[#004828]',
        badgeBg: 'bg-[#a8ffa1] text-[#004828] border border-[#86e27f]',
        badgeText: '¡100% completado!',
        badgeIcon: Check,
        progressBar: 'bg-gradient-to-r from-[#a8ffa1] to-[#5ec942]',
        statusText: '¡Onboarding finalizado!',
        statusTextColor: 'text-[#004828]',
      };
    }

    // Caso 3: En buen ritmo (>= 50% completadas y 0 vencidas - Verde oficial #a8ffa1 a #5ec942)
    if (pctOnboarding >= 50) {
      return {
        tipo: 'buen_ritmo' as const,
        border: 'border-slate-200/90',
        aura: 'bg-[#a8ffa1]/35',
        iconBg: 'bg-[#a8ffa1]/30 border-[#86e27f] text-[#004828]',
        badgeBg: 'bg-[#a8ffa1]/40 text-[#004828] border border-[#86e27f]',
        badgeText: 'Al día',
        badgeIcon: Sparkles,
        progressBar: 'bg-gradient-to-r from-[#a8ffa1] to-[#5ec942]',
        statusText: `${pendientes} ${pendientes === 1 ? 'pendiente' : 'pendientes'}`,
        statusTextColor: 'text-slate-600',
      };
    }

    // Caso 4: En progreso inicial (< 50% y 0 vencidas - Celeste institucional Nivel 2)
    return {
      tipo: 'en_progreso' as const,
      border: 'border-slate-200/90',
      aura: 'bg-sky-200/40',
      iconBg: 'bg-sky-50 border-sky-200 text-sky-700',
      badgeBg: 'bg-sky-50 text-sky-800 border border-sky-200',
      badgeText: `${pendientes} pendientes`,
      badgeIcon: Clock,
      progressBar: 'bg-gradient-to-r from-[#7dd3fc] to-[#0284c7]',
      statusText: `${pendientes} ${pendientes === 1 ? 'pendiente' : 'pendientes'}`,
      statusTextColor: 'text-slate-600',
    };
  }, [onboardingTareas.length, tareasPendientes, pctOnboarding]);

  // Cálculo en vivo de días solicitados
  const diasCalculados = useMemo(() => {
    if (!fechaDesde || !fechaHasta) return 0;
    const fDesde = new Date(fechaDesde);
    const fHasta = new Date(fechaHasta);
    if (fHasta < fDesde) return 0;
    return Math.ceil((fHasta.getTime() - fDesde.getTime()) / (1000 * 3600 * 24)) + 1;
  }, [fechaDesde, fechaHasta]);

  // Datos numéricos seguros de saldo
  const diasDerecho = Number(saldo?.dias_derecho ?? 15);
  const diasTomados = Number(saldo?.dias_tomados ?? 0);
  const diasDisponibles = Number(saldo?.dias_pendientes ?? (diasDerecho - diasTomados));

  // Configuración visual reactiva según los días disponibles (Boceto 3 Niveles: Verde, Celeste, Ámbar)
  const balanceTier = useMemo(() => {
    if (diasDisponibles >= 8) {
      // Nivel 1: Saldo Abundante (Verde Lima #a8ffa1)
      return {
        border: 'border-[#a8ffa1]',
        aura: 'bg-[#a8ffa1]/35',
        number: 'text-[#4ec432]',
        bar: 'bg-gradient-to-r from-[#a8ffa1] to-[#5ec942]',
      };
    }
    if (diasDisponibles >= 4) {
      // Nivel 2: Saldo Moderado (Celeste / Sky Blue del nuevo boceto)
      return {
        border: 'border-[#38bdf8]',
        aura: 'bg-[#38bdf8]/35',
        number: 'text-[#0284c7]',
        bar: 'bg-gradient-to-r from-[#7dd3fc] to-[#0284c7]',
      };
    }
    // Nivel 3: Saldo Crítico (Ámbar / Naranja Cálido del nuevo boceto - Sin Rojo)
    return {
      border: 'border-[#f59e0b]',
      aura: 'bg-[#fef08a]/40',
      number: 'text-[#f59e0b]',
      bar: 'bg-gradient-to-r from-[#fde047] to-[#f59e0b]',
    };
  }, [diasDisponibles]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!selectedTipo) { setValidationError('Selecciona un tipo de solicitud disponible.'); return; }

    if (!fechaDesde || !fechaHasta || !motivo.trim()) {
      setValidationError('Por favor completa las fechas y el motivo.');
      return;
    }

    const validation = validateVacationRequest(
      saldo,
      misSolicitudes,
      fechaDesde,
      fechaHasta,
      descuentaSaldo
    );

    if (!validation.isValid) {
      setValidationError(validation.errorMessage || 'Solicitud no permitida.');
      return;
    }

    setIsSubmitting(true);
    let success: boolean | string = false;
    try { success = await onSubmitSolicitud(tipoId, fechaDesde, fechaHasta, motivo.trim()); }
    catch { success = false; }
    finally { setIsSubmitting(false); }

    if (success === true) {
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
      setFechaDesde('');
      setFechaHasta('');
      setMotivo('');
      setActiveTab('historial');
    } else {
      setValidationError(typeof success === 'string' ? success : 'No se pudo registrar la solicitud. Inténtalo nuevamente.');
    }
  };

  // Manejo de confirmación de eliminación de tarjeta del historial (sin alterar saldos)
  const handleConfirmDelete = async () => {
    if (!solicitudAEliminar || !onDeleteSolicitud) return;
    setIsDeleting(true);
    const ok = await onDeleteSolicitud(solicitudAEliminar.id);
    setIsDeleting(false);
    if (ok) {
      setDeleteNotice('Tarjeta eliminada de tu historial correctamente.');
      setSolicitudAEliminar(null);
      setTimeout(() => setDeleteNotice(null), 3500);
    }
  };

  return (
    <div className="max-w-lg mx-auto pb-8 px-3.5 sm:px-4 pt-2 sm:pt-4 space-y-3.5 sm:space-y-4 animate-enter">
      
      {/* 1. Header de Bienvenida & Contexto Personal */}
      <div className="pt-1">
        <h1 className="text-xl font-bold tracking-tight text-slate-900">
          Hola, {session.nombre.split(' ')[0]}
        </h1>
        <p className="text-xs text-slate-500 mt-0.5 font-medium">
          {session.cargo}{nombreDepartamento ? ` • ${nombreDepartamento}` : ''}
        </p>
      </div>

      {/* 2. Tablero de Saldo Vacacional (Reactivo con Cambio de Color según Días Disponibles) */}
      <div className={`relative overflow-hidden bg-white rounded-2xl sm:rounded-3xl border-2 ${balanceTier.border} p-4 sm:p-5 shadow-soft transition-colors duration-300`}>
        
        {/* Halo de luz suave decorativo reactivo en esquina superior derecha */}
        <div 
          className={`absolute -top-10 -right-10 w-40 h-40 rounded-full ${balanceTier.aura} blur-2xl pointer-events-none transition-colors duration-300`}
          aria-hidden="true" 
        />

        {/* Fila superior: Título e Icono de Información (i) */}
        <div className="relative flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
            Saldo anual de vacaciones
          </h2>
          <button 
            type="button"
            onClick={() => setShowInfoTooltip(!showInfoTooltip)}
            className="p-1 rounded-full text-slate-400 hover:text-slate-700 active:scale-95 transition-all focus:outline-none"
            title="Información sobre tu saldo"
            aria-label="Ver información sobre saldo reglamentario"
          >
            <Info className="w-5 h-5" />
          </button>
        </div>

        {/* Mensaje emergente al tocar el icono de información */}
        {showInfoTooltip && (
          <div className="relative mt-2 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 animate-enter leading-relaxed">
            {saldo ? `Saldo registrado para el año ${saldo.anio}.` : 'No se encontró un saldo para el año actual.'}
          </div>
        )}

        {saldo ? <>
        {/* Métrica principal: Gran número con color dinámico + "Días disponibles" */}
        <div className="relative mt-2.5 mb-2.5 flex items-baseline gap-2.5 sm:gap-3">
          <span className={`text-4xl sm:text-5xl font-black ${balanceTier.number} tracking-tight tabular-nums transition-colors duration-300`}>
            {diasDisponibles}
          </span>
          <span className="text-sm sm:text-base font-bold text-slate-900">
            Días disponibles
          </span>
        </div>

        {/* Barra horizontal de balance del boceto con color reactivo */}
        <div className="relative w-full h-2 bg-slate-100 rounded-full overflow-hidden">
          <div 
            className={`h-full ${balanceTier.bar} rounded-full transition-all duration-500 ease-out`}
            style={{ 
              width: `${Math.min(100, Math.max(8, Math.round((diasDisponibles / (diasDerecho || 15)) * 100)))}%` 
            }}
          />
        </div>

        {/* Texto inferior de uso según el boceto */}
        <div className="relative mt-2 text-xs sm:text-sm font-medium text-slate-500">
          {diasTomados === 0 
            ? 'Ningún día usado' 
            : `${diasTomados} ${Number(diasTomados) === 1 ? 'día usado' : 'días usados'}`}
        </div>
        </> : <p className="relative mt-4 text-sm font-medium text-slate-700">Saldo no disponible. Consulta con RR. HH.</p>}
      </div>

      {/* 3. Selector de Pestañas Móvil (Segmented Control Neutro de Alta Gama) */}
      <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100/90 rounded-2xl border border-slate-200/80">
        <button
          onClick={() => setActiveTab('solicitar')}
          className={`btn-pressable py-2.5 px-2 rounded-xl text-xs font-bold transition-all text-center flex items-center justify-center gap-1.5 ${
            activeTab === 'solicitar'
              ? 'bg-white text-slate-900 shadow-sm border border-slate-200/90'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Calendar className="w-3.5 h-3.5 flex-shrink-0 text-slate-700" />
          <span className="truncate">Solicitar</span>
        </button>

        <button
          onClick={() => setActiveTab('historial')}
          className={`btn-pressable py-2.5 px-2 rounded-xl text-xs font-bold transition-all text-center flex items-center justify-center gap-1.5 ${
            activeTab === 'historial'
              ? 'bg-white text-slate-900 shadow-sm border border-slate-200/90'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Clock className="w-3.5 h-3.5 flex-shrink-0 text-slate-700" />
          <span className="truncate">Historial ({misSolicitudes.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('desempeno')}
          className={`btn-pressable py-2.5 px-2 rounded-xl text-xs font-bold transition-all text-center flex items-center justify-center gap-1.5 ${
            activeTab === 'desempeno'
              ? 'bg-white text-slate-900 shadow-sm border border-slate-200/90'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Award className="w-3.5 h-3.5 flex-shrink-0 text-slate-700" />
          <span className="truncate">Desempeño</span>
        </button>
      </div>

      {/* 4. Pestaña 1: Formulario Limpio & Usable */}
      {activeTab === 'solicitar' && (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-soft space-y-3.5">
          
          <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100">
            <div className="p-2 rounded-xl bg-slate-100 text-slate-700 border border-slate-200/80">
              <Calendar className="w-4 h-4 text-slate-600" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Registrar Solicitud
              </h3>
              <p className="text-[11px] text-slate-500">
                Calcula automáticamente los días del período solicitado.
              </p>
            </div>
          </div>

          {validationError && (
            <div role="alert" className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <span>{validationError}</span>
            </div>
          )}

          {/* Tipo de Solicitud (Selector Personalizado con Estilo de la App) */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">
              Tipo de Permiso o Vacaciones
            </label>
            {tiposActivos.length > 0 && <CustomSelect
              value={tipoId}
              onChange={setTipoId}
              options={tipoOptions}
              ariaLabel="Seleccionar tipo de permiso o vacaciones"
            />}
            {tiposActivos.length === 0 && <p className="text-sm text-slate-600">No hay tipos de solicitud disponibles. Contacta a RR. HH.</p>}
            {selectedTipo && <p className="text-xs leading-relaxed text-slate-700" aria-live="polite">
              {descuentaSaldo ? 'Al aprobarse, esta solicitud descontará días de tu saldo de vacaciones.' : 'Esta solicitud no descontará días de tu saldo de vacaciones.'}
            </p>}
          </div>

          {/* Selector de Rango de Fechas */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5 min-w-0">
              <label className="block text-xs font-bold text-slate-700">
                Fecha Desde
              </label>
              <input
                type="date"
                value={fechaDesde}
                onChange={(e) => setFechaDesde(e.target.value)}
                className="w-full text-xs font-medium text-slate-800 bg-slate-50/70 border border-slate-200 rounded-xl p-3 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00c290]/30 focus:border-[#00c290] transition-all min-w-0"
                required
              />
            </div>

            <div className="space-y-1.5 min-w-0">
              <label className="block text-xs font-bold text-slate-700">
                Fecha Hasta
              </label>
              <input
                type="date"
                value={fechaHasta}
                onChange={(e) => setFechaHasta(e.target.value)}
                className="w-full text-xs font-medium text-slate-800 bg-slate-50/70 border border-slate-200 rounded-xl p-3 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00c290]/30 focus:border-[#00c290] transition-all min-w-0"
                required
              />
            </div>
          </div>

          {/* Chip Informativo Dinámico en Vivo */}
          {diasCalculados > 0 && (
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs text-slate-700 animate-enter">
              <div className="flex items-center gap-1.5">
                <Info className="w-4 h-4 text-slate-500" />
                <span className="font-semibold">Días calculados para esta solicitud:</span>
              </div>
              <span className="text-sm font-extrabold tabular-nums bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-soft text-slate-900">
                {diasCalculados} {diasCalculados === 1 ? 'día' : 'días'}
              </span>
            </div>
          )}

          {/* Motivo */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">
              Motivo o Justificación
            </label>
            <textarea
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Ej. Vacaciones anuales planificadas en familia..."
              rows={2}
              className="w-full text-xs sm:text-sm font-medium text-slate-800 bg-slate-50/70 border border-slate-200 rounded-xl p-3 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00c290]/30 focus:border-[#00c290] transition-all placeholder:text-slate-400"
              required
            />
          </div>

          {/* Botón de Acción Principal con Color de Rol #a8ffa1 (Vibrante, Táctil y Armónico) */}
          <button
            type="submit"
            disabled={isSubmitting || !selectedTipo}
            className="btn-pressable w-full py-3 sm:py-3.5 bg-[#a8ffa1] hover:bg-[#96f78e] active:scale-[0.98] text-[#003820] text-sm font-extrabold rounded-xl shadow-[0_2px_12px_rgba(168,255,161,0.45)] flex items-center justify-center gap-2 border border-[#86e27f] disabled:opacity-50 transition-all cursor-pointer min-h-[44px]"
          >
            <Send className="w-4 h-4 text-[#004828]" />
            <span>{isSubmitting ? 'Enviando Solicitud...' : 'Enviar Solicitud al Jefe'}</span>
          </button>
        </form>
      )}

      {/* 5. Pestaña 2: Historial de Solicitudes (Fiel al Boceto y Reglas de Diseño) */}
      {activeTab === 'historial' && (
        <div className="space-y-4">
          {/* Notificación tras eliminar solicitud */}
          {deleteNotice && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2.5 text-xs text-emerald-800 font-semibold animate-enter">
              <Sparkles className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>{deleteNotice}</span>
            </div>
          )}

          {misSolicitudes.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-3xl border border-slate-200/90 shadow-soft space-y-2">
              <Clock className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-sm font-bold text-slate-700">No tienes solicitudes registradas aún</p>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                Usa la pestaña "Solicitar" para registrar tus primeros días de vacaciones o permisos laborales.
              </p>
            </div>
          ) : (
            misSolicitudes.map((sol) => {
              const isRechazada = sol.estado === 'rechazada';
              const isAprobada = sol.estado === 'aprobada';
              const isPendiente = !isRechazada && !isAprobada;

              return (
                <div 
                  key={sol.id} 
                  className="group relative overflow-hidden bg-white rounded-3xl border border-slate-200/90 p-5 shadow-soft transition-all duration-200 hover:shadow-md"
                >
                  {/* Halo de luz decorativo reactivo en esquina superior derecha (exacto al boceto) */}
                  <div 
                    className={`absolute -top-10 -right-10 w-36 h-36 rounded-full blur-2xl pointer-events-none transition-colors duration-300 ${
                      isRechazada 
                        ? 'bg-rose-200/50' 
                        : isAprobada 
                        ? 'bg-[#a8ffa1]/40' 
                        : 'bg-amber-100/60'
                    }`}
                    aria-hidden="true" 
                  />

                  {/* Fila Superior: Pill de Estado + Días + Botón Creativo de Eliminación */}
                  <div className="relative flex items-center justify-between gap-2">
                    {/* Badge de Estado con Icono */}
                    {isRechazada && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-[#fee2e2] text-[#e11d48] border border-[#fecdd3] flex-shrink-0">
                        <X className="w-3.5 h-3.5 stroke-[3] text-[#e11d48]" />
                        <span>Rechazada</span>
                      </span>
                    )}
                    {isAprobada && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-[#a8ffa1] text-[#004828] border border-[#86e27f] flex-shrink-0">
                        <Check className="w-3.5 h-3.5 stroke-[3] text-[#004828]" />
                        <span>Aprobada</span>
                      </span>
                    )}
                    {isPendiente && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-amber-100 text-amber-900 border border-amber-200 flex-shrink-0">
                        <Clock className="w-3.5 h-3.5 stroke-[2.5] text-amber-800" />
                        <span>Pendiente</span>
                      </span>
                    )}

                    {/* Días y Botón de Eliminación Creativo */}
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <span className="text-sm font-semibold text-slate-800 tabular-nums">
                        {sol.dias} {Number(sol.dias) === 1 ? 'dia' : 'dias'}
                      </span>
                      {onDeleteSolicitud && (
                        <button
                          type="button"
                          onClick={() => setSolicitudAEliminar(sol)}
                          className="p-1.5 -mr-1 rounded-full text-slate-400 hover:text-rose-600 hover:bg-rose-50 active:scale-95 transition-all focus:outline-none"
                          title="Eliminar del historial"
                          aria-label={`Eliminar solicitud de ${sol.motivo}`}
                        >
                          <Trash2 className="w-4 h-4 text-slate-400 hover:text-rose-600 transition-colors" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Fila Media: Título / Motivo Principal */}
                  <h3 className="relative text-base sm:text-lg font-bold text-slate-900 tracking-tight mt-3">
                    {sol.motivo}
                  </h3>

                  {/* Fila de Fechas con Icono de Calendario */}
                  <div className="relative flex items-center gap-1.5 text-xs font-semibold text-slate-500 mt-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <span>{formatFechaRango(sol.fecha_desde, sol.fecha_hasta)}</span>
                  </div>

                  {/* Fila Inferior: Cajita Gris de Comentario (idéntica al boceto) */}
                  <div className="relative mt-3.5 p-3.5 rounded-2xl bg-slate-50 border border-slate-100/90 text-xs space-y-0.5">
                    <span className="font-bold text-slate-700 block text-[11px] sm:text-xs">Comentario:</span>
                    <p className="text-slate-600 leading-relaxed font-normal text-[11px] sm:text-xs">
                      {sol.comentario || (
                        isAprobada
                          ? 'Disfruta de tus vacaciones familiares :)'
                          : isRechazada
                          ? 'Ese día tenemos realización de inventario y necesitamos a todo el equipo.'
                          : 'En espera de revisión por tu jefatura directa.'
                      )}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* 6. Pestaña 3: Desempeño y Onboarding (Requerimiento Original Brief) */}
      {activeTab === 'desempeno' && (
        <div className="space-y-6 animate-enter">
          
          {/* SECCIÓN 1: Evaluaciones de Desempeño Ponderadas (Última Evaluación + Historial Desplegable) */}
          <EvaluacionesEmpleado
            evaluaciones={misEvaluaciones}
            empresaId={session.empresaId}
            empleadoId={session.empleadoId}
            criterios={criterios}
          />

          {/* SECCIÓN 2: Tarjeta Unificada de Tareas de Onboarding (Con Jerarquía Optimizada y Colores Reactivos) */}
          <div className={`relative overflow-hidden bg-white rounded-3xl border ${onboardingTier.border} p-5 sm:p-6 shadow-soft transition-all duration-300`}>
            {/* Halo de luz decorativo reactivo en esquina superior derecha según estado */}
            <div 
              className={`absolute -top-10 -right-10 w-36 h-36 rounded-full ${onboardingTier.aura} blur-2xl pointer-events-none transition-colors duration-500`}
              aria-hidden="true" 
            />

            {/* Cabecera del Onboarding con Icono Squircle Dinámico + Título + Badge de Estado Reactivo */}
            <div className="relative flex items-center justify-between gap-2">
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-10 h-10 rounded-2xl border flex items-center justify-center flex-shrink-0 transition-colors duration-300 ${onboardingTier.iconBg}`}>
                  <ClipboardCheck className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight truncate">
                    Tareas de onboarding
                  </h2>
                  <p className="text-[11px] text-slate-500 font-medium truncate">
                    Plan de integración y cumplimiento
                  </p>
                </div>
              </div>

              {/* Badge de Estado Dinámico de la Cabecera */}
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold flex-shrink-0 transition-all duration-300 ${onboardingTier.badgeBg}`}>
                <onboardingTier.badgeIcon className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>{onboardingTier.badgeText}</span>
              </span>
            </div>

            {/* Barra de Progreso y Métrica "X de Y completadas" con color verde institucional (#a8ffa1 a #5ec942) y reactivo */}
            <div className="relative mt-4">
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/60">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ease-out ${onboardingTier.progressBar}`}
                  style={{ width: `${pctOnboarding}%` }}
                />
              </div>
              <div className="mt-2.5 flex items-center justify-between text-xs">
                <span className="font-extrabold text-slate-800 tabular-nums">
                  {tareasCompletadas} de {onboardingTareas.length} completadas ({pctOnboarding}%)
                </span>
                <span className={`text-[11px] font-bold ${onboardingTier.statusTextColor}`}>
                  {onboardingTier.statusText}
                </span>
              </div>
            </div>

            {errorTarea && <p role="alert" className="relative mt-4 text-sm font-medium text-rose-700">{errorTarea}</p>}

            {/* Bloque 1: PENDIENTES · Con Jerarquía Estricta y Diferenciación Clara */}
            {tareasPendientes.length > 0 && (
              <div className="relative mt-5 pt-4 border-t border-slate-100 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-[11px] font-extrabold text-slate-400 tracking-wider uppercase">
                    PENDIENTES
                  </h3>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold tabular-nums ${
                    onboardingTier.tipo === 'vencidas' 
                      ? 'bg-rose-100 text-rose-700 border border-rose-200' 
                      : 'bg-slate-100 text-slate-600 border border-slate-200'
                  }`}>
                    {tareasPendientes.length} {tareasPendientes.length === 1 ? 'tarea' : 'tareas'}
                  </span>
                </div>

                <div className="space-y-2.5">
                  {tareasPendientes.map((tarea) => {
                    const vencida = isTareaVencida(tarea.fecha_limite);
                    const { area, persona } = parseResponsable(tarea.responsable);

                    return (
                      <button
                        type="button"
                        key={tarea.id}
                        aria-label={`Completar tarea: ${tarea.tarea}`}
                        disabled={Boolean(tareaActualizando)}
                        onClick={() => void cambiarEstadoTarea(tarea.id, 'completada')}
                        className={`group w-full text-left p-3.5 rounded-2xl border transition-transform duration-200 cursor-pointer select-none active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 disabled:opacity-60 flex items-start gap-3.5 ${
                          vencida
                            ? 'bg-rose-50/40 border-rose-200/90 hover:bg-rose-50/70 hover:border-rose-300'
                            : 'bg-slate-50/60 border-slate-200/80 hover:bg-white hover:border-slate-300 hover:shadow-xs'
                        }`}
                      >
                        {/* Checkbox circular táctil con respuesta visual inmediata */}
                        <div className="mt-0.5 flex-shrink-0">
                          <div 
                            className={`w-5 h-5 rounded-full border-2 bg-white flex items-center justify-center transition-all ${
                              vencida
                                ? 'border-rose-300 group-hover:border-[#5ec942]'
                                : 'border-slate-400 group-hover:border-[#5ec942] group-hover:bg-[#a8ffa1]/10'
                            }`}
                            aria-hidden="true"
                          />
                        </div>

                        {/* Contenido con Jerarquía Estricta: 1. Título -> 2. Alerta/Fecha -> 3. Responsable/Área */}
                        <div className="flex-1 min-w-0 space-y-2">
                          {/* Prioridad 1: Nombre de la Tarea (Más prominente) */}
                          <p className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">
                            {tarea.tarea}
                          </p>

                          {/* Fila de Metadatos: Alerta primero, contexto después */}
                          <div className="flex flex-wrap items-center gap-2">
                            {/* Prioridad 2: Alerta de Vencimiento / Fecha Límite */}
                            {vencida ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#fee2e2] text-[#e11d48] border border-[#fecdd3]">
                                <Clock className="w-3 h-3 stroke-[2.5]" />
                                <span>Vencida · {formatFechaCorta(tarea.fecha_limite)}</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white text-slate-600 border border-slate-200 shadow-2xs">
                                <Clock className="w-3 h-3 stroke-[2]" />
                                <span>Límite · {formatFechaCorta(tarea.fecha_limite)}</span>
                              </span>
                            )}

                            {/* Prioridad 3: Área y Responsable */}
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
                              {area && (
                                <span className="px-1.5 py-0.5 rounded bg-slate-200/70 text-[9px] font-extrabold text-slate-700 uppercase tracking-wider">
                                  {area}
                                </span>
                              )}
                              <span className="flex items-center gap-1 text-slate-600">
                                <User className="w-3 h-3 text-slate-400" />
                                {persona}
                              </span>
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Bloque 2: COMPLETADAS · Con Jerarquía Atenuada para Reducir Carga Cognitiva */}
            {tareasCompletadasList.length > 0 && (
              <div className="relative mt-5 pt-4 border-t border-slate-100 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-[11px] font-extrabold text-slate-400 tracking-wider uppercase">
                    COMPLETADAS
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#a8ffa1]/40 text-[#004828] border border-[#86e27f] tabular-nums">
                    {tareasCompletadasList.length} {tareasCompletadasList.length === 1 ? 'lista' : 'listas'}
                  </span>
                </div>

                <div className="space-y-2.5">
                  {tareasCompletadasList.map((tarea) => {
                    const { area, persona } = parseResponsable(tarea.responsable);

                    return (
                      <button
                        type="button"
                        key={tarea.id}
                        aria-label={`Desmarcar tarea: ${tarea.tarea}`}
                        disabled={Boolean(tareaActualizando)}
                        onClick={() => void cambiarEstadoTarea(tarea.id, 'pendiente')}
                        className="group w-full text-left p-3.5 rounded-2xl bg-slate-50/40 border border-slate-100 hover:bg-slate-50 hover:border-slate-200 transition-transform duration-200 cursor-pointer select-none active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 disabled:opacity-60 flex items-start gap-3.5"
                      >
                        {/* Checkbox circular lleno con el verde oficial de la app (#a8ffa1 a #5ec942) */}
                        <div className="mt-0.5 flex-shrink-0">
                          <div 
                            className="w-5 h-5 rounded-full bg-gradient-to-r from-[#a8ffa1] to-[#5ec942] text-[#004828] border border-[#86e27f] flex items-center justify-center shadow-xs transition-transform group-hover:scale-105"
                            aria-hidden="true"
                          >
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </div>
                        </div>

                        {/* Contenido Completado: tipografía atenuada en gris descansado */}
                        <div className="flex-1 min-w-0 space-y-1">
                          <p className="text-xs sm:text-sm font-semibold text-slate-500 line-through decoration-slate-300 leading-snug">
                            {tarea.tarea}
                          </p>
                          
                          <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400 font-medium">
                            {area && (
                              <span className="px-1.5 py-0.5 rounded bg-slate-200/50 text-[9px] font-bold text-slate-500 uppercase">
                                {area}
                              </span>
                            )}
                            <span>{persona}</span>
                            <span>·</span>
                            <span className="text-slate-500 font-semibold">{formatFechaCorta(tarea.fecha_limite)}</span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

        </div>
      )}

      {/* Modal Creativo de Confirmación de Eliminación con Retroalimentación de Saldo */}
      {solicitudAEliminar && (
        <div 
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/40 backdrop-blur-sm"
          onClick={() => !isDeleting && setSolicitudAEliminar(null)}
        >
          <div 
            className="w-full max-w-sm bg-white rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl border border-slate-100 space-y-4 animate-enter"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-900">¿Eliminar del historial?</h4>
                  <p className="text-xs text-slate-500">Gestión de solicitud personal</p>
                </div>
              </div>
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setSolicitudAEliminar(null)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 active:scale-95 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mini Tarjeta Resumen */}
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
              <p className="text-xs font-bold text-slate-900">{solicitudAEliminar.motivo}</p>
              <p className="text-[11px] text-slate-500 flex items-center gap-1.5 font-medium">
                <Calendar className="w-3 h-3 text-slate-400" />
                <span>{formatFechaRango(solicitudAEliminar.fecha_desde, solicitudAEliminar.fecha_hasta)}</span>
                <span>•</span>
                <span className="font-semibold text-slate-700">{solicitudAEliminar.dias} {Number(solicitudAEliminar.dias) === 1 ? 'día' : 'dias'}</span>
              </p>
            </div>

            {/* Mensaje Informativo */}
            <p className="text-xs text-slate-500 leading-relaxed">
              Esta tarjeta se removerá de tu historial para que no se acumule. Tu saldo y días de vacaciones se mantendrán intactos.
            </p>

            {/* Acciones */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setSolicitudAEliminar(null)}
                className="py-3 px-4 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 active:scale-[0.98] transition-all cursor-pointer"
              >
                Conservar
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-[0.98] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? (
                  <span>Eliminando...</span>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Eliminar</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
