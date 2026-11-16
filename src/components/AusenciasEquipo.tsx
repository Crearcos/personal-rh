import { useState } from 'react';
import { Building2, CalendarDays, Clock3 } from 'lucide-react';
import type { Departamento, Empleado, Solicitud, TipoSolicitud } from '../types/models';
import { CustomSelect, type CustomSelectOption } from './CustomSelect';

interface AusenciasEquipoProps {
  solicitudes: Solicitud[];
  empleados: Empleado[];
  departamentos: Departamento[];
  tiposSolicitud: TipoSolicitud[];
}

interface PanelFiltrosProps {
  departamentoId: string;
  departamentos: Departamento[];
  vista: 'actuales' | 'historial';
  finalizadasCount: number;
  onDepartamentoChange: (id: string) => void;
  onVistaChange: (vista: 'actuales' | 'historial') => void;
}

const ESTILOS_GRUPO = {
  hoy: {
    encabezado: 'bg-emerald-50 text-emerald-950',
    halo: 'bg-[#a8ffa1]/40',
  },
  proxima: {
    encabezado: 'bg-[#f0f0ff] text-[#302866]',
    halo: 'bg-[#aaaaff]/35',
  },
  historial: {
    encabezado: 'bg-slate-100 text-slate-800',
    halo: 'bg-sky-200/40',
  },
} as const;

function fechaLocalHoy(): string {
  const hoy = new Date();
  const mes = String(hoy.getMonth() + 1).padStart(2, '0');
  const dia = String(hoy.getDate()).padStart(2, '0');
  return `${hoy.getFullYear()}-${mes}-${dia}`;
}

function fechaVisible(fecha: string): string {
  const partes = fecha.split('-');
  return partes.length === 3 ? `${partes[2]}/${partes[1]}/${partes[0]}` : fecha;
}

function FilaAusencia({ solicitud, empleado, departamento, tipo, aprobador }: {
  solicitud: Solicitud;
  empleado?: Empleado;
  departamento?: Departamento;
  tipo?: TipoSolicitud;
  aprobador?: Empleado;
}) {
  return (
    <li className="py-5 first:pt-1 last:pb-1">
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <div className="min-w-0">
          <h4 className="text-base font-bold tracking-tight text-slate-900 break-words">{empleado?.nombre || 'Colaborador sin identificar'}</h4>
          <p className="mt-1 text-sm font-medium text-slate-600">{departamento?.nombre || 'Departamento no especificado'}</p>
        </div>
        <span className="shrink-0 rounded-full bg-[#aaaaff]/20 px-3 py-1 text-xs font-bold text-[#302866]">
          {tipo?.nombre || 'Tipo no especificado'}
        </span>
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-[1fr_1fr_1.5fr]">
        <div>
          <dt className="text-xs font-semibold text-slate-600">Desde</dt>
          <dd className="mt-1 text-sm font-bold text-slate-900 tabular-nums">{fechaVisible(solicitud.fecha_desde)}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold text-slate-600">Hasta</dt>
          <dd className="mt-1 text-sm font-bold text-slate-900 tabular-nums">{fechaVisible(solicitud.fecha_hasta)}</dd>
        </div>
        <div className="col-span-2 sm:col-span-1">
          <dt className="text-xs font-semibold text-slate-600">Motivo</dt>
          <dd className="mt-1 text-sm leading-relaxed text-slate-800 break-words">{solicitud.motivo?.trim() || 'Sin motivo registrado'}</dd>
        </div>
      </dl>
      <p className="mt-4 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs font-semibold text-slate-600">
        <Clock3 aria-hidden="true" className="h-4 w-4 shrink-0" />
        <span className="tabular-nums">{solicitud.dias} {Number(solicitud.dias) === 1 ? 'día' : 'días'}</span>
        <span aria-hidden="true">·</span> Aprobada por: <span className="text-slate-800">{aprobador?.nombre || 'No registrado'}</span>
      </p>
    </li>
  );
}

function GrupoAusencias({ titulo, descripcion, vacio, tono, solicitudes, empleados, departamentos, tiposSolicitud }: AusenciasEquipoProps & {
  titulo: string; descripcion: string; vacio: string; tono: 'hoy' | 'proxima' | 'historial';
}) {
  const { encabezado, halo } = ESTILOS_GRUPO[tono];
  return (
    <section aria-label={titulo} className="relative overflow-hidden rounded-3xl border border-slate-200/90 bg-white p-5 shadow-soft sm:p-6">
      <div aria-hidden="true" className={`pointer-events-none absolute -top-10 -right-10 h-36 w-36 rounded-full blur-2xl ${halo}`} />
      <div className={`relative flex items-start justify-between gap-3 rounded-xl px-4 py-3 ${encabezado}`}>
        <div>
          <h3 className="text-sm font-bold">{titulo}</h3>
          <p className="mt-1 text-xs font-medium">{descripcion}</p>
        </div>
        <span className="shrink-0 rounded-full bg-white px-2.5 py-1 text-xs font-bold tabular-nums">{solicitudes.length}</span>
      </div>
      {solicitudes.length === 0 ? <p className="relative px-1 py-5 text-sm text-slate-600">{vacio}</p> : (
      <ul className="relative divide-y divide-slate-100 pt-4">
        {solicitudes.map((solicitud) => {
          const empleado = empleados.find((item) => item.id === solicitud.empleado_id);
          return <FilaAusencia key={solicitud.id} solicitud={solicitud} empleado={empleado}
            departamento={departamentos.find((item) => item.id === empleado?.departamento_id)}
            aprobador={empleados.find((item) => solicitud.aprobador_id && (item.id === solicitud.aprobador_id || item.usuario_id === solicitud.aprobador_id))}
            tipo={tiposSolicitud.find((item) => item.id === solicitud.tipo_id)} />;
        })}
      </ul>
      )}
    </section>
  );
}

function PanelFiltrosAusencias({ departamentoId, departamentos, vista, finalizadasCount, onDepartamentoChange, onVistaChange }: PanelFiltrosProps) {
  const opcionesDepartamento: CustomSelectOption[] = [
    { value: 'todos', label: 'Todos los departamentos' },
    ...departamentos.map((departamento) => ({ value: departamento.id, label: departamento.nombre })),
  ];
  return (
    <div className="relative z-20 rounded-3xl border border-slate-200/90 bg-white p-5 shadow-soft sm:p-6">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden rounded-3xl">
        <div className="absolute -top-12 inset-x-0 mx-auto h-24 w-4/5 rounded-full bg-[#aaaaff]/40 blur-3xl" />
      </div>
      <div className="relative flex items-start gap-3 border-b border-slate-200 pb-5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#aaaaff]/20 text-[#302866]">
          <CalendarDays aria-hidden="true" className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold tracking-tight text-slate-900">Ausencias del equipo</h2>
          <p className="mt-1 text-sm leading-relaxed text-slate-600">Consulta las ausencias aprobadas de tu equipo y sus períodos.</p>
        </div>
      </div>
      <div className="relative z-20 mt-5 space-y-2">
        <p className="text-sm font-semibold text-slate-700">Departamento</p>
        <CustomSelect value={departamentoId} onChange={onDepartamentoChange} options={opcionesDepartamento}
          icon={<Building2 aria-hidden="true" className="h-4 w-4" />} ariaLabel="Filtrar por departamento" />
      </div>
      <div className="relative mt-5 grid grid-cols-2 gap-1 rounded-2xl bg-slate-100 p-1" aria-label="Vistas de ausencias">
        <button type="button" aria-pressed={vista === 'actuales'} onClick={() => onVistaChange('actuales')}
          className={`btn-pressable min-h-[44px] rounded-xl px-2 py-2 text-xs font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#008262] ${vista === 'actuales' ? 'bg-white text-[#005266] shadow-soft' : 'text-slate-600 hover:text-slate-900'}`}>
          Actuales y próximas
        </button>
        <button type="button" aria-pressed={vista === 'historial'} onClick={() => onVistaChange('historial')}
          className={`btn-pressable min-h-[44px] rounded-xl px-2 py-2 text-xs font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#008262] ${vista === 'historial' ? 'bg-white text-[#005266] shadow-soft' : 'text-slate-600 hover:text-slate-900'}`}>
          Historial <span className="tabular-nums">({finalizadasCount})</span>
        </button>
      </div>
    </div>
  );
}

export function AusenciasEquipo(props: AusenciasEquipoProps) {
  const [vista, setVista] = useState<'actuales' | 'historial'>('actuales');
  const [departamentoId, setDepartamentoId] = useState('todos');
  const hoy = fechaLocalHoy();
  const ordenadas = props.solicitudes.filter((solicitud) => {
    if (departamentoId === 'todos') return true;
    const empleado = props.empleados.find((item) => item.id === solicitud.empleado_id);
    return empleado?.departamento_id === departamentoId;
  }).sort((a, b) => a.fecha_desde.localeCompare(b.fecha_desde));
  const actuales = ordenadas.filter((item) => item.fecha_desde <= hoy && item.fecha_hasta >= hoy);
  const proximas = ordenadas.filter((item) => item.fecha_desde > hoy);
  const finalizadas = ordenadas.filter((item) => item.fecha_hasta < hoy).reverse();
  const grupos = vista === 'actuales' ? [
    { titulo: 'Ausentes hoy', descripcion: 'Personas fuera del equipo en este momento', vacio: departamentoId === 'todos' ? 'Nadie está ausente hoy' : 'Nadie de este departamento está ausente hoy', tono: 'hoy' as const, solicitudes: actuales },
    { titulo: 'Próximas ausencias', descripcion: 'Personas que se ausentarán más adelante', vacio: departamentoId === 'todos' ? 'No hay ausencias próximas' : 'No hay ausencias próximas para este departamento', tono: 'proxima' as const, solicitudes: proximas },
  ] : [
    { titulo: 'Ausencias finalizadas', descripcion: 'Períodos de ausencia que ya terminaron', vacio: departamentoId === 'todos' ? 'Aún no hay ausencias finalizadas' : 'No hay ausencias finalizadas para este departamento', tono: 'historial' as const, solicitudes: finalizadas },
  ];
  return (
    <div className="space-y-4">
      <PanelFiltrosAusencias departamentoId={departamentoId} departamentos={props.departamentos} vista={vista}
        finalizadasCount={finalizadas.length} onDepartamentoChange={setDepartamentoId} onVistaChange={setVista} />
      {props.solicitudes.length === 0 && vista === 'actuales' ? (
        <div className="relative overflow-hidden rounded-3xl border border-slate-200/90 bg-white px-5 py-10 text-center shadow-soft">
          <div aria-hidden="true" className="pointer-events-none absolute -top-10 inset-x-0 mx-auto h-20 w-3/4 rounded-full bg-[#aaaaff]/30 blur-2xl" />
          <p className="relative text-sm font-bold text-slate-900">Aún no hay ausencias aprobadas</p>
          <p className="relative mx-auto mt-2 max-w-sm text-sm leading-relaxed text-slate-600">Cuando se apruebe una solicitud de tu equipo, aparecerá aquí con sus fechas y motivo.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {grupos.map((grupo) => <GrupoAusencias key={grupo.titulo} {...props} {...grupo} />)}
        </div>
      )}
    </div>
  );
}
