import { useRef, useState, type FormEvent } from 'react';
import { PlusCircle, AlertCircle } from 'lucide-react';
import type { SaldoVacaciones } from '../types/models';

interface Props {
  saldo: SaldoVacaciones;
  onGuardar: (dias: number, motivo: string, operacion: string) => Promise<boolean>;
  onCancelar: () => void;
}

function crearOperacion(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 15) | 64;
  bytes[8] = (bytes[8] & 63) | 128;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function CreditoSaldoRRHH({ saldo, onGuardar, onCancelar }: Props) {
  const [dias, setDias] = useState('');
  const [motivo, setMotivo] = useState('');
  const [confirmar, setConfirmar] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const operacion = useRef<{ datos: string; id: string } | null>(null);
  const cantidad = Number(dias);
  const valido = dias.trim() !== '' && Number.isFinite(cantidad) && cantidad > 0 && cantidad + Number(saldo.dias_derecho) <= 366 && Math.abs(Math.round(cantidad * 100) - cantidad * 100) < 1e-8 && motivo.trim().length >= 3 && motivo.trim().length <= 200;
  const disponible = Math.round((Number(saldo.dias_pendientes) + (Number.isFinite(cantidad) ? cantidad : 0)) * 100) / 100;

  function revisar(evento: FormEvent) {
    evento.preventDefault();
    if (!valido) { setError('Ingresa días válidos y un motivo de al menos 3 caracteres.'); return; }
    setError(''); setConfirmar(true);
  }

  async function guardar() {
    if (!valido || guardando) return;
    setGuardando(true); setError('');
    try {
      const datos = JSON.stringify([cantidad, motivo.trim()]);
      if (!operacion.current || operacion.current.datos !== datos) operacion.current = { datos, id: crearOperacion() };
      if (!await onGuardar(cantidad, motivo.trim(), operacion.current.id)) setError('No se pudo confirmar el crédito. Intenta nuevamente con los mismos datos.');
    } catch { setError('No se pudo confirmar el crédito. Intenta nuevamente con los mismos datos.'); }
    finally { setGuardando(false); }
  }

  return (
    <section aria-label="Acreditar días" className="relative overflow-hidden rounded-3xl border border-slate-200/90 bg-white p-5 shadow-soft sm:p-6">
      <div aria-hidden="true" className="pointer-events-none absolute -top-12 inset-x-0 mx-auto h-24 w-11/12 rounded-full blur-3xl bg-fuchsia-400/30" />
      <div className="relative">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-5">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-fuchsia-200 bg-fuchsia-50 text-fuchsia-600 shadow-soft">
            <PlusCircle aria-hidden="true" className="h-5 w-5 stroke-[2.2]" />
          </span>
          <div>
            <h3 className="text-base font-bold tracking-tight text-slate-900">Acreditar días de vacaciones</h3>
            <p className="text-xs sm:text-sm font-medium text-slate-500">
              Año {saldo.anio}. Se suman al saldo disponible y a los días asignados; las solicitudes y los días tomados se conservan.
            </p>
          </div>
        </div>

        <form onSubmit={revisar} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="block text-sm font-semibold text-slate-800">
              Días a acreditar
              <input
                type="number"
                min="0.01"
                max="366"
                step="0.01"
                required
                disabled={guardando || confirmar}
                value={dias}
                onChange={(e) => setDias(e.target.value)}
                className="mt-1.5 min-h-[48px] w-full rounded-xl border border-slate-300 bg-white px-3.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#57CCB7]/40 focus:border-[#57CCB7] disabled:opacity-60 transition-colors shadow-xs"
              />
            </label>
            <label className="block text-sm font-semibold text-slate-800">
              Motivo del ajuste
              <input
                type="text"
                minLength={3}
                maxLength={200}
                required
                disabled={guardando || confirmar}
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                className="mt-1.5 min-h-[48px] w-full rounded-xl border border-slate-300 bg-white px-3.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#57CCB7]/40 focus:border-[#57CCB7] disabled:opacity-60 transition-colors shadow-xs"
              />
            </label>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Disponible después del crédito</span>
            <span className="text-sm font-bold text-slate-900">
              <strong className="tabular-nums text-[#005240]">{disponible} días disponibles</strong>
            </span>
          </div>

          {error && (
            <p role="alert" className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50/70 p-3 text-sm font-semibold text-rose-700">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </p>
          )}

          {!confirmar ? (
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="submit"
                className="btn-pressable min-h-[44px] rounded-xl bg-[#57CCB7] px-5 text-sm font-bold text-slate-900 shadow-soft hover:bg-[#46bfa9] active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#57CCB7] transition-colors"
              >
                Revisar crédito
              </button>
              <button
                type="button"
                onClick={onCancelar}
                className="btn-pressable min-h-[44px] rounded-xl border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700 hover:bg-slate-50 active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400 transition-colors"
              >
                Cancelar
              </button>
            </div>
          ) : (
            <div role="group" aria-label="Confirmar crédito" className="rounded-2xl border border-[#57CCB7]/50 bg-[#57CCB7]/10 p-4 space-y-3">
              <p className="text-sm font-medium text-[#005240]">
                Se acreditarán <strong>{cantidad} días</strong>. El cambio quedará registrado con el motivo indicado.
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  disabled={guardando}
                  onClick={() => void guardar()}
                  className="btn-pressable min-h-[44px] rounded-xl bg-[#57CCB7] px-5 text-sm font-bold text-slate-900 shadow-soft hover:bg-[#46bfa9] active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#57CCB7] disabled:opacity-60 transition-colors"
                >
                  {guardando ? 'Guardando…' : 'Confirmar crédito'}
                </button>
                <button
                  type="button"
                  disabled={guardando}
                  onClick={() => setConfirmar(false)}
                  className="btn-pressable min-h-[44px] rounded-xl border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700 hover:bg-slate-50 active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400 disabled:opacity-60 transition-colors"
                >
                  Volver a editar
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </section>
  );
}
