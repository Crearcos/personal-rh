import { useState, type FormEvent } from 'react';
import { AlertCircle, KeyRound } from 'lucide-react';

export type ResultadoRestablecer = 'actualizada' | 'rechazada' | 'no_permitida' | 'sin_confirmar';
interface Props {
  correo: string;
  onGuardar: (correo: string, password: string) => Promise<ResultadoRestablecer>;
  onCancelar: () => void;
  onOcupado?: (ocupado: boolean) => void;
}

const campo = 'mt-1.5 min-h-[48px] w-full rounded-xl border border-slate-300 bg-white px-3.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#57CCB7]/40 focus:border-[#57CCB7] disabled:opacity-60 transition-colors shadow-xs';

export function RestablecerClaveRRHH({ correo, onGuardar, onCancelar, onOcupado }: Props) {
  const [nueva, setNueva] = useState('');
  const [confirmacion, setConfirmacion] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [resultado, setResultado] = useState<ResultadoRestablecer | null>(null);

  async function guardar(evento: FormEvent) {
    evento.preventDefault();
    if (guardando || resultado === 'sin_confirmar') return;
    if (nueva !== confirmacion) { setError('Las contraseñas no coinciden.'); return; }
    if (nueva.length < 10 || nueva.length > 72) { setError('La contraseña debe tener entre 10 y 72 caracteres.'); return; }
    setGuardando(true); onOcupado?.(true); setError('');
    try {
      const respuesta = await onGuardar(correo, nueva);
      setNueva(''); setConfirmacion(''); setResultado(respuesta);
      if (respuesta === 'no_permitida') setError('No se puede restablecer esta cuenta. Comprueba que esté activa, vinculada, no sea compartida con otra empresa y no tenga otra operación en curso.');
      if (respuesta === 'rechazada') setError('La contraseña fue rechazada. Prueba una diferente y vuelve a intentarlo.');
      if (respuesta === 'sin_confirmar') setError('No se pudo confirmar el resultado. No repitas la operación; contacta al administrador técnico para revisarla.');
    } catch { setNueva(''); setConfirmacion(''); setResultado('sin_confirmar'); setError('No se pudo confirmar el resultado. No repitas la operación; contacta al administrador técnico para revisarla.'); }
    finally { setGuardando(false); onOcupado?.(false); }
  }

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-slate-50/50 p-4 sm:p-5 space-y-4">
      <div className="flex items-center gap-2.5">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-cyan-200 bg-cyan-50 text-cyan-600 shadow-xs">
          <KeyRound aria-hidden="true" className="h-4 w-4 stroke-[2.2]" />
        </span>
        <div>
          <h3 className="text-base font-bold text-slate-900">Restablecer contraseña</h3>
          <p className="text-xs sm:text-sm text-slate-500">
            Solo se permite para una cuenta vinculada exclusivamente a esta empresa. El cambio quedará en el registro de actividad.
          </p>
        </div>
      </div>

      {resultado === 'actualizada' ? (
        <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50/80 px-4 py-3 text-sm font-semibold text-[#007055]">
          Contraseña restablecida correctamente.
        </p>
      ) : resultado !== 'sin_confirmar' && (
        <form onSubmit={guardar} className="space-y-4 pt-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="block text-sm font-semibold text-slate-800">
              Nueva contraseña
              <input
                className={campo}
                type="password"
                autoComplete="new-password"
                required
                minLength={10}
                maxLength={72}
                disabled={guardando}
                value={nueva}
                onChange={(e) => setNueva(e.target.value)}
              />
            </label>
            <label className="block text-sm font-semibold text-slate-800">
              Confirmar contraseña
              <input
                className={campo}
                type="password"
                autoComplete="new-password"
                required
                minLength={10}
                maxLength={72}
                disabled={guardando}
                value={confirmacion}
                onChange={(e) => setConfirmacion(e.target.value)}
              />
            </label>
          </div>

          <div className="pt-1">
            <button
              type="submit"
              disabled={guardando}
              className="btn-pressable min-h-[44px] rounded-xl bg-[#57CCB7] px-5 text-sm font-bold text-slate-900 shadow-soft hover:bg-[#46bfa9] active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#57CCB7] disabled:opacity-60 transition-colors"
            >
              {guardando ? 'Guardando…' : 'Confirmar restablecimiento'}
            </button>
          </div>
        </form>
      )}

      {error && (
        <p role="alert" className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50/70 p-3 text-sm font-semibold text-rose-700">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </p>
      )}

      <div>
        <button
          type="button"
          disabled={guardando}
          onClick={onCancelar}
          className="btn-pressable min-h-[44px] rounded-xl border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700 hover:bg-slate-50 active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400 disabled:opacity-60 transition-colors"
        >
          Volver
        </button>
      </div>
    </div>
  );
}
