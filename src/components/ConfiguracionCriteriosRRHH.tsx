import { useRef, useState, type FormEvent } from 'react';
import { Award, Plus, Trash2, CheckCircle2, AlertCircle, Scale } from 'lucide-react';
import type { CriterioEvaluacion, CriterioConfig } from '../types/models';

type Fila = { clave: string; nombre: string; porcentaje: string };

const inputStyle =
  'min-h-[48px] h-12 w-full rounded-2xl border border-slate-200/90 bg-slate-50/70 hover:bg-slate-50 focus:bg-white px-4 text-xs sm:text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-500 disabled:opacity-50 transition-all shadow-2xs';

function validarFilas(filas: Fila[]): CriterioConfig[] | null {
  if (!filas.length || filas.length > 20) return null;
  const nombres = filas.map((fila) => fila.nombre.trim());
  const porcentajes = filas.map((fila) => Number(fila.porcentaje));
  if (
    nombres.some((nombre) => !nombre || nombre.length > 100) ||
    new Set(nombres.map((nombre) => nombre.toLocaleLowerCase('es'))).size !== nombres.length
  ) {
    return null;
  }
  if (
    porcentajes.some(
      (valor) =>
        !Number.isFinite(valor) ||
        valor <= 0 ||
        valor > 100 ||
        Math.abs(Math.round(valor * 100) - valor * 100) > 1e-8
    )
  ) {
    return null;
  }
  if (porcentajes.reduce((total, valor) => total + Math.round(valor * 100), 0) !== 10000) {
    return null;
  }
  return nombres.map((nombre, indice) => ({
    nombre,
    peso: Math.round(porcentajes[indice] * 100) / 10000,
  }));
}

export function ConfiguracionCriteriosRRHH({
  criterios,
  onGuardar,
}: {
  criterios: CriterioEvaluacion[];
  onGuardar: (datos: CriterioConfig[]) => Promise<boolean>;
}) {
  const [filas, setFilas] = useState<Fila[]>(() =>
    criterios
      .filter((criterio) => criterio.activo !== false)
      .map((criterio) => ({
        clave: criterio.id,
        nombre: criterio.nombre,
        porcentaje: String(Math.round(Number(criterio.peso) * 10000) / 100),
      }))
  );
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const secuencia = useRef(0);

  const total = filas.reduce((suma, fila) => suma + (Number(fila.porcentaje) || 0), 0);
  const totalRedondeado = Math.round(total * 100) / 100;
  const esCienPorCiento = Math.round(total * 100) === 10000;

  function cambiar(clave: string, campo: 'nombre' | 'porcentaje', valor: string) {
    setMensaje('');
    setFilas((actuales) =>
      actuales.map((fila) => (fila.clave === clave ? { ...fila, [campo]: valor } : fila))
    );
  }

  async function guardar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const datos = validarFilas(filas);
    if (!datos) {
      setError('Usa nombres distintos y pesos mayores a cero que sumen 100 %.');
      return;
    }
    setGuardando(true);
    setError('');
    setMensaje('');
    try {
      if (await onGuardar(datos)) {
        setMensaje('Criterios actualizados correctamente.');
      } else {
        setError('No se pudieron guardar los criterios. Inténtalo nuevamente.');
      }
    } catch {
      setError('No se pudieron guardar los criterios. Inténtalo nuevamente.');
    } finally {
      setGuardando(false);
    }
  }

  return (
    <section className="relative overflow-hidden rounded-3xl border border-slate-200/90 bg-white p-5 shadow-soft sm:p-7">
      {/* Halo Resplandeciente Ámbar exclusivo en el título */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-12 inset-x-0 mx-auto h-28 sm:h-32 w-11/12 rounded-full blur-2xl sm:blur-3xl bg-amber-400/55"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-0 inset-x-0 h-16 bg-gradient-to-b from-amber-400/35 via-amber-300/15 to-transparent"
      />

      <div className="relative space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-amber-200 bg-amber-50 text-amber-600 shadow-soft">
            <Award aria-hidden="true" className="h-5 w-5 stroke-[2.2]" />
          </span>
          <div>
            <h2 className="text-base sm:text-lg font-bold tracking-tight text-slate-900">
              Criterios de evaluación
            </h2>
            <p className="text-xs sm:text-sm font-medium text-slate-500">
              Define los criterios y su peso para próximas evaluaciones. Los resultados anteriores conservan sus criterios.
            </p>
          </div>
        </div>

        {/* Panel de Visualización del Balance de Ponderación */}
        <div className="rounded-2xl border border-slate-200/80 bg-slate-50/60 p-4 space-y-2.5">
          <div className="flex items-center justify-between text-xs sm:text-sm">
            <div className="flex items-center gap-2">
              <Scale aria-hidden="true" className="w-4 h-4 text-amber-600" />
              <span className="font-semibold text-slate-700">Balance de ponderación</span>
            </div>
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold tabular-nums border ${
                esCienPorCiento
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                  : totalRedondeado > 100
                  ? 'border-rose-200 bg-rose-50 text-rose-800'
                  : 'border-amber-200 bg-amber-50 text-amber-800'
              }`}
            >
              {esCienPorCiento ? (
                <>
                  <CheckCircle2 aria-hidden="true" className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Suma exacta (100 %)</span>
                </>
              ) : (
                <>
                  <AlertCircle aria-hidden="true" className="w-3.5 h-3.5" />
                  <span>
                    {totalRedondeado > 100
                      ? `Excede por +${Math.round((totalRedondeado - 100) * 100) / 100} %`
                      : `Falta ${Math.round((100 - totalRedondeado) * 100) / 100} %`}
                  </span>
                </>
              )}
            </span>
          </div>

          <div aria-hidden="true" className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                esCienPorCiento
                  ? 'bg-emerald-500'
                  : totalRedondeado > 100
                  ? 'bg-rose-500'
                  : 'bg-amber-500'
              }`}
              style={{ width: `${Math.min(100, Math.max(0, totalRedondeado))}%` }}
            />
          </div>
        </div>

        <form onSubmit={guardar} className="space-y-5">
          <div className="divide-y divide-slate-100">
            {filas.map((fila, indice) => (
              <div
                key={fila.clave}
                className="grid gap-3 py-4 sm:grid-cols-[1fr_9rem_auto] sm:items-end"
              >
                <label className="text-sm font-semibold text-slate-800">
                  <span className="flex items-center gap-1.5">
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-amber-100 text-amber-800 text-[11px] font-bold">
                      {indice + 1}
                    </span>
                    <span>Criterio {indice + 1}</span>
                  </span>
                  <input
                    aria-label={`Nombre del criterio ${indice + 1}`}
                    required
                    maxLength={100}
                    disabled={guardando}
                    value={fila.nombre}
                    onChange={(e) => cambiar(fila.clave, 'nombre', e.target.value)}
                    placeholder="Nombre del criterio"
                    className={`${inputStyle} mt-2`}
                  />
                </label>

                <label className="text-sm font-semibold text-slate-800">
                  <span>Peso (%)</span>
                  <input
                    aria-label={`Peso de ${fila.nombre || `criterio ${indice + 1}`}`}
                    type="number"
                    min="0.01"
                    max="100"
                    step="0.01"
                    required
                    disabled={guardando}
                    value={fila.porcentaje}
                    onChange={(e) => cambiar(fila.clave, 'porcentaje', e.target.value)}
                    className={`${inputStyle} mt-2 tabular-nums`}
                  />
                </label>

                <button
                  type="button"
                  aria-label={`Quitar ${fila.nombre || `criterio ${indice + 1}`}`}
                  disabled={guardando || filas.length <= 1}
                  onClick={() => {
                    setMensaje('');
                    setFilas((actuales) => actuales.filter((item) => item.clave !== fila.clave));
                  }}
                  className="btn-pressable inline-flex min-h-[48px] h-12 items-center justify-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-4 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 active:scale-[0.97] disabled:opacity-40 transition-colors shadow-2xs shrink-0"
                >
                  <Trash2 aria-hidden="true" className="w-4 h-4" />
                  <span>Quitar</span>
                </button>
              </div>
            ))}
          </div>

          <p className="mt-3 text-sm font-semibold text-slate-800 tabular-nums">
            Total asignado: {totalRedondeado} %
          </p>

          {error && (
            <p
              role="alert"
              className="rounded-xl border border-rose-200 bg-rose-50/80 p-3 text-xs sm:text-sm font-medium text-rose-700"
            >
              {error}
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

          <div className="mt-6 flex flex-wrap items-center gap-3 pt-2">
            <button
              type="button"
              disabled={guardando || filas.length >= 20}
              onClick={() => {
                secuencia.current += 1;
                setMensaje('');
                setFilas((actuales) => [
                  ...actuales,
                  { clave: `nuevo_${secuencia.current}`, nombre: '', porcentaje: '' },
                ]);
              }}
              className="btn-pressable inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-amber-200 bg-amber-50/80 px-4 text-xs sm:text-sm font-bold text-amber-800 hover:bg-amber-100 active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-600 disabled:opacity-50 transition-colors shadow-2xs"
            >
              <Plus aria-hidden="true" className="w-4 h-4 stroke-[2.5]" />
              <span>Añadir criterio</span>
            </button>

            <button
              type="submit"
              disabled={guardando}
              className="btn-pressable min-h-[44px] rounded-xl bg-[#57CCB7] px-5 text-xs sm:text-sm font-bold text-slate-900 shadow-soft hover:bg-[#46bfa9] active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#57CCB7] disabled:opacity-50 transition-colors"
            >
              {guardando ? 'Guardando…' : 'Guardar criterios'}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
