import { useState, useMemo } from 'react';
import {
  Activity,
  Search,
  ClipboardList,
  Clock,
  Award,
  UserCheck,
  CheckSquare,
  User,
  Filter,
  RotateCcw,
  Inbox,
  Shield,
} from 'lucide-react';
import type { Empleado, RegistroActividad } from '../types/models';
import { CustomSelect, type CustomSelectOption } from './CustomSelect';

function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function accionVisible(accion: string): string {
  const texto = accion.replace(/_/g, ' ').toLowerCase();
  return texto ? texto[0].toUpperCase() + texto.slice(1) : 'Actividad';
}

function usuarioVisible(item: RegistroActividad, empleados: Empleado[]): string {
  if (item.actor_auth_id) return item.actor_email ? `Cuenta: ${item.actor_email}` : 'Cuenta autenticada';
  if (!item.usuario_id) return 'Usuario no identificado';
  return empleados.find((empleado) => empleado.usuario_id === item.usuario_id)?.nombre || 'Usuario no disponible';
}

function detalleVisible(item: RegistroActividad, empleados: Empleado[]): string {
  if (!['SALDO_', 'EVALUACION_', 'SOLICITUD_', 'COLABORADOR_', 'CLAVE_'].some((prefijo) => item.accion.startsWith(prefijo)))
    return item.detalle;
  return item.detalle.replace(/colaborador ([\w-]+)/gi, (texto, id: string) => {
    const empleado = empleados.find((persona) => persona.id === id);
    const prefijo = texto.startsWith('C') ? 'Colaborador' : 'colaborador';
    return `${prefijo} ${empleado?.nombre || 'no disponible'}`;
  });
}

function fechaVisible(fecha: string): string {
  const valor = new Date(fecha);
  if (Number.isNaN(valor.valueOf())) return 'Fecha no disponible';
  return valor.toLocaleString('es-EC', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

type CategoriaAuditoriaId =
  | 'solicitudes'
  | 'saldos'
  | 'seguridad'
  | 'tareas'
  | 'evaluaciones'
  | 'general';

interface CategoriaAuditoria {
  id: CategoriaAuditoriaId;
  titulo: string;
  descripcion: string;
  icon: typeof Activity;
  iconBg: string;
  iconBorder: string;
  iconText: string;
  haloGlow: string;
  haloWash: string;
  badgeBg: string;
  badgeText: string;
}

const CATEGORIAS_CONFIG: Record<CategoriaAuditoriaId, CategoriaAuditoria> = {
  solicitudes: {
    id: 'solicitudes',
    titulo: 'Solicitudes y Ausencias',
    descripcion: 'Creación, aprobación y resolución de permisos y vacaciones.',
    icon: ClipboardList,
    iconBg: 'bg-emerald-50',
    iconBorder: 'border-emerald-200',
    iconText: 'text-emerald-600',
    haloGlow: 'bg-emerald-400/55',
    haloWash: 'from-emerald-400/35 via-emerald-300/15 to-transparent',
    badgeBg: 'bg-emerald-50',
    badgeText: 'text-emerald-800 border-emerald-200',
  },
  saldos: {
    id: 'saldos',
    titulo: 'Saldos de Vacaciones',
    descripcion: 'Ajustes de saldo, acreditaciones anuales y conciliaciones.',
    icon: Clock,
    iconBg: 'bg-amber-50',
    iconBorder: 'border-amber-200',
    iconText: 'text-amber-600',
    haloGlow: 'bg-amber-400/60',
    haloWash: 'from-amber-400/40 via-amber-300/15 to-transparent',
    badgeBg: 'bg-amber-50',
    badgeText: 'text-amber-800 border-amber-200',
  },
  seguridad: {
    id: 'seguridad',
    titulo: 'Usuarios, Accesos y Contraseñas',
    descripcion: 'Altas de colaboradores, asignación de roles, cuentas y contraseñas.',
    icon: UserCheck,
    iconBg: 'bg-fuchsia-50',
    iconBorder: 'border-fuchsia-200',
    iconText: 'text-fuchsia-600',
    haloGlow: 'bg-fuchsia-400/60',
    haloWash: 'from-fuchsia-400/40 via-fuchsia-300/15 to-transparent',
    badgeBg: 'bg-fuchsia-50',
    badgeText: 'text-fuchsia-800 border-fuchsia-200',
  },
  tareas: {
    id: 'tareas',
    titulo: 'Tareas de Onboarding',
    descripcion: 'Asignación, seguimiento y cumplimiento de tareas de integración.',
    icon: CheckSquare,
    iconBg: 'bg-cyan-50',
    iconBorder: 'border-cyan-200',
    iconText: 'text-cyan-600',
    haloGlow: 'bg-cyan-400/60',
    haloWash: 'from-cyan-400/40 via-cyan-300/15 to-transparent',
    badgeBg: 'bg-cyan-50',
    badgeText: 'text-cyan-800 border-cyan-200',
  },
  evaluaciones: {
    id: 'evaluaciones',
    titulo: 'Evaluaciones y Desempeño',
    descripcion: 'Períodos de evaluación, ponderación de criterios y calificaciones.',
    icon: Award,
    iconBg: 'bg-indigo-50',
    iconBorder: 'border-indigo-200',
    iconText: 'text-indigo-600',
    haloGlow: 'bg-indigo-400/60',
    haloWash: 'from-indigo-400/40 via-indigo-300/15 to-transparent',
    badgeBg: 'bg-indigo-50',
    badgeText: 'text-indigo-800 border-indigo-200',
  },
  general: {
    id: 'general',
    titulo: 'Otras Actividades Institucionales',
    descripcion: 'Eventos del sistema y modificaciones generales de la empresa.',
    icon: Activity,
    iconBg: 'bg-slate-100',
    iconBorder: 'border-slate-200',
    iconText: 'text-slate-600',
    haloGlow: 'bg-slate-400/50',
    haloWash: 'from-slate-400/35 via-slate-300/15 to-transparent',
    badgeBg: 'bg-slate-100',
    badgeText: 'text-slate-700 border-slate-200',
  },
};

const ORDEN_CATEGORIAS: CategoriaAuditoriaId[] = [
  'solicitudes',
  'saldos',
  'seguridad',
  'tareas',
  'evaluaciones',
  'general',
];

function clasificarEvento(accion: string): CategoriaAuditoriaId {
  const normalizada = accion.toUpperCase();
  if (normalizada.startsWith('SOLICITUD_')) return 'solicitudes';
  if (normalizada.startsWith('SALDO_')) return 'saldos';
  if (
    normalizada.startsWith('COLABORADOR_') ||
    normalizada.startsWith('CLAVE_') ||
    normalizada.startsWith('USUARIO_') ||
    normalizada.startsWith('ROL_') ||
    normalizada.startsWith('ACCESO_') ||
    normalizada.startsWith('PASSWORD_')
  ) {
    return 'seguridad';
  }
  if (normalizada.startsWith('ONBOARDING_') || normalizada.startsWith('TAREA_')) {
    return 'tareas';
  }
  if (
    normalizada.startsWith('EVALUACION_') ||
    normalizada.startsWith('PERIODO_') ||
    normalizada.startsWith('CRITERIO_')
  ) {
    return 'evaluaciones';
  }
  return 'general';
}

export function RegistroAuditoriaRRHH({
  actividades,
  empleados,
  errorCarga,
  onReintentar,
}: {
  actividades: RegistroActividad[];
  empleados: Empleado[];
  errorCarga?: boolean;
  onReintentar?: () => void;
}) {
  const [busqueda, setBusqueda] = useState('');
  const [tipo, setTipo] = useState('todos');
  const tipos = [...new Set(actividades.map((item) => item.accion))].sort();

  const visibles = useMemo(() => {
    return actividades.filter(
      (item) =>
        (tipo === 'todos' || item.accion === tipo) &&
        normalizar(
          `${accionVisible(item.accion)} ${detalleVisible(item, empleados)} ${usuarioVisible(item, empleados)}`
        ).includes(normalizar(busqueda))
    );
  }, [actividades, tipo, busqueda, empleados]);

  // Agrupación de actividades por categoría
  const grupos = useMemo(() => {
    const map = new Map<CategoriaAuditoriaId, RegistroActividad[]>();
    for (const item of visibles) {
      const catId = clasificarEvento(item.accion);
      const lista = map.get(catId) || [];
      lista.push(item);
      map.set(catId, lista);
    }
    return map;
  }, [visibles]);

  if (errorCarga) {
    return (
      <section
        role="alert"
        className="rounded-3xl border border-rose-200 bg-white p-6 text-sm text-slate-800 shadow-soft"
      >
        <p className="font-bold text-slate-900">No pudimos cargar el registro de actividad.</p>
        <p className="mt-1 text-slate-600">Comprueba la conexión e inténtalo nuevamente.</p>
        <button
          type="button"
          onClick={onReintentar}
          className="btn-pressable mt-4 min-h-[44px] rounded-xl border border-slate-300 px-4 font-bold hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#008262] transition-colors"
        >
          Reintentar
        </button>
      </section>
    );
  }

  const tipoOpciones: CustomSelectOption[] = [
    { value: 'todos', label: 'Todas las actividades' },
    ...tipos.map((item) => ({
      value: item,
      label: accionVisible(item),
    })),
  ];

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Panel Superior: Filtros y Búsqueda */}
      <section className="relative overflow-hidden rounded-3xl border border-slate-200/90 bg-white p-5 shadow-soft sm:p-6">
        {/* Doble Halo Resplandeciente Índigo para Auditoría */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-12 inset-x-0 mx-auto h-28 sm:h-32 w-11/12 rounded-full blur-2xl sm:blur-3xl bg-indigo-400/50"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-0 inset-x-0 h-16 bg-gradient-to-b from-indigo-400/30 via-indigo-300/10 to-transparent"
        />
        <div className="relative">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-5">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-indigo-200 bg-indigo-50 text-indigo-600 shadow-soft">
              <Shield aria-hidden="true" className="h-5 w-5 stroke-[2.2]" />
            </span>
            <div>
              <h2 className="text-base sm:text-lg font-bold tracking-tight text-slate-900">
                Registro de actividad
              </h2>
              <p className="text-xs sm:text-sm font-medium text-slate-500">
                Consulta las últimas 20 actividades registradas de esta empresa.
              </p>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <label className="relative flex-1">
              <Search
                aria-hidden="true"
                className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
              <input
                type="search"
                aria-label="Buscar en actividad"
                value={busqueda}
                onChange={(event) => setBusqueda(event.target.value)}
                placeholder="Buscar por acción, persona o detalle"
                className="min-h-[48px] h-12 w-full rounded-2xl border border-slate-200/90 bg-slate-50/70 hover:bg-slate-50 focus:bg-white pl-11 pr-4 text-xs sm:text-sm font-medium text-slate-900 placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-[#57CCB7]/40 focus:border-[#57CCB7] transition-all shadow-2xs"
              />
            </label>

            <div className="sm:w-72">
              {/* Select nativo oculto para compatibilidad */}
              <select
                aria-label="Filtrar por tipo de actividad"
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
                className="hidden pointer-events-none"
                style={{ display: 'none' }}
                tabIndex={-1}
              >
                <option value="todos">Todas las actividades</option>
                {tipos.map((item) => (
                  <option key={item} value={item}>
                    {accionVisible(item)}
                  </option>
                ))}
              </select>
              {/* Selector personalizado interactivo */}
              <CustomSelect
                value={tipo}
                onChange={setTipo}
                ariaLabel="Filtrar por tipo de actividad"
                options={tipoOpciones}
                placeholder="Filtrar actividad"
                title="Tipo de actividad"
                icon={<Filter className="w-4 h-4 text-indigo-600" />}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Estado Vacío cuando no hay coincidencias */}
      {!visibles.length ? (
        <section className="rounded-3xl border border-slate-200/90 bg-white p-8 sm:p-12 shadow-soft text-center flex flex-col items-center justify-center space-y-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 border border-slate-200 text-slate-400">
            <Inbox aria-hidden="true" className="h-6 w-6 stroke-[1.8]" />
          </span>
          <p className="text-sm font-medium text-slate-600 max-w-sm">
            {actividades.length
              ? tipo === 'todos'
                ? 'No hay actividades que coincidan con la búsqueda.'
                : 'No hay actividades que coincidan con los filtros.'
              : 'Aún no hay actividad registrada para esta empresa.'}
          </p>
          {actividades.length > 0 && (busqueda.trim() || tipo !== 'todos') && (
            <button
              type="button"
              aria-label="Limpiar filtros de actividad"
              onClick={() => {
                setBusqueda('');
                setTipo('todos');
              }}
              className="btn-pressable inline-flex items-center gap-2 min-h-[44px] rounded-xl border border-indigo-200 bg-indigo-50/80 px-4 py-2 text-xs sm:text-sm font-bold text-indigo-800 hover:bg-indigo-100 active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-700 transition-colors shadow-2xs"
            >
              <RotateCcw aria-hidden="true" className="h-4 w-4" />
              <span>Limpiar filtros</span>
            </button>
          )}
        </section>
      ) : (
        /* Categorías Separadas: Cada una en su propio bloque independiente */
        <div className="space-y-6 sm:space-y-8">
          {ORDEN_CATEGORIAS.map((catId) => {
            const itemsCategoria = grupos.get(catId);
            if (!itemsCategoria || itemsCategoria.length === 0) return null;

            const config = CATEGORIAS_CONFIG[catId];
            const IconoCat = config.icon;

            return (
              <section
                key={catId}
                aria-label={config.titulo}
                className="relative overflow-hidden rounded-3xl border border-slate-200/90 bg-white p-5 sm:p-7 shadow-soft"
              >
                {/* Doble Halo Resplandeciente Propio de la Categoría */}
                <div
                  aria-hidden="true"
                  className={`pointer-events-none absolute -top-12 inset-x-0 mx-auto h-28 sm:h-32 w-11/12 rounded-full blur-2xl sm:blur-3xl ${config.haloGlow}`}
                />
                <div
                  aria-hidden="true"
                  className={`pointer-events-none absolute top-0 inset-x-0 h-16 bg-gradient-to-b ${config.haloWash}`}
                />

                <div className="relative space-y-5">
                  {/* Encabezado Distintivo de la Categoría */}
                  <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border ${config.iconBorder} ${config.iconBg} ${config.iconText} shadow-2xs`}
                      >
                        <IconoCat aria-hidden="true" className="h-5 w-5 stroke-[2.2]" />
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 truncate">
                            {config.titulo}
                          </h3>
                        </div>
                        <p className="text-xs sm:text-sm font-normal text-slate-500 truncate">
                          {config.descripcion}
                        </p>
                      </div>
                    </div>

                    {/* Badge con contador de eventos de la categoría */}
                    <span
                      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold tabular-nums shadow-2xs ${config.badgeBg} ${config.badgeText}`}
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
                      <span>
                        {itemsCategoria.length} {itemsCategoria.length === 1 ? 'evento' : 'eventos'}
                      </span>
                    </span>
                  </div>

                  {/* Lista de Actividades con Espaciado Generoso y Tarjetas Individuales Limpias (Sin Halos Internos) */}
                  <div className="space-y-3.5 sm:space-y-4">
                    {itemsCategoria.map((item) => (
                      <article
                        key={item.id}
                        className="rounded-2xl border border-slate-200/80 bg-slate-50/50 hover:bg-slate-50/90 transition-all duration-150 p-4 sm:p-5 shadow-2xs space-y-3"
                      >
                        {/* Cabecera del Evento: Nombre de la Acción y Fecha */}
                        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                          <div className="flex items-center gap-2">
                            <span
                              className={`h-2.5 w-2.5 rounded-full shrink-0 shadow-xs ${
                                catId === 'solicitudes'
                                  ? 'bg-emerald-500'
                                  : catId === 'saldos'
                                  ? 'bg-amber-500'
                                  : catId === 'seguridad'
                                  ? 'bg-fuchsia-500'
                                  : catId === 'tareas'
                                  ? 'bg-cyan-500'
                                  : catId === 'evaluaciones'
                                  ? 'bg-indigo-500'
                                  : 'bg-slate-500'
                              }`}
                            />
                            <h4 className="font-bold text-slate-900 text-sm sm:text-base tracking-tight">
                              {accionVisible(item.accion)}
                            </h4>
                          </div>

                          <time
                            className="text-xs sm:text-sm font-semibold text-slate-500 tabular-nums"
                            dateTime={item.fecha}
                          >
                            {fechaVisible(item.fecha)}
                          </time>
                        </div>

                        {/* Detalle Descriptivo */}
                        <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-normal pl-3.5 border-l-2 border-slate-200">
                          {detalleVisible(item, empleados)}
                        </p>

                        {/* Metadatos: Actor o Cuenta Responsable */}
                        <div className="pt-1 flex items-center justify-between gap-2 border-t border-slate-100">
                          <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 shadow-2xs">
                            <User aria-hidden="true" className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{usuarioVisible(item, empleados)}</span>
                          </span>

                          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                            Auditoría
                          </span>
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
