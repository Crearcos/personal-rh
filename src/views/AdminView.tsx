import React, { useState, useMemo } from 'react';
import {
  Users,
  FileSpreadsheet,
  FileText,
  RotateCcw,
  Activity,
  CheckCircle2,
  LayoutDashboard,
  BarChart3,
  Settings,
  Search,
} from 'lucide-react';
import type {
  Empleado,
  Departamento,
  Solicitud,
  SaldoVacaciones,
  Evaluacion,
  OnboardingTarea,
  RegistroActividad,
  DemoUserSession,
  TipoSolicitud,
  Usuario,
} from '../types/models';
import {
  exportVacationBalancesToExcel,
  exportVacationBalancesToPdf,
  type ReporteItem,
} from '../services/report.service';
import { CustomSelect } from '../components/CustomSelect';
import { PanelGeneralRRHH } from '../components/PanelGeneralRRHH';
import { DirectorioRRHH } from '../components/DirectorioRRHH';
import { OnboardingRRHH } from '../components/OnboardingRRHH';
import { RegistroAuditoriaRRHH } from '../components/RegistroAuditoriaRRHH';
import { ReportesRRHH } from '../components/ReportesRRHH';
import { ConfiguracionRRHH } from '../components/ConfiguracionRRHH';
import type { DatosTipoSolicitud, CriterioConfig, CriterioEvaluacion, PeriodoEvaluacion, DatosPeriodoEvaluacion } from '../types/models';
import type { DatosTarea } from '../services/onboardingValidacion';
import type { DatosEmpleadoRRHH, DatosEdicionColaborador, RolColaborador } from '../services/gestionRRHHValidation';
import { filtrarDirectorio, type EstadoDirectorio } from '../services/directorio.service';

interface AdminViewProps {
  session: DemoUserSession;
  empleados: Empleado[];
  usuarios?: Usuario[];
  onCambiarRol?: (empleadoId: string, rol: RolColaborador) => Promise<boolean>;
  departamentos: Departamento[];
  solicitudes: Solicitud[];
  saldos: SaldoVacaciones[];
  evaluaciones: Evaluacion[];
  onboardingTareas: OnboardingTarea[];
  actividades: RegistroActividad[];
  tiposSolicitud: TipoSolicitud[];
  criterios: CriterioEvaluacion[];
  periodos: PeriodoEvaluacion[];
  errorPanel: boolean;
  errorPeriodos?: boolean;
  errorDirectorio: boolean;
  errorOnboarding: boolean;
  errorAuditoria: boolean;
  nombreEmpresa: string;
  onReintentarPanel: () => void;
  onResetDemo: () => Promise<void>;
  isResetting: boolean;
  onToggleTarea: (tareaId: string, nuevoEstado: 'pendiente' | 'en_progreso' | 'completada') => Promise<boolean>;
  onGuardarTarea: (datos: DatosTarea) => Promise<boolean>;
  onEliminarTarea: (id: string, empleadoId: string) => Promise<boolean>;
  onAjustarSaldo: (saldo: SaldoVacaciones, dias: number) => Promise<boolean>;
  onAcreditarSaldo?: (saldo: SaldoVacaciones, dias: number, motivo: string, operacion: string) => Promise<boolean>;
  onCrearColaborador: (datos: DatosEmpleadoRRHH) => Promise<boolean>;
  onEditarColaborador: (datos: DatosEdicionColaborador) => Promise<boolean>;
  onDesactivarColaborador: (id: string) => Promise<boolean>;
  onReactivarColaborador: (id: string) => Promise<boolean>;
  onConsultarCorreo: (usuarioId: string) => Promise<string | null>;
  onCambiarCorreo: (id: string, correo: string) => Promise<boolean>;
  onVincularCuenta?: (id: string, correo: string, rol: RolColaborador) => Promise<'vinculada' | 'existente' | null>;
  onGuardarTipo: (datos: DatosTipoSolicitud) => Promise<boolean>;
  onCambiarEstadoTipo: (id: string, activo: boolean) => Promise<boolean>;
  onGuardarCriterios: (datos: CriterioConfig[]) => Promise<boolean>;
  onCrearPeriodo: (datos: DatosPeriodoEvaluacion) => Promise<boolean>;
  onCambiarEstadoPeriodo: (id: string, estado: 'abierto' | 'cerrado') => Promise<boolean>;
}

const TAB_DESCRIPTIONS: Record<
  'general' | 'directorio' | 'onboarding' | 'reportes' | 'auditoria' | 'configuracion',
  { title: string; description: string }
> = {
  general: {
    title: 'Panel General',
    description: 'Resumen ejecutivo de solicitudes pendientes, ausencias programadas y evaluaciones activas.',
  },
  directorio: {
    title: 'Directorio & Saldos',
    description: 'Gestión de colaboradores, consulta de saldos vacacionales, acreditación de días y acceso.',
  },
  onboarding: {
    title: 'Seguimiento de Onboarding',
    description: 'Control y supervisión de las tareas de inducción para nuevos colaboradores.',
  },
  reportes: {
    title: 'Reportes y Métricas',
    description: 'Generación y descarga de informes de ausencias, saldos y desempeño en Excel o PDF.',
  },
  auditoria: {
    title: 'Registro de Auditoría',
    description: 'Trazabilidad y registro cronológico de eventos institucionales y acciones del sistema.',
  },
  configuracion: {
    title: 'Configuración del Sistema',
    description: 'Parametrización de tipos de solicitud, períodos de evaluación y ponderación de criterios.',
  },
};

export const AdminView: React.FC<AdminViewProps> = ({
  session,
  empleados,
  usuarios,
  onCambiarRol,
  departamentos,
  solicitudes,
  saldos,
  evaluaciones,
  onboardingTareas,
  actividades,
  tiposSolicitud,
  criterios,
  periodos,
  errorPanel,
  errorPeriodos = false,
  errorDirectorio,
  errorOnboarding,
  errorAuditoria,
  nombreEmpresa,
  onReintentarPanel,
  onResetDemo,
  isResetting,
  onToggleTarea,
  onGuardarTarea,
  onEliminarTarea,
  onAjustarSaldo,
  onAcreditarSaldo,
  onCrearColaborador,
  onEditarColaborador,
  onDesactivarColaborador,
  onReactivarColaborador,
  onConsultarCorreo,
  onCambiarCorreo,
  onVincularCuenta,
  onGuardarTipo,
  onCambiarEstadoTipo,
  onGuardarCriterios,
  onCrearPeriodo,
  onCambiarEstadoPeriodo,
}) => {
  const [activeTab, setActiveTab] = useState<'general' | 'directorio' | 'onboarding' | 'auditoria' | 'reportes' | 'configuracion'>('general');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepto, setSelectedDepto] = useState('todos');
  const [estadoDirectorio, setEstadoDirectorio] = useState<EstadoDirectorio>('activos');

  // Mapa de saldos por empleado_id para acceso rápido O(1)
  const saldosMap = useMemo(() => {
    const map = new Map<string, SaldoVacaciones>();
    saldos.forEach((s) => map.set(s.empleado_id, s));
    return map;
  }, [saldos]);

  // Mapa de departamentos por id
  const deptosMap = useMemo(() => {
    const map = new Map<string, string>();
    departamentos.forEach((d) => map.set(d.id, d.nombre));
    return map;
  }, [departamentos]);

  // Filtrado de empleados
  const filteredEmpleados = useMemo(() => {
    return filtrarDirectorio(empleados, searchQuery, selectedDepto, estadoDirectorio);
  }, [empleados, selectedDepto, searchQuery, estadoDirectorio]);

  // Preparar datos para reporte
  const getReporteItems = (): ReporteItem[] => {
    return filteredEmpleados.map((emp) => {
      const saldo = saldosMap.get(emp.id);
      return {
        nombre: emp.nombre,
        cargo: emp.cargo,
        departamento: deptosMap.get(emp.departamento_id || '') || 'Sin asignar',
        diasDerecho: saldo ? Number(saldo.dias_derecho) : null,
        diasTomados: saldo ? Number(saldo.dias_tomados) : null,
        diasPendientes: saldo ? Number(saldo.dias_pendientes) : null,
      };
    });
  };

  const handleExportExcel = () => {
    const items = getReporteItems();
    exportVacationBalancesToExcel(items, nombreEmpresa);
  };

  const handleExportPdf = () => {
    const items = getReporteItems();
    exportVacationBalancesToPdf(items, nombreEmpresa);
  };

  return (
    <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-6 sm:space-y-8 animate-enter">
      
      {/* Header de Recursos Humanos (Limpio y Alineado con Empleado y Jefe) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-200">
        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Panel de Recursos Humanos
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Gestión de talento, saldos vacacionales, onboarding y auditoría institucional.
          </p>
        </div>

        {/* Acciones Globales del Header */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={onResetDemo}
            disabled={isResetting}
            className="btn-pressable inline-flex min-h-[44px] items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 active:scale-[0.98] rounded-xl shadow-soft disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 transition-colors duration-150"
            title="Revisar el restablecimiento de la empresa seleccionada"
          >
            <RotateCcw aria-hidden="true" className={`w-3.5 h-3.5 shrink-0 ${isResetting ? 'animate-spin' : ''}`} />
            <span>{isResetting ? 'Restableciendo...' : 'Restablecer Demo'}</span>
          </button>
        </div>
      </div>

      {/* Navegación Segmentada de Recursos Humanos (Cuadrícula Táctil 3x2 en Móvil / Barra Continua en Escritorio) */}
      <nav aria-label="Navegación del módulo de Recursos Humanos">
        <div className="grid grid-cols-3 lg:grid-cols-6 p-1.5 bg-slate-200/60 rounded-2xl gap-1.5 text-xs font-bold shadow-2xs">
          {/* 1. General (Operación Diaria - Prioridad 1) */}
          <button
            type="button"
            onClick={() => setActiveTab('general')}
            className={`btn-pressable py-2.5 px-1.5 sm:px-2.5 rounded-xl transition-colors duration-150 flex items-center justify-center gap-1.5 min-h-[44px] cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#008262] ${
              activeTab === 'general'
                ? 'bg-white text-[#005266] font-black shadow-soft border border-[#00c290]/40'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/40 font-semibold'
            }`}
          >
            <LayoutDashboard aria-hidden="true" className="w-3.5 h-3.5 shrink-0 stroke-[2.2]" />
            <span className="truncate">
              <span className="sm:hidden">General</span>
              <span className="hidden sm:inline">Panel general</span>
            </span>
          </button>

          {/* 2. Directorio & Saldos (Operación Diaria - Prioridad 1) */}
          <button
            type="button"
            onClick={() => setActiveTab('directorio')}
            className={`btn-pressable py-2.5 px-1.5 sm:px-2.5 rounded-xl transition-colors duration-150 flex items-center justify-center gap-1.5 min-h-[44px] cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#008262] ${
              activeTab === 'directorio'
                ? 'bg-white text-[#005266] font-black shadow-soft border border-[#00c290]/40'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/40 font-semibold'
            }`}
          >
            <Users aria-hidden="true" className="w-3.5 h-3.5 shrink-0 stroke-[2.2]" />
            <span className="truncate">
              <span className="sm:hidden">Directorio</span>
              <span className="hidden sm:inline">Directorio & Saldos</span>
            </span>
            <span
              className={`text-[10px] tabular-nums font-black px-1.5 py-0.5 rounded-full shrink-0 ${
                activeTab === 'directorio'
                  ? 'bg-[#00c290]/20 text-[#005266]'
                  : 'bg-slate-300/70 text-slate-700'
              }`}
            >
              {filteredEmpleados.length}
            </span>
          </button>

          {/* 3. Onboarding (Gestión Activa - Prioridad 2) */}
          <button
            type="button"
            onClick={() => setActiveTab('onboarding')}
            className={`btn-pressable py-2.5 px-1.5 sm:px-2.5 rounded-xl transition-colors duration-150 flex items-center justify-center gap-1.5 min-h-[44px] cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#008262] ${
              activeTab === 'onboarding'
                ? 'bg-white text-[#005266] font-black shadow-soft border border-[#00c290]/40'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/40 font-semibold'
            }`}
          >
            <CheckCircle2 aria-hidden="true" className="w-3.5 h-3.5 shrink-0 stroke-[2.2]" />
            <span className="truncate">Onboarding</span>
            <span
              className={`text-[10px] tabular-nums font-black px-1.5 py-0.5 rounded-full shrink-0 ${
                activeTab === 'onboarding'
                  ? 'bg-[#00c290]/20 text-[#005266]'
                  : 'bg-slate-300/70 text-slate-700'
              }`}
            >
              {onboardingTareas.length}
            </span>
          </button>

          {/* 4. Reportes (Control & Análisis - Prioridad 2) */}
          <button
            type="button"
            onClick={() => setActiveTab('reportes')}
            className={`btn-pressable py-2.5 px-1.5 sm:px-2.5 rounded-xl transition-colors duration-150 flex items-center justify-center gap-1.5 min-h-[44px] cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#008262] ${
              activeTab === 'reportes'
                ? 'bg-white text-[#005266] font-black shadow-soft border border-[#00c290]/40'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/40 font-semibold'
            }`}
          >
            <BarChart3 aria-hidden="true" className="w-3.5 h-3.5 shrink-0 stroke-[2.2]" />
            <span className="truncate">Reportes</span>
          </button>

          {/* 5. Auditoría (Seguridad & Cumplimiento - Prioridad 3) */}
          <button
            type="button"
            onClick={() => setActiveTab('auditoria')}
            className={`btn-pressable py-2.5 px-1.5 sm:px-2.5 rounded-xl transition-colors duration-150 flex items-center justify-center gap-1.5 min-h-[44px] cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#008262] ${
              activeTab === 'auditoria'
                ? 'bg-white text-[#005266] font-black shadow-soft border border-[#00c290]/40'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/40 font-semibold'
            }`}
          >
            <Activity aria-hidden="true" className="w-3.5 h-3.5 shrink-0 stroke-[2.2]" />
            <span className="truncate">Auditoría</span>
            <span
              className={`text-[10px] tabular-nums font-black px-1.5 py-0.5 rounded-full shrink-0 ${
                activeTab === 'auditoria'
                  ? 'bg-[#00c290]/20 text-[#005266]'
                  : 'bg-slate-300/70 text-slate-700'
              }`}
            >
              {actividades.length}
            </span>
          </button>

          {/* 6. Configuración (Gobernanza & Ajustes - Prioridad 4) */}
          <button
            type="button"
            onClick={() => setActiveTab('configuracion')}
            className={`btn-pressable py-2.5 px-1.5 sm:px-2.5 rounded-xl transition-colors duration-150 flex items-center justify-center gap-1.5 min-h-[44px] cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#008262] ${
              activeTab === 'configuracion'
                ? 'bg-white text-[#005266] font-black shadow-soft border border-[#00c290]/40'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/40 font-semibold'
            }`}
          >
            <Settings aria-hidden="true" className="w-3.5 h-3.5 shrink-0 stroke-[2.2]" />
            <span className="truncate">
              <span className="sm:hidden">Ajustes</span>
              <span className="hidden sm:inline">Configuración</span>
            </span>
          </button>
        </div>
      </nav>

      {/* Contexto del Menú Seleccionado (Título, Descripción y Acciones Específicas) */}
      <div className="space-y-3 px-1">
        <div className="space-y-1">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
            {TAB_DESCRIPTIONS[activeTab].title}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 font-normal leading-relaxed">
            {TAB_DESCRIPTIONS[activeTab].description}
          </p>
        </div>

        {/* Acciones de Exportación Directas del Directorio */}
        {activeTab === 'directorio' && (
          <div className="flex flex-wrap items-center gap-2.5 pt-0.5">
            <button
              type="button"
              onClick={handleExportExcel}
              disabled={errorDirectorio}
              className="btn-pressable inline-flex min-h-[40px] items-center gap-2 px-3.5 py-2 text-xs font-bold text-[#005266] bg-white hover:bg-[#57CCB7]/15 active:scale-[0.97] rounded-xl border border-[#57CCB7] shadow-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#57CCB7] transition-colors duration-150 disabled:opacity-50"
              title="Descargar matriz en Excel (.xlsx)"
            >
              <FileSpreadsheet aria-hidden="true" className="w-4 h-4 text-[#007055] shrink-0" />
              <span>Saldos Excel</span>
            </button>

            <button
              type="button"
              onClick={handleExportPdf}
              disabled={errorDirectorio}
              className="btn-pressable inline-flex min-h-[40px] items-center gap-2 px-3.5 py-2 text-xs font-bold text-rose-900 bg-white hover:bg-rose-50 active:scale-[0.97] rounded-xl border border-rose-300 shadow-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600 transition-colors duration-150 disabled:opacity-50"
              title="Descargar informe formal en PDF"
            >
              <FileText aria-hidden="true" className="w-4 h-4 text-rose-700 shrink-0" />
              <span>Saldos PDF</span>
            </button>
          </div>
        )}
      </div>

      {/* Contenido de Pestaña: Directorio de Colaboradores */}
      {activeTab === 'general' && (
        <PanelGeneralRRHH solicitudes={solicitudes} evaluaciones={evaluaciones} empleados={empleados}
          departamentos={departamentos} tiposSolicitud={tiposSolicitud} errorCarga={errorPanel} onReintentar={onReintentarPanel} />
      )}

      {activeTab === 'reportes' && <ReportesRRHH key={session.empresaId} empleados={empleados} departamentos={departamentos} solicitudes={solicitudes}
        tiposSolicitud={tiposSolicitud} evaluaciones={evaluaciones} nombreEmpresa={nombreEmpresa} errorCarga={errorPanel}
        onReintentar={onReintentarPanel} />}

      {activeTab === 'configuracion' && ((errorPanel || errorPeriodos) ? <section role="alert" className="rounded-2xl border border-rose-200 bg-white p-6 text-sm text-slate-800"><p>No pudimos cargar la configuración.</p><button type="button" onClick={onReintentarPanel} className="mt-3 min-h-11 rounded-xl border border-slate-300 px-4 font-semibold">Reintentar</button></section> :
        <ConfiguracionRRHH key={session.empresaId} tipos={tiposSolicitud} solicitudes={solicitudes} criterios={criterios} periodos={periodos} onGuardarTipo={onGuardarTipo} onCambiarEstadoTipo={onCambiarEstadoTipo} onGuardarCriterios={onGuardarCriterios} onCrearPeriodo={onCrearPeriodo} onCambiarEstadoPeriodo={onCambiarEstadoPeriodo} />)}

      {activeTab === 'directorio' && (
        <div className="space-y-4">
          {/* Barra de Filtros y Búsqueda */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                aria-label="Buscar colaboradores"
                placeholder="Buscar por nombre, cargo o código..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#00c290]/30 focus:border-[#00c290] placeholder:text-slate-400 transition-colors duration-150"
              />
            </div>

            <div className="sm:w-64">
              <CustomSelect
                value={selectedDepto}
                onChange={setSelectedDepto}
                options={[
                  { value: 'todos', label: 'Todos los Departamentos' },
                  ...departamentos.map((d) => ({
                    value: d.id,
                    label: d.nombre,
                  })),
                ]}
                ariaLabel="Filtrar por departamento"
              />
            </div>
            <div className="sm:w-44">
              <CustomSelect value={estadoDirectorio} onChange={(valor) => setEstadoDirectorio(valor as EstadoDirectorio)}
                options={[{ value: 'activos', label: 'Activos' }, { value: 'inactivos', label: 'Inactivos' }, { value: 'todos', label: 'Todos los estados' }]}
                ariaLabel="Filtrar por estado" />
            </div>
          </div>

          <p className="text-sm text-slate-600">Los reportes de saldos incluyen las personas que coinciden con los filtros del directorio.</p>

          {errorDirectorio ? (
            <div role="alert" className="rounded-3xl border border-rose-200 bg-white p-6 text-sm text-slate-800">
              <p className="font-bold">No pudimos cargar el directorio y los saldos.</p>
              <button type="button" onClick={onReintentarPanel} className="btn-pressable mt-3 min-h-[44px] rounded-xl border border-slate-300 px-4 font-bold hover:bg-slate-50">Reintentar</button>
            </div>
          ) : (
            <DirectorioRRHH key={session.empresaId} empleados={filteredEmpleados} todosEmpleados={empleados} usuarios={usuarios} onCambiarRol={onCambiarRol}
              onLimpiarFiltros={searchQuery.trim() || selectedDepto !== 'todos' || estadoDirectorio !== 'activos' ? () => { setSearchQuery(''); setSelectedDepto('todos'); setEstadoDirectorio('activos'); } : undefined}
              departamentos={departamentos} saldos={saldos} onAjustarSaldo={onAjustarSaldo} onAcreditarSaldo={onAcreditarSaldo} onCrearColaborador={onCrearColaborador} onEditarColaborador={onEditarColaborador} onDesactivarColaborador={onDesactivarColaborador} onReactivarColaborador={onReactivarColaborador} onConsultarCorreo={onConsultarCorreo} onCambiarCorreo={onCambiarCorreo} onVincularCuenta={onVincularCuenta} />
          )}
        </div>
      )}

      {/* Contenido de Pestaña: Onboarding */}
      {activeTab === 'onboarding' && (
        <OnboardingRRHH key={session.empresaId} empleados={empleados} departamentos={departamentos}
          tareas={onboardingTareas} onCambiarEstado={onToggleTarea} onGuardarTarea={onGuardarTarea} onEliminarTarea={onEliminarTarea} errorCarga={errorOnboarding}
          onReintentar={onReintentarPanel} />
      )}

      {/* Contenido de Pestaña: Registro de Auditoría */}
      {activeTab === 'auditoria' && (
        <RegistroAuditoriaRRHH actividades={actividades} empleados={empleados} errorCarga={errorAuditoria}
          onReintentar={onReintentarPanel} />
      )}

    </div>
  );
};
