import { useState } from 'react';
import { ArrowLeft, CalendarDays, UserRound } from 'lucide-react';
import type { Departamento, Empleado, OnboardingTarea } from '../types/models';
import { CustomSelect } from './CustomSelect';

export type EstadoTarea = 'pendiente' | 'en_progreso' | 'completada';
type CambiarEstado = (id: string, estado: EstadoTarea) => Promise<boolean>;

function fechaVisible(fecha: string): string {
  const partes = fecha.split('-');
  return partes.length === 3 ? `${partes[2]}/${partes[1]}/${partes[0]}` : fecha;
}

function Tarea({ tarea, onCambiarEstado, onEditar, onEliminar }: {
  tarea: OnboardingTarea;
  onCambiarEstado: CambiarEstado;
  onEditar?: (tarea: OnboardingTarea) => void;
  onEliminar?: (tarea: OnboardingTarea) => Promise<boolean>;
}) {
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(false);
  const [confirmar, setConfirmar] = useState(false);
  const [errorEliminar, setErrorEliminar] = useState(false);

  async function cambiar(estado: EstadoTarea) {
    setGuardando(true);
    setError(false);
    try {
      if (!await onCambiarEstado(tarea.id, estado)) setError(true);
    } catch {
      setError(true);
    } finally {
      setGuardando(false);
    }
  }

  async function eliminar() {
    if (!onEliminar || guardando) return;
    setGuardando(true);
    setErrorEliminar(false);
    try {
      if (!await onEliminar(tarea)) setErrorEliminar(true);
    } catch {
      setErrorEliminar(true);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <li className="py-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between transition-colors">
      <div className="min-w-0 flex-1">
        <p className="font-bold text-slate-900 text-sm sm:text-base break-words">{tarea.tarea}</p>
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs sm:text-sm text-slate-500">
          <span className="flex items-center gap-1.5 font-medium">
            <UserRound aria-hidden="true" className="h-4 w-4 shrink-0 text-slate-400" />
            <span>{tarea.responsable || 'Sin responsable'}</span>
          </span>
          <span className="flex items-center gap-1.5 font-medium tabular-nums">
            <CalendarDays aria-hidden="true" className="h-4 w-4 shrink-0 text-slate-400" />
            <span>{tarea.fecha_limite ? fechaVisible(tarea.fecha_limite) : 'Sin fecha límite'}</span>
          </span>
        </div>

        {error && (
          <p role="alert" className="mt-2.5 text-xs sm:text-sm font-semibold text-rose-700">
            No se pudo confirmar el cambio. Vuelve a cargar e inténtalo de nuevo.
          </p>
        )}

        <div className="mt-3 flex flex-wrap items-center gap-2">
          {onEditar && (
            <button
              type="button"
              onClick={() => onEditar(tarea)}
              aria-label={`Editar ${tarea.tarea}`}
              className="btn-pressable inline-flex min-h-[38px] items-center justify-center rounded-xl border border-slate-200 bg-white px-3.5 text-xs sm:text-sm font-semibold text-slate-700 hover:border-[#57CCB7] hover:bg-slate-50 active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#57CCB7] transition-colors"
            >
              Editar tarea
            </button>
          )}
          {onEliminar && !confirmar && (
            <button
              type="button"
              disabled={guardando}
              onClick={() => setConfirmar(true)}
              aria-label={`Eliminar ${tarea.tarea}`}
              className="btn-pressable inline-flex min-h-[38px] items-center justify-center rounded-xl border border-rose-200 bg-rose-50/50 px-3.5 text-xs sm:text-sm font-semibold text-rose-700 hover:bg-rose-100/70 active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600 disabled:opacity-60 transition-colors"
            >
              Eliminar
            </button>
          )}
        </div>

        {confirmar && (
          <div role="group" aria-label={`Confirmar eliminación de ${tarea.tarea}`} className="mt-3 rounded-2xl bg-rose-50/60 p-4 border border-rose-200/90 space-y-3">
            <p className="text-sm font-medium text-slate-800">¿Eliminar esta tarea? Esta acción no se puede deshacer.</p>
            {errorEliminar && (
              <p role="alert" className="text-xs sm:text-sm font-medium text-rose-700">
                No se pudo eliminar la tarea. Inténtalo de nuevo.
              </p>
            )}
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                disabled={guardando}
                onClick={() => void eliminar()}
                className="btn-pressable min-h-[40px] rounded-xl bg-rose-700 px-4 text-xs sm:text-sm font-semibold text-white hover:bg-rose-800 active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600 disabled:opacity-60 transition-colors"
              >
                {guardando ? 'Eliminando…' : 'Confirmar eliminación'}
              </button>
              <button
                type="button"
                disabled={guardando}
                onClick={() => { setConfirmar(false); setErrorEliminar(false); }}
                className="btn-pressable min-h-[40px] rounded-xl border border-slate-300 bg-white px-4 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#57CCB7] disabled:opacity-60 transition-colors"
              >
                Cancelar eliminación
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-1.5 sm:w-48 shrink-0">
        <label htmlFor={`estado-${tarea.id}`} className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Estado
        </label>
        <div className="relative">
          <select
            id={`estado-${tarea.id}`}
            aria-label={`Estado de ${tarea.tarea}`}
            value={tarea.estado}
            onChange={(e) => void cambiar(e.target.value as EstadoTarea)}
            className="hidden pointer-events-none"
            style={{ display: 'none' }}
            tabIndex={-1}
          >
            <option value="pendiente">Pendiente</option>
            <option value="en_progreso">En progreso</option>
            <option value="completada">Completada</option>
          </select>
          <CustomSelect
            value={tarea.estado}
            onChange={(val) => void cambiar(val as EstadoTarea)}
            options={[
              { value: 'pendiente', label: 'Pendiente', badge: 'Pendiente', badgeColor: 'slate' },
              { value: 'en_progreso', label: 'En progreso', badge: 'En progreso', badgeColor: 'amber' },
              { value: 'completada', label: 'Completada', badge: 'Completada', badgeColor: 'emerald' },
            ]}
            placeholder="Selecciona un estado"
            title={`Estado de ${tarea.tarea}`}
            ariaLabel={`Opciones de estado de ${tarea.tarea}`}
            disabled={guardando}
          />
        </div>
        {guardando && <span role="status" className="text-xs font-medium text-slate-500">Guardando…</span>}
      </div>
    </li>
  );
}

export function OnboardingDetalle({ empleado, departamento, tareas, onVolver, onCambiarEstado, onEditar, onEliminar }: {
  empleado: Empleado;
  departamento?: Departamento;
  tareas: OnboardingTarea[];
  onVolver: () => void;
  onCambiarEstado: CambiarEstado;
  onEditar?: (tarea: OnboardingTarea) => void;
  onEliminar?: (tarea: OnboardingTarea) => Promise<boolean>;
}) {
  const completadas = tareas.filter((tarea) => tarea.estado === 'completada').length;
  const porcentaje = tareas.length ? Math.round((completadas / tareas.length) * 100) : 0;

  return (
    <div role="region" aria-label={`Incorporación de ${empleado.nombre}`} className="space-y-4">
      <button
        type="button"
        onClick={onVolver}
        className="btn-pressable inline-flex min-h-[44px] items-center gap-2 rounded-xl px-3 text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 active:scale-[0.97] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#57CCB7]"
      >
        <ArrowLeft aria-hidden="true" className="h-4 w-4 text-slate-500" />
        <span>Volver a incorporaciones</span>
      </button>

      <section className="relative overflow-hidden rounded-3xl border border-slate-200/90 bg-white p-5 shadow-soft sm:p-6">
        <div aria-hidden="true" className="pointer-events-none absolute -top-12 inset-x-0 mx-auto h-24 w-11/12 rounded-full blur-3xl bg-cyan-400/30" />
        <div className="relative">
          <div className="flex items-center gap-3.5 border-b border-slate-100 pb-4 mb-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-cyan-200 bg-cyan-50 text-cyan-600 shadow-soft">
              <UserRound aria-hidden="true" className="h-6 w-6 stroke-[2.2]" />
            </span>
            <div className="min-w-0">
              <h2 className="text-lg font-bold tracking-tight text-slate-900 truncate">{empleado.nombre}</h2>
              <p className="text-xs sm:text-sm font-medium text-slate-500">
                {empleado.cargo} · {departamento?.nombre || 'Departamento no asignado'}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-[#005240] tabular-nums">
                {completadas} de {tareas.length} tareas completadas
              </p>
              <span className="text-xs font-bold text-slate-500 tabular-nums">{porcentaje}%</span>
            </div>
            <div aria-hidden="true" className="h-2.5 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-[#57CCB7] transition-all duration-500 ease-out"
                style={{ width: `${porcentaje}%` }}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden rounded-3xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-soft">
        <div className="border-b border-slate-100 pb-3 mb-2">
          <h2 className="text-base font-bold tracking-tight text-slate-900">
            Tareas de incorporación{' '}
            <span className="ml-1 text-xs sm:text-sm font-bold text-slate-500 tabular-nums">
              ({tareas.length})
            </span>
          </h2>
        </div>
        <ul className="divide-y divide-slate-100">
          {tareas.map((tarea) => (
            <Tarea
              key={tarea.id}
              tarea={tarea}
              onCambiarEstado={onCambiarEstado}
              onEditar={onEditar}
              onEliminar={onEliminar}
            />
          ))}
        </ul>
      </section>
    </div>
  );
}
