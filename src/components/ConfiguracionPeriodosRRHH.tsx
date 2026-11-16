import { useState, type FormEvent } from 'react';
import { CalendarRange, Plus, Search, Calendar, AlertTriangle, CheckCircle2, Lock } from 'lucide-react';
import type { DatosPeriodoEvaluacion, PeriodoEvaluacion } from '../types/models';

interface Props {
  periodos: PeriodoEvaluacion[];
  onCrear: (datos: DatosPeriodoEvaluacion) => Promise<boolean>;
  onCambiarEstado: (id: string, estado: 'abierto' | 'cerrado') => Promise<boolean>;
}

const inputStyle =
  'min-h-[48px] h-12 w-full rounded-2xl border border-slate-200/90 bg-slate-50/70 hover:bg-slate-50 focus:bg-white px-4 text-xs sm:text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-400/40 focus:border-sky-500 disabled:opacity-50 transition-all shadow-2xs';

const botonSecundario =
  'btn-pressable min-h-[44px] rounded-xl border border-slate-200 bg-white px-4 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600 disabled:opacity-50 transition-colors shadow-2xs';

const fechaVisible = (fecha: string) => fecha.split('-').reverse().join('/');

function FormularioPeriodo({
  onCrear,
  onCancelar,
}: {
  onCrear: Props['onCrear'];
  onCancelar: () => void;
}) {
  const [nombre, setNombre] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  async function guardar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const valor = nombre.trim();
    if (!valor || valor.length > 50 || !fechaInicio || !fechaFin || fechaInicio > fechaFin) {
      setError('Revisa el nombre y que la fecha de inicio no sea posterior a la fecha de fin.');
      return;
    }
    setGuardando(true);
    setError('');
    try {
      if (!(await onCrear({ nombre: valor, fechaInicio, fechaFin }))) {
        setError('No se pudo crear el período. Revisa que el nombre no esté registrado.');
      }
    } catch {
      setError('No se pudo crear el período. Inténtalo nuevamente.');
    } finally {
      setGuardando(false);
    }
  }

  return (
    <section className="relative overflow-hidden rounded-3xl border border-slate-200/90 bg-white p-5 shadow-soft sm:p-7">
      {/* Halo Resplandeciente Azul Cielo exclusivo en el título */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-12 inset-x-0 mx-auto h-28 sm:h-32 w-11/12 rounded-full blur-2xl sm:blur-3xl bg-sky-400/55"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-0 inset-x-0 h-16 bg-gradient-to-b from-sky-400/35 via-sky-300/15 to-transparent"
      />

      <div className="relative space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-sky-200 bg-sky-50 text-sky-600 shadow-soft">
            <CalendarRange aria-hidden="true" className="h-5 w-5 stroke-[2.2]" />
          </span>
          <div>
            <h2 className="text-base sm:text-lg font-bold tracking-tight text-slate-900">
              Nuevo período de evaluación
            </h2>
            <p className="text-xs sm:text-sm font-medium text-slate-500">
              Define el nombre y las fechas del ciclo. Al crearlo estará abierto para registrar evaluaciones.
            </p>
          </div>
        </div>

        <form onSubmit={guardar} className="space-y-5">
          <label className="block text-sm font-semibold text-slate-800">
            <span>Nombre del período</span>
            <input
              required
              maxLength={50}
              disabled={guardando}
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej. 2026-Q4, Evaluación Anual 2026..."
              className={`${inputStyle} mt-2`}
            />
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="block text-sm font-semibold text-slate-800">
              <span>Fecha de inicio</span>
              <input
                required
                type="date"
                disabled={guardando}
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                className={`${inputStyle} mt-2`}
              />
            </label>

            <label className="block text-sm font-semibold text-slate-800">
              <span>Fecha de fin</span>
              <input
                required
                type="date"
                disabled={guardando}
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
                className={`${inputStyle} mt-2`}
              />
            </label>
          </div>

          {error && (
            <p
              role="alert"
              className="rounded-xl border border-rose-200 bg-rose-50/80 p-3 text-xs sm:text-sm font-medium text-rose-700"
            >
              {error}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={guardando}
              className="btn-pressable min-h-[44px] rounded-xl bg-[#57CCB7] px-5 text-xs sm:text-sm font-bold text-slate-900 shadow-soft hover:bg-[#46bfa9] active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#57CCB7] disabled:opacity-50 transition-colors"
            >
              {guardando ? 'Guardando…' : 'Crear período'}
            </button>
            <button
              type="button"
              disabled={guardando}
              onClick={onCancelar}
              className={botonSecundario}
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}

function FilaPeriodo({
  periodo,
  onCambiarEstado,
}: {
  periodo: PeriodoEvaluacion;
  onCambiarEstado: Props['onCambiarEstado'];
}) {
  const [confirmar, setConfirmar] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(false);
  const [mensaje, setMensaje] = useState('');

  async function cambiar() {
    setGuardando(true);
    setError(false);
    setMensaje('');
    try {
      if (
        await onCambiarEstado(
          periodo.id,
          periodo.estado === 'abierto' ? 'cerrado' : 'abierto'
        )
      ) {
        setConfirmar(false);
        setMensaje('Estado actualizado correctamente.');
      } else {
        setError(true);
      }
    } catch {
      setError(true);
    } finally {
      setGuardando(false);
    }
  }

  const estaAbierto = periodo.estado === 'abierto';

  return (
    <li className="py-5 space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1.5 min-w-0">
          <div className="flex items-center gap-2">
            <span
              className={`h-2.5 w-2.5 rounded-full shrink-0 ${
                estaAbierto ? 'bg-emerald-500' : 'bg-slate-400'
              }`}
            />
            <p className="font-bold text-slate-900 text-sm sm:text-base tracking-tight truncate">
              {periodo.nombre}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 text-xs text-slate-600">
            <span className="flex items-center gap-1.5 tabular-nums">
              <Calendar aria-hidden="true" className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>
                {periodo.fecha_inicio && periodo.fecha_fin
                  ? `${fechaVisible(periodo.fecha_inicio)} – ${fechaVisible(periodo.fecha_fin)}`
                  : 'Fechas no registradas'}
              </span>
            </span>

            <span className="text-slate-300">·</span>

            <span
              className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 font-semibold ${
                estaAbierto
                  ? 'border-emerald-200 bg-emerald-50 text-[#007055]'
                  : 'border-slate-200 bg-slate-100 text-slate-600'
              }`}
            >
              {estaAbierto ? (
                <>
                  <CheckCircle2 aria-hidden="true" className="w-3 h-3 text-[#007055]" />
                  <span>Abierto</span>
                </>
              ) : (
                <>
                  <Lock aria-hidden="true" className="w-3 h-3 text-slate-500" />
                  <span>Cerrado</span>
                </>
              )}
            </span>
          </div>
        </div>

        <button
          type="button"
          aria-label={`${periodo.estado === 'abierto' ? 'Cerrar' : 'Reabrir'} ${periodo.nombre}`}
          disabled={guardando || confirmar}
          onClick={() => (periodo.estado === 'abierto' ? setConfirmar(true) : void cambiar())}
          className={botonSecundario}
        >
          {periodo.estado === 'abierto' ? 'Cerrar' : 'Reabrir'}
        </button>
      </div>

      {confirmar && (
        <div className="rounded-2xl border border-amber-200/90 bg-amber-50/70 p-4 space-y-3">
          <div className="flex items-start gap-2.5 text-amber-900">
            <AlertTriangle aria-hidden="true" className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
            <p className="text-xs sm:text-sm font-medium">
              No se podrán registrar nuevas evaluaciones en este período. Los resultados existentes se conservan.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            <button
              type="button"
              disabled={guardando}
              onClick={() => void cambiar()}
              className="btn-pressable min-h-[40px] rounded-xl bg-rose-700 px-4 text-xs sm:text-sm font-bold text-white hover:bg-rose-800 active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-rose-600 disabled:opacity-50 transition-colors shadow-2xs"
            >
              {guardando ? 'Guardando…' : 'Confirmar cierre'}
            </button>
            <button
              type="button"
              disabled={guardando}
              onClick={() => setConfirmar(false)}
              className={botonSecundario}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {error && (
        <p
          role="alert"
          className="rounded-xl border border-rose-200 bg-rose-50/80 p-3 text-xs sm:text-sm font-medium text-rose-700"
        >
          No se pudo cambiar el estado. Inténtalo de nuevo.
        </p>
      )}

      {mensaje && (
        <p
          role="status"
          className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-3 text-xs sm:text-sm font-semibold text-[#007055]"
        >
          {mensaje}
        </p>
      )}
    </li>
  );
}

export function ConfiguracionPeriodosRRHH({
  periodos,
  onCrear,
  onCambiarEstado,
}: Props) {
  const [creando, setCreando] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [busqueda, setBusqueda] = useState('');

  const visibles = periodos.filter((periodo) =>
    periodo.nombre.toLocaleLowerCase('es').includes(busqueda.trim().toLocaleLowerCase('es'))
  );

  if (creando) {
    return (
      <FormularioPeriodo
        onCancelar={() => setCreando(false)}
        onCrear={async (datos) => {
          const exito = await onCrear(datos);
          if (exito) {
            setCreando(false);
            setMensaje('Período creado correctamente.');
          }
          return exito;
        }}
      />
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Panel Superior: Información, Creación y Filtro con Halo Azul Cielo */}
      <section className="relative overflow-hidden rounded-3xl border border-slate-200/90 bg-white p-5 shadow-soft sm:p-7">
        {/* Doble Halo Resplandeciente Azul Cielo exclusivo en el título */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-12 inset-x-0 mx-auto h-28 sm:h-32 w-11/12 rounded-full blur-2xl sm:blur-3xl bg-sky-400/55"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-0 inset-x-0 h-16 bg-gradient-to-b from-sky-400/35 via-sky-300/15 to-transparent"
        />

        <div className="relative space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-sky-200 bg-sky-50 text-sky-600 shadow-soft">
                <CalendarRange aria-hidden="true" className="h-5 w-5 stroke-[2.2]" />
              </span>
              <div>
                <h2 className="text-base sm:text-lg font-bold tracking-tight text-slate-900">
                  Períodos de evaluación
                </h2>
                <p className="text-xs sm:text-sm font-medium text-slate-500">
                  Los períodos abiertos permiten registrar evaluaciones. El cierre y la reapertura se controlan manualmente.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setMensaje('');
                setCreando(true);
              }}
              className="btn-pressable inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-[#57CCB7] px-4 text-xs sm:text-sm font-bold text-slate-900 shadow-soft hover:bg-[#46bfa9] active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#57CCB7] transition-colors shrink-0"
            >
              <Plus aria-hidden="true" className="h-4 w-4 stroke-[2.5]" />
              <span>Nuevo período</span>
            </button>
          </div>

          {mensaje && (
            <p
              role="status"
              className="rounded-xl border border-emerald-200 bg-emerald-50/80 px-4 py-2.5 text-xs sm:text-sm font-semibold text-[#007055]"
            >
              {mensaje}
            </p>
          )}

          <label className="block text-sm font-semibold text-slate-800">
            <span>Buscar período</span>
            <div className="relative mt-2">
              <Search
                aria-hidden="true"
                className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none"
              />
              <input
                type="search"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar período..."
                className="min-h-[48px] h-12 w-full rounded-2xl border border-slate-200/90 bg-slate-50/70 hover:bg-slate-50 focus:bg-white pl-11 pr-4 text-xs sm:text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-400/40 focus:border-sky-500 transition-all shadow-2xs"
              />
            </div>
          </label>
        </div>
      </section>

      {/* Listado de Períodos Registrados (Limpio, Sin Halos Internos) */}
      <section className="rounded-3xl border border-slate-200/90 bg-white p-5 sm:p-7 shadow-soft space-y-4">
        <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
          <h2 className="text-base font-bold tracking-tight text-slate-900">
            Períodos registrados{' '}
            <span className="tabular-nums text-xs sm:text-sm font-bold text-slate-500">
              ({visibles.length})
            </span>
          </h2>
        </div>

        {visibles.length ? (
          <ul className="divide-y divide-slate-100">
            {visibles.map((periodo) => (
              <FilaPeriodo
                key={periodo.id}
                periodo={periodo}
                onCambiarEstado={onCambiarEstado}
              />
            ))}
          </ul>
        ) : (
          <div className="py-10 text-center text-xs sm:text-sm text-slate-500">
            No hay períodos que mostrar.
          </div>
        )}
      </section>
    </div>
  );
}
