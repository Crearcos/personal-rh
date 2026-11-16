import { useState, type FormEvent } from 'react';
import { Sliders, Plus, Search, Info, AlertTriangle } from 'lucide-react';
import type { Solicitud, TipoSolicitud, DatosTipoSolicitud } from '../types/models';

interface Props {
  tipos: TipoSolicitud[];
  solicitudes: Solicitud[];
  onGuardar: (datos: DatosTipoSolicitud) => Promise<boolean>;
  onCambiarEstado: (id: string, activo: boolean) => Promise<boolean>;
}

const botonSecundario =
  'btn-pressable min-h-[44px] rounded-xl border border-slate-200 bg-white px-4 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600 disabled:cursor-not-allowed disabled:opacity-50 transition-colors shadow-2xs';

function FormularioTipo({
  tipo,
  onGuardar,
  onCancelar,
}: {
  tipo?: TipoSolicitud;
  onGuardar: Props['onGuardar'];
  onCancelar: () => void;
}) {
  const [nombre, setNombre] = useState(tipo?.nombre || '');
  const [descuentaSaldo, setDescuentaSaldo] = useState(tipo?.descuenta_saldo || false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  async function guardar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const valor = nombre.trim();
    if (!valor || valor.length > 100) {
      setError('Ingresa un nombre válido.');
      return;
    }
    setGuardando(true);
    setError('');
    try {
      if (
        !(await onGuardar({
          ...(tipo ? { id: tipo.id } : {}),
          nombre: valor,
          descuentaSaldo,
        }))
      ) {
        setError(
          'No se pudo guardar. Revisa que el nombre no esté duplicado y que el tipo no tenga solicitudes asociadas.'
        );
      }
    } catch {
      setError('No se pudo guardar el tipo. Inténtalo nuevamente.');
    } finally {
      setGuardando(false);
    }
  }

  return (
    <section className="relative overflow-hidden rounded-3xl border border-slate-200/90 bg-white p-5 shadow-soft sm:p-7">
      {/* Halo Resplandeciente Violeta exclusivo en el título */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-12 inset-x-0 mx-auto h-28 sm:h-32 w-11/12 rounded-full blur-2xl sm:blur-3xl bg-violet-400/55"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-0 inset-x-0 h-16 bg-gradient-to-b from-violet-400/35 via-violet-300/15 to-transparent"
      />

      <div className="relative space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-violet-200 bg-violet-50 text-violet-600 shadow-soft">
            <Sliders aria-hidden="true" className="h-5 w-5 stroke-[2.2]" />
          </span>
          <div>
            <h2 className="text-base sm:text-lg font-bold tracking-tight text-slate-900">
              {tipo ? 'Editar tipo de solicitud' : 'Nuevo tipo de solicitud'}
            </h2>
            <p className="text-xs sm:text-sm font-medium text-slate-500">
              Configura los parámetros del permiso y cómo interactúa con los saldos de los colaboradores.
            </p>
          </div>
        </div>

        <form onSubmit={guardar} className="space-y-5">
          <label className="block text-sm font-semibold text-slate-800">
            <span>Nombre del tipo</span>
            <input
              required
              maxLength={100}
              disabled={guardando}
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej. Permiso de estudio, Asuntos médicos..."
              className="mt-2 min-h-[48px] h-12 w-full rounded-2xl border border-slate-200/90 bg-slate-50/70 hover:bg-slate-50 focus:bg-white px-4 text-xs sm:text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-400/40 focus:border-violet-500 transition-all shadow-2xs"
            />
          </label>

          <label className="flex items-start gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/60 hover:bg-slate-50/90 p-4 transition-colors cursor-pointer select-none">
            <input
              type="checkbox"
              checked={descuentaSaldo}
              disabled={guardando}
              onChange={(e) => setDescuentaSaldo(e.target.checked)}
              className="mt-0.5 h-5 w-5 shrink-0 rounded-md border-slate-300 text-violet-600 accent-violet-600 focus:ring-violet-400 cursor-pointer"
            />
            <div className="space-y-1">
              <span className="block text-sm font-bold text-slate-900">
                Descuenta días de vacaciones
              </span>
              <span className="block text-xs text-slate-500 font-normal leading-relaxed">
                Al activarse, las ausencias aprobadas de este tipo restarán días automáticamente del saldo de vacaciones anual del colaborador.
              </span>
            </div>
          </label>

          {error && (
            <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50/80 p-3 text-xs sm:text-sm font-medium text-rose-700">
              {error}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={guardando}
              className="btn-pressable min-h-[44px] rounded-xl bg-[#57CCB7] px-5 text-xs sm:text-sm font-bold text-slate-900 shadow-soft hover:bg-[#46bfa9] active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#57CCB7] disabled:opacity-50 transition-colors"
            >
              {guardando ? 'Guardando…' : 'Guardar tipo'}
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

function FilaTipo({
  tipo,
  usado,
  onEditar,
  onCambiarEstado,
}: {
  tipo: TipoSolicitud;
  usado: boolean;
  onEditar: () => void;
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
      if (await onCambiarEstado(tipo.id, !tipo.activo)) {
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

  return (
    <li className="py-5 space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1.5 min-w-0">
          <div className="flex items-center gap-2">
            <span
              className={`h-2.5 w-2.5 rounded-full shrink-0 ${
                tipo.activo ? 'bg-emerald-500' : 'bg-slate-400'
              }`}
            />
            <p className="font-bold text-slate-900 text-sm sm:text-base tracking-tight truncate">
              {tipo.nombre}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span
              className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 font-semibold ${
                tipo.descuenta_saldo
                  ? 'border-amber-200 bg-amber-50 text-amber-900'
                  : 'border-slate-200 bg-slate-100 text-slate-700'
              }`}
            >
              {tipo.descuenta_saldo ? 'Descuenta vacaciones' : 'No descuenta vacaciones'}
            </span>
            <span className="text-slate-300">·</span>
            <span
              className={`inline-flex items-center gap-1 font-semibold ${
                tipo.activo ? 'text-emerald-700' : 'text-slate-500'
              }`}
            >
              {tipo.activo ? 'Activo' : 'Inactivo'}
            </span>
          </div>

          {usado && (
            <p className="text-xs text-slate-500 font-normal leading-relaxed flex items-center gap-1.5 pt-0.5">
              <Info aria-hidden="true" className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>Este tipo tiene solicitudes asociadas; su nombre y descuento se conservan para el historial.</span>
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            aria-label={`Editar ${tipo.nombre}`}
            disabled={usado || guardando}
            onClick={onEditar}
            className={botonSecundario}
          >
            Editar
          </button>
          <button
            type="button"
            aria-label={`${tipo.activo ? 'Desactivar' : 'Activar'} ${tipo.nombre}`}
            disabled={guardando || confirmar}
            onClick={() => (tipo.activo ? setConfirmar(true) : void cambiar())}
            className={botonSecundario}
          >
            {tipo.activo ? 'Desactivar' : 'Activar'}
          </button>
        </div>
      </div>

      {confirmar && (
        <div className="rounded-2xl border border-amber-200/90 bg-amber-50/70 p-4 space-y-3">
          <div className="flex items-start gap-2.5 text-amber-900">
            <AlertTriangle aria-hidden="true" className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
            <p className="text-xs sm:text-sm font-medium">
              Ya no estará disponible para solicitudes nuevas; el historial se conserva.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            <button
              type="button"
              disabled={guardando}
              onClick={() => void cambiar()}
              className="btn-pressable min-h-[40px] rounded-xl bg-rose-700 px-4 text-xs sm:text-sm font-bold text-white hover:bg-rose-800 active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-rose-600 disabled:opacity-50 transition-colors shadow-2xs"
            >
              {guardando ? 'Guardando…' : 'Confirmar desactivación'}
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
        <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50/80 p-3 text-xs sm:text-sm font-medium text-rose-700">
          No se pudo cambiar el estado. Inténtalo de nuevo.
        </p>
      )}

      {mensaje && (
        <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-3 text-xs sm:text-sm font-semibold text-[#007055]">
          {mensaje}
        </p>
      )}
    </li>
  );
}

export function ConfiguracionTiposRRHH({
  tipos,
  solicitudes,
  onGuardar,
  onCambiarEstado,
}: Props) {
  const [formulario, setFormulario] = useState<'nuevo' | TipoSolicitud | null>(null);
  const [mensaje, setMensaje] = useState('');
  const [busqueda, setBusqueda] = useState('');

  const visibles = tipos.filter((tipo) =>
    tipo.nombre.toLocaleLowerCase('es').includes(busqueda.trim().toLocaleLowerCase('es'))
  );

  if (formulario) {
    return (
      <FormularioTipo
        tipo={formulario === 'nuevo' ? undefined : formulario}
        onCancelar={() => setFormulario(null)}
        onGuardar={async (datos) => {
          const exito = await onGuardar(datos);
          if (exito) {
            setFormulario(null);
            setMensaje('Tipo guardado correctamente.');
          }
          return exito;
        }}
      />
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Panel Superior: Información, Creación y Filtro con Halo Violeta */}
      <section className="relative overflow-hidden rounded-3xl border border-slate-200/90 bg-white p-5 shadow-soft sm:p-7">
        {/* Doble Halo Resplandeciente Violeta exclusivo en el título */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-12 inset-x-0 mx-auto h-28 sm:h-32 w-11/12 rounded-full blur-2xl sm:blur-3xl bg-violet-400/55"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-0 inset-x-0 h-16 bg-gradient-to-b from-violet-400/35 via-violet-300/15 to-transparent"
        />

        <div className="relative space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-violet-200 bg-violet-50 text-violet-600 shadow-soft">
                <Sliders aria-hidden="true" className="h-5 w-5 stroke-[2.2]" />
              </span>
              <div>
                <h2 className="text-base sm:text-lg font-bold tracking-tight text-slate-900">
                  Tipos de solicitud
                </h2>
                <p className="text-xs sm:text-sm font-medium text-slate-500">
                  Define los permisos disponibles y si descuentan días de vacaciones.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setMensaje('');
                setFormulario('nuevo');
              }}
              className="btn-pressable inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-[#57CCB7] px-4 text-xs sm:text-sm font-bold text-slate-900 shadow-soft hover:bg-[#46bfa9] active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#57CCB7] transition-colors shrink-0"
            >
              <Plus aria-hidden="true" className="h-4 w-4 stroke-[2.5]" />
              <span>Nuevo tipo</span>
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
            <span>Buscar tipo</span>
            <div className="relative mt-2">
              <Search
                aria-hidden="true"
                className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none"
              />
              <input
                type="search"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar tipo..."
                className="min-h-[48px] h-12 w-full rounded-2xl border border-slate-200/90 bg-slate-50/70 hover:bg-slate-50 focus:bg-white pl-11 pr-4 text-xs sm:text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-400/40 focus:border-violet-500 transition-all shadow-2xs"
              />
            </div>
          </label>
        </div>
      </section>

      {/* Listado de Tipos Registrados (Limpio, Sin Halos Internos) */}
      <section className="rounded-3xl border border-slate-200/90 bg-white p-5 sm:p-7 shadow-soft space-y-4">
        <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
          <h2 className="text-base font-bold tracking-tight text-slate-900">
            Tipos registrados{' '}
            <span className="tabular-nums text-xs sm:text-sm font-bold text-slate-500">
              ({visibles.length})
            </span>
          </h2>
        </div>

        {visibles.length ? (
          <ul className="divide-y divide-slate-100">
            {visibles.map((tipo) => (
              <FilaTipo
                key={tipo.id}
                tipo={tipo}
                usado={solicitudes.some((s) => s.tipo_id === tipo.id)}
                onEditar={() => {
                  setMensaje('');
                  setFormulario(tipo);
                }}
                onCambiarEstado={onCambiarEstado}
              />
            ))}
          </ul>
        ) : (
          <div className="py-10 text-center text-xs sm:text-sm text-slate-500">
            No hay tipos que mostrar.
          </div>
        )}
      </section>
    </div>
  );
}
