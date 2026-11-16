import { useState, type FormEvent } from 'react';
import { Clock, AlertCircle } from 'lucide-react';
import type { SaldoVacaciones } from '../types/models';

export function AjusteSaldoRRHH({ saldo, onGuardar, onCancelar }: {
  saldo: SaldoVacaciones; onGuardar: (dias: number) => Promise<boolean>; onCancelar: () => void;
}) {
  const [valor, setValor] = useState(String(saldo.dias_derecho));
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);
  const tomados = Number(saldo.dias_tomados);
  const numero = valor === '' ? NaN : Number(valor);
  const disponible = Math.round((numero - tomados) * 100) / 100;

  async function guardar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!Number.isFinite(numero) || numero < tomados || numero > 366 || Math.abs(Math.round(numero * 100) - numero * 100) > 1e-8) {
      setError('Ingresa un valor válido, igual o mayor a los días tomados.'); return;
    }
    setGuardando(true); setError('');
    try {
      if (!await onGuardar(numero)) setError('No se pudo guardar el saldo. Actualiza la página e inténtalo de nuevo.');
    } catch { setError('No se pudo guardar el saldo. Inténtalo de nuevo.'); }
    finally { setGuardando(false); }
  }

  return (
    <section aria-label="Ajustar saldo" className="relative overflow-hidden rounded-3xl border border-slate-200/90 bg-white p-5 shadow-soft sm:p-6">
      <div aria-hidden="true" className="pointer-events-none absolute -top-12 inset-x-0 mx-auto h-24 w-11/12 rounded-full blur-3xl bg-fuchsia-400/30" />
      <div className="relative">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-5">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-fuchsia-200 bg-fuchsia-50 text-fuchsia-600 shadow-soft">
            <Clock aria-hidden="true" className="h-5 w-5 stroke-[2.2]" />
          </span>
          <div>
            <h3 className="text-base font-bold tracking-tight text-slate-900">Ajustar saldo de vacaciones</h3>
            <p className="text-xs sm:text-sm font-medium text-slate-500">Período {saldo.anio}. Los días tomados se conservan.</p>
          </div>
        </div>

        <form onSubmit={guardar} className="space-y-5">
          <div>
            <label htmlFor="dias-asignados-input" className="block text-sm font-semibold text-slate-800">
              Días asignados
            </label>
            <input
              id="dias-asignados-input"
              aria-label="Días asignados"
              type="number"
              min="0"
              max="366"
              step="0.01"
              required
              disabled={guardando}
              value={valor}
              onChange={(event) => setValor(event.target.value)}
              className="mt-1.5 min-h-[48px] w-full rounded-xl border border-slate-300 bg-white px-3.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#57CCB7]/40 focus:border-[#57CCB7] disabled:opacity-60 transition-colors shadow-xs"
            />
          </div>

          <dl className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5 text-center">
              <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">Días tomados</dt>
              <dd className="mt-1 text-base sm:text-lg font-bold text-slate-900 tabular-nums">{tomados} días</dd>
            </div>
            <div className="rounded-2xl border border-[#57CCB7]/50 bg-[#57CCB7]/10 p-3.5 text-center">
              <dt className="text-xs font-semibold uppercase tracking-wider text-[#00614a]">Disponible estimado</dt>
              <dd className="mt-1 text-base sm:text-lg font-bold text-[#005240] tabular-nums">
                {Number.isFinite(disponible) && disponible >= 0 ? `${disponible} días` : '—'}
              </dd>
            </div>
          </dl>

          {error && (
            <p role="alert" className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50/70 p-3 text-sm font-semibold text-rose-700">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </p>
          )}

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={guardando}
              className="btn-pressable min-h-[44px] rounded-xl bg-[#57CCB7] px-5 text-sm font-bold text-slate-900 shadow-soft hover:bg-[#46bfa9] active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#57CCB7] disabled:opacity-60 transition-colors"
            >
              {guardando ? 'Guardando…' : 'Guardar saldo'}
            </button>
            <button
              type="button"
              disabled={guardando}
              onClick={onCancelar}
              className="btn-pressable min-h-[44px] rounded-xl border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700 hover:bg-slate-50 active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400 disabled:opacity-60 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
