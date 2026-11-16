import { useMemo, useState } from 'react';
import { ChevronRight, Search, UsersRound, Plus, Compass } from 'lucide-react';
import type { Departamento, Empleado, OnboardingTarea } from '../types/models';
import { OnboardingDetalle, type EstadoTarea } from './OnboardingDetalle';
import { FormularioTarea } from './FormularioTarea';
import type { DatosTarea } from '../services/onboardingValidacion';

interface Props {
  empleados: Empleado[];
  departamentos: Departamento[];
  tareas: OnboardingTarea[];
  onCambiarEstado: (id: string, estado: EstadoTarea) => Promise<boolean>;
  onGuardarTarea?: (datos: DatosTarea) => Promise<boolean>;
  onEliminarTarea?: (id: string, empleadoId: string) => Promise<boolean>;
  errorCarga?: boolean;
  onReintentar?: () => void;
}

function normalizar(valor: string): string {
  return valor.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

function Fila({ empleado, tareas, departamento, onAbrir }: {
  empleado: Empleado; tareas: OnboardingTarea[]; departamento?: Departamento; onAbrir: () => void;
}) {
  const completadas = tareas.filter((tarea) => tarea.estado === 'completada').length;
  const todasCompletadas = tareas.length > 0 && completadas === tareas.length;

  return (
    <li>
      <button
        type="button"
        onClick={onAbrir}
        aria-label={`Ver incorporación de ${empleado.nombre}`}
        className="btn-pressable flex min-h-[64px] w-full items-center gap-3.5 rounded-2xl px-2 py-4 text-left transition-colors duration-150 hover:bg-slate-50/80 active:scale-[0.99] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#57CCB7]"
      >
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-cyan-200 bg-cyan-50 text-cyan-600 shadow-soft">
          <UsersRound aria-hidden="true" className="h-5 w-5 stroke-[2.2]" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="block truncate font-bold text-slate-900 text-sm sm:text-base">
              {empleado.nombre}
            </span>
          </div>
          <span className="mt-0.5 block truncate text-xs sm:text-sm font-medium text-slate-500">
            {empleado.cargo} · {departamento?.nombre || 'Departamento no asignado'}
          </span>
          <div className="mt-2">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold tabular-nums border ${
                todasCompletadas
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-slate-100/80 text-slate-700 border-slate-200/80'
              }`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${todasCompletadas ? 'bg-emerald-500' : 'bg-cyan-500'}`} />
              {completadas} de {tareas.length} tareas completadas
            </span>
          </div>
        </div>
        <ChevronRight aria-hidden="true" className="h-5 w-5 shrink-0 text-slate-400 transition-transform group-hover:translate-x-0.5" />
      </button>
    </li>
  );
}

export function OnboardingRRHH({ empleados, departamentos, tareas, onCambiarEstado, onGuardarTarea, onEliminarTarea, errorCarga, onReintentar }: Props) {
  const [busqueda, setBusqueda] = useState('');
  const [seleccionado, setSeleccionado] = useState<string | null>(null);
  const [formulario, setFormulario] = useState<'nuevo' | OnboardingTarea | null>(null);
  const [mensaje, setMensaje] = useState('');

  const colaboradores = useMemo(
    () => empleados.filter((empleado) => tareas.some((tarea) => tarea.empleado_id === empleado.id)),
    [empleados, tareas]
  );
  const visibles = colaboradores.filter((empleado) =>
    normalizar(`${empleado.nombre} ${empleado.cargo} ${departamentos.find((item) => item.id === empleado.departamento_id)?.nombre || ''}`).includes(normalizar(busqueda))
  );
  const empleado = colaboradores.find((item) => item.id === seleccionado);

  if (errorCarga) {
    return (
      <div role="alert" className="rounded-3xl border border-rose-200 bg-white p-6 text-sm text-slate-800 shadow-soft">
        <p className="font-bold text-rose-800">No pudimos cargar las incorporaciones.</p>
        <p className="mt-1 text-slate-600">Comprueba la conexión e inténtalo nuevamente.</p>
        <button
          type="button"
          onClick={onReintentar}
          className="btn-pressable mt-4 min-h-[44px] rounded-xl border border-slate-300 bg-white px-5 font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#57CCB7]"
        >
          Reintentar
        </button>
      </div>
    );
  }

  if (formulario && onGuardarTarea) {
    return (
      <FormularioTarea
        empleados={empleados.filter((item) => item.activo !== false || (formulario !== 'nuevo' && item.id === formulario.empleado_id))}
        inicial={formulario === 'nuevo' ? undefined : formulario}
        onCancelar={() => setFormulario(null)}
        onGuardar={async (datos) => {
          const exito = await onGuardarTarea(datos);
          if (exito) {
            setFormulario(null);
            setMensaje('Tarea guardada correctamente.');
          }
          return exito;
        }}
      />
    );
  }

  if (empleado) {
    return (
      <>
        {mensaje && (
          <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50/80 px-4 py-2.5 text-sm font-semibold text-[#007055] mb-4">
            {mensaje}
          </p>
        )}
        <OnboardingDetalle
          empleado={empleado}
          departamento={departamentos.find((d) => d.id === empleado.departamento_id)}
          tareas={tareas.filter((t) => t.empleado_id === empleado.id)}
          onVolver={() => {
            setSeleccionado(null);
            setMensaje('');
          }}
          onCambiarEstado={onCambiarEstado}
          onEditar={
            onGuardarTarea
              ? (tarea) => {
                  setMensaje('');
                  setFormulario(tarea);
                }
              : undefined
          }
          onEliminar={
            onEliminarTarea
              ? async (tarea) => {
                  setMensaje('');
                  const exito = await onEliminarTarea(tarea.id, tarea.empleado_id);
                  if (exito) setMensaje('Tarea eliminada correctamente.');
                  return exito;
                }
              : undefined
          }
        />
      </>
    );
  }

  return (
    <div className="space-y-4">
      <section className="relative overflow-hidden rounded-3xl border border-slate-200/90 bg-white p-5 shadow-soft sm:p-6">
        <div aria-hidden="true" className="pointer-events-none absolute -top-12 inset-x-0 mx-auto h-24 w-11/12 rounded-full blur-3xl bg-cyan-400/30" />
        <div className="relative">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-cyan-200 bg-cyan-50 text-cyan-600 shadow-soft">
                <Compass aria-hidden="true" className="h-5 w-5 stroke-[2.2]" />
              </span>
              <div>
                <h2 className="text-lg font-bold tracking-tight text-slate-900">Incorporación de colaboradores</h2>
                <p className="text-xs sm:text-sm font-medium text-slate-500">Consulta las tareas de ingreso y acompaña el avance de cada persona.</p>
              </div>
            </div>

            {onGuardarTarea && (
              <button
                type="button"
                onClick={() => {
                  setMensaje('');
                  setFormulario('nuevo');
                }}
                className="btn-pressable inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-[#57CCB7] px-4 text-sm font-bold text-slate-900 shadow-soft hover:bg-[#46bfa9] active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#57CCB7] transition-colors"
              >
                <Plus aria-hidden="true" className="h-4 w-4 stroke-[2.5]" />
                <span>Nueva tarea</span>
              </button>
            )}
          </div>

          {mensaje && (
            <p role="status" className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50/80 px-4 py-2.5 text-sm font-semibold text-[#007055]">
              {mensaje}
            </p>
          )}

          <label className="mt-4 relative block">
            <Search aria-hidden="true" className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              aria-label="Buscar colaborador"
              placeholder="Nombre, cargo o departamento"
              value={busqueda}
              onChange={(event) => setBusqueda(event.target.value)}
              className="min-h-[48px] w-full rounded-xl border border-slate-300 bg-white pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#57CCB7]/40 focus:border-[#57CCB7] transition-colors duration-150 shadow-xs"
            />
          </label>
        </div>
      </section>

      <section className="relative overflow-hidden rounded-3xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-soft">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-2">
          <h2 className="text-base font-bold tracking-tight text-slate-900">
            Personas en incorporación{' '}
            <span className="ml-1 text-xs sm:text-sm font-bold text-slate-500 tabular-nums">
              ({visibles.length})
            </span>
          </h2>
        </div>
        {!visibles.length ? (
          <div className="py-8 text-center text-sm text-slate-600">
            <p>{colaboradores.length ? 'No encontramos colaboradores con esa búsqueda.' : 'Aún no hay tareas de incorporación registradas.'}</p>
            {colaboradores.length > 0 && busqueda.trim() && <button type="button" onClick={() => setBusqueda('')}
              aria-label="Limpiar búsqueda de incorporación"
              className="mt-2 min-h-11 rounded-xl px-4 font-semibold text-emerald-800 hover:bg-emerald-50 active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-700">Limpiar búsqueda</button>}
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {visibles.map((item) => (
              <Fila
                key={item.id}
                empleado={item}
                tareas={tareas.filter((t) => t.empleado_id === item.id)}
                departamento={departamentos.find((d) => d.id === item.departamento_id)}
                onAbrir={() => setSeleccionado(item.id)}
              />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
