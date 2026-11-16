import { CalendarDays, ClipboardList, FileCheck2 } from 'lucide-react';
import type { ReactNode } from 'react';
import type { Departamento, Empleado, Evaluacion, Solicitud, TipoSolicitud } from '../types/models';

interface Props {
  solicitudes: Solicitud[];
  evaluaciones: Evaluacion[];
  empleados: Empleado[];
  departamentos: Departamento[];
  tiposSolicitud: TipoSolicitud[];
  errorCarga?: boolean;
  onReintentar?: () => void;
}

function fechaISO(fecha: Date): string {
  return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`;
}

function semanaActual(): { inicio: string; fin: string } {
  const hoy = new Date();
  const inicio = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
  inicio.setDate(inicio.getDate() - ((inicio.getDay() + 6) % 7));
  const fin = new Date(inicio);
  fin.setDate(fin.getDate() + 6);
  return { inicio: fechaISO(inicio), fin: fechaISO(fin) };
}

function mostrarFecha(fecha: string): string {
  const partes = fecha.split('-');
  return partes.length === 3 ? `${partes[2]}/${partes[1]}/${partes[0]}` : fecha;
}

function nombreEmpleado(id: string, empleados: Empleado[]): string {
  return empleados.find((empleado) => empleado.id === id)?.nombre || 'Colaborador no disponible';
}

function departamentoEmpleado(id: string, empleados: Empleado[], departamentos: Departamento[]): string {
  const empleado = empleados.find((item) => item.id === id);
  return departamentos.find((item) => item.id === empleado?.departamento_id)?.nombre || 'Departamento no disponible';
}

function SeccionPanel({ titulo, descripcion, cantidad, icono, haloClass, iconContainerClass, children }: {
  titulo: string; descripcion: string; cantidad: number; icono: ReactNode; haloClass?: string; iconContainerClass?: string; children: ReactNode;
}) {
  return (
    <section aria-label={titulo} className="relative overflow-hidden rounded-3xl border border-slate-200/90 bg-white p-5 shadow-soft sm:p-6">
      {haloClass && (
        <div
          aria-hidden="true"
          className={`pointer-events-none absolute -top-12 inset-x-0 mx-auto h-24 w-11/12 rounded-full blur-3xl ${haloClass}`}
        />
      )}
      <div className="relative flex items-start gap-3 border-b border-slate-200 pb-4">
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${iconContainerClass || 'bg-brand-100 text-brand-800'}`}>
          {icono}
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-bold tracking-tight text-slate-900">{titulo}</h2>
          <p className="mt-1 text-sm text-slate-600">{descripcion}</p>
        </div>
        <span aria-label={`${cantidad} registros`} className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-sm font-bold text-slate-800 tabular-nums">
          {cantidad}
        </span>
      </div>
      <div className="relative">
        {children}
      </div>
    </section>
  );
}

function ListaSolicitudes({ solicitudes, empleados, departamentos, tiposSolicitud }: Props) {
  if (!solicitudes.length) return <p className="pt-5 text-sm text-slate-600">No hay solicitudes pendientes.</p>;
  return <ul className="divide-y divide-slate-100">{solicitudes.map((item) => (
    <li key={item.id} className="py-4 last:pb-0">
      <div className="flex flex-wrap items-start justify-between gap-2"><p className="text-sm font-bold text-slate-900">{nombreEmpleado(item.empleado_id, empleados)}</p>
        <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-950">Pendiente</span></div>
      <p className="mt-1 text-sm text-slate-600">{departamentoEmpleado(item.empleado_id, empleados, departamentos)} · {tiposSolicitud.find((tipo) => tipo.id === item.tipo_id)?.nombre || 'Tipo no disponible'}</p>
      <p className="mt-1 text-sm font-semibold text-slate-700 tabular-nums">{mostrarFecha(item.fecha_desde)} – {mostrarFecha(item.fecha_hasta)}</p>
    </li>))}</ul>;
}

function ListaAusencias({ solicitudes, empleados, departamentos }: Props) {
  if (!solicitudes.length) return <p className="pt-5 text-sm text-slate-600">No hay ausencias aprobadas esta semana.</p>;
  return <ul className="divide-y divide-slate-100">{solicitudes.map((item) => (
    <li key={item.id} className="py-4 last:pb-0"><p className="text-sm font-bold text-slate-900">{nombreEmpleado(item.empleado_id, empleados)}</p>
      <p className="mt-1 text-sm text-slate-600">{departamentoEmpleado(item.empleado_id, empleados, departamentos)}</p>
      <p className="mt-1 text-sm font-semibold text-slate-700 tabular-nums">{mostrarFecha(item.fecha_desde)} – {mostrarFecha(item.fecha_hasta)}</p></li>))}</ul>;
}

function ListaEvaluaciones({ evaluaciones, empleados, departamentos }: Props) {
  if (!evaluaciones.length) return <p className="pt-5 text-sm text-slate-600">No hay evaluaciones en curso.</p>;
  return <ul className="divide-y divide-slate-100">{evaluaciones.map((item) => (
    <li key={item.id} className="py-4 last:pb-0"><div className="flex flex-wrap justify-between gap-2">
      <p className="text-sm font-bold text-slate-900">{nombreEmpleado(item.empleado_id, empleados)}</p>
      <span className="rounded-full bg-[#e8e8ff] px-2.5 py-1 text-xs font-bold text-[#302866]">En curso</span></div>
      <p className="mt-1 text-sm text-slate-600">{departamentoEmpleado(item.empleado_id, empleados, departamentos)}</p>
      <p className="mt-1 text-sm font-semibold text-slate-700">Período: <span>{item.periodo}</span></p></li>))}</ul>;
}

export function PanelGeneralRRHH(props: Props) {
  const { inicio, fin } = semanaActual();
  const pendientes = props.solicitudes.filter((item) => item.estado === 'pendiente');
  const ausencias = props.solicitudes.filter((item) => item.estado === 'aprobada' && item.fecha_desde <= fin && item.fecha_hasta >= inicio);
  const evaluaciones = props.evaluaciones.filter((item) => item.estado === 'en_curso' || item.estado === 'en_progreso');
  if (props.errorCarga) return <div role="alert" className="rounded-3xl border border-rose-200 bg-white p-6 text-sm text-slate-800">
    <p className="font-bold">No pudimos cargar el panel de Recursos Humanos.</p>
    <p className="mt-1">Comprueba la conexión e inténtalo nuevamente.</p>
    <button type="button" onClick={props.onReintentar} className="btn-pressable mt-4 min-h-[44px] rounded-xl border border-slate-300 px-4 font-bold hover:bg-slate-50">Reintentar</button>
  </div>;
  return <div className="grid items-start gap-4 lg:grid-cols-3">
    <SeccionPanel
      titulo="Solicitudes pendientes"
      descripcion="Solicitudes a la espera de resolución"
      cantidad={pendientes.length}
      haloClass="bg-amber-400/40"
      iconContainerClass="bg-amber-50 border-amber-200 text-amber-600"
      icono={<ClipboardList aria-hidden="true" className="h-5 w-5 stroke-[2.2]" />}
    >
      <ListaSolicitudes {...props} solicitudes={pendientes} />
    </SeccionPanel>
    <SeccionPanel
      titulo="Ausencias de la semana"
      descripcion={`${mostrarFecha(inicio)} al ${mostrarFecha(fin)}`}
      cantidad={ausencias.length}
      haloClass="bg-emerald-400/40"
      iconContainerClass="bg-emerald-50 border-emerald-200 text-emerald-600"
      icono={<CalendarDays aria-hidden="true" className="h-5 w-5 stroke-[2.2]" />}
    >
      <ListaAusencias {...props} solicitudes={ausencias} />
    </SeccionPanel>
    <SeccionPanel
      titulo="Evaluaciones en curso"
      descripcion="Evaluaciones pendientes de cierre"
      cantidad={evaluaciones.length}
      haloClass="bg-indigo-400/40"
      iconContainerClass="bg-indigo-50 border-indigo-200 text-indigo-600"
      icono={<FileCheck2 aria-hidden="true" className="h-5 w-5 stroke-[2.2]" />}
    >
      <ListaEvaluaciones {...props} evaluaciones={evaluaciones} />
    </SeccionPanel>
  </div>;
}
