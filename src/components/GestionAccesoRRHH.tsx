import { useState, type FormEvent } from 'react';
import { AlertCircle } from 'lucide-react';
import { RestablecerClaveRRHH, type ResultadoRestablecer } from './RestablecerClaveRRHH';

type Estado = 'activo' | 'sin_acceso';
type ResultadoCrear = 'creada' | 'sin_vincular' | 'error';
interface Props {
  correo: string; estado: Estado;
  onCrear: (correo: string, password: string) => Promise<ResultadoCrear>;
  onRevocar: () => Promise<boolean>;
  onVincular: (correo: string) => Promise<'vinculada' | 'existente' | null>;
  onRestablecer?: (correo: string, password: string) => Promise<ResultadoRestablecer>;
  onOcupado?: (ocupado: boolean) => void;
}

export function GestionAccesoRRHH({ correo, estado: inicial, onCrear, onRevocar, onVincular, onRestablecer, onOcupado }: Props) {
  const [estado, setEstado] = useState(inicial);
  const [password, setPassword] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const [confirmar, setConfirmar] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');
  const [restableciendo, setRestableciendo] = useState(false);

  async function crear(evento: FormEvent) {
    evento.preventDefault(); if (ocupado || password.length < 10) return;
    setOcupado(true); setError(''); setMensaje('');
    try {
      const res = await onCrear(correo, password); setPassword('');
      if (res === 'creada') { setEstado('activo'); setMensaje('Acceso creado y vinculado correctamente.'); }
      else if (res === 'sin_vincular') setError('La cuenta se creó, pero no se vinculó. Intenta vincular la cuenta existente.');
      else setError('No se pudo crear la cuenta. Si ya existe, intenta vincularla.');
    } catch { setError('No se pudo completar la operación. Revisa el estado antes de volver a intentarlo.'); }
    finally { setOcupado(false); }
  }

  async function vincular() {
    if (ocupado) return; setOcupado(true); setError(''); setMensaje('');
    try {
      if (await onVincular(correo)) { setEstado('activo'); setMensaje('Cuenta vinculada correctamente.'); }
      else setError('No se pudo vincular la cuenta existente. Comprueba que esté confirmada y corresponda al correo de la ficha.');
    } catch { setError('No se pudo vincular la cuenta. Inténtalo nuevamente.'); }
    finally { setOcupado(false); }
  }

  async function revocar() {
    if (ocupado) return; setOcupado(true); setError(''); setMensaje('');
    try {
      if (await onRevocar()) { setEstado('sin_acceso'); setConfirmar(false); setMensaje('Acceso retirado; la ficha y su historial se conservan.'); }
      else setError('No se pudo retirar el acceso. Actualiza la página e inténtalo nuevamente.');
    } catch { setError('No se pudo retirar el acceso. Inténtalo nuevamente.'); }
    finally { setOcupado(false); }
  }

  return (
    <div className="mt-5 space-y-4">
      <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Estado</span>
        <span className="text-sm font-bold text-slate-900">
          <strong>{estado === 'activo' ? 'Acceso activo' : 'Sin acceso a esta empresa'}</strong>
        </span>
      </div>

      {estado === 'sin_acceso' && (
        <div className="space-y-4">
          <form onSubmit={crear} className="space-y-3">
            <label className="block text-sm font-semibold text-slate-800">
              Contraseña de acceso
              <input
                type="password"
                minLength={10}
                maxLength={72}
                required
                autoComplete="new-password"
                disabled={ocupado}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1.5 min-h-[48px] w-full rounded-xl border border-slate-300 bg-white px-3.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#57CCB7]/40 focus:border-[#57CCB7] disabled:opacity-60 transition-colors shadow-xs"
              />
            </label>
            <p className="text-xs sm:text-sm text-slate-500">Mínimo 10 caracteres. La cuenta se confirmará para esta demo.</p>
            <button
              type="submit"
              disabled={ocupado}
              className="btn-pressable min-h-[44px] rounded-xl bg-[#57CCB7] px-5 text-sm font-bold text-slate-900 shadow-soft hover:bg-[#46bfa9] active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#57CCB7] disabled:opacity-60 transition-colors"
            >
              {ocupado ? 'Procesando…' : 'Crear acceso'}
            </button>
          </form>
          <div>
            <button
              type="button"
              disabled={ocupado}
              onClick={() => void vincular()}
              className="btn-pressable min-h-[44px] rounded-xl border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700 hover:border-[#57CCB7] hover:bg-slate-50 active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#57CCB7] disabled:opacity-60 transition-colors"
            >
              Vincular cuenta existente
            </button>
          </div>
        </div>
      )}

      {estado === 'activo' && !confirmar && !restableciendo && onRestablecer && (
        <button
          type="button"
          onClick={() => setRestableciendo(true)}
          className="btn-pressable min-h-[44px] rounded-xl border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700 hover:border-[#57CCB7] hover:bg-slate-50 active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#57CCB7] transition-colors"
        >
          Restablecer contraseña
        </button>
      )}

      {estado === 'activo' && restableciendo && onRestablecer && (
        <RestablecerClaveRRHH
          correo={correo}
          onGuardar={onRestablecer}
          onCancelar={() => setRestableciendo(false)}
          onOcupado={onOcupado}
        />
      )}

      {estado === 'activo' && !restableciendo && (!confirmar ? (
        <div>
          <button
            type="button"
            disabled={ocupado}
            onClick={() => setConfirmar(true)}
            className="btn-pressable min-h-[44px] rounded-xl border border-rose-200 bg-rose-50/50 px-5 text-sm font-semibold text-rose-700 hover:bg-rose-100/70 active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600 disabled:opacity-60 transition-colors"
          >
            Retirar acceso
          </button>
        </div>
      ) : (
        <div role="group" aria-label="Confirmar retiro de acceso" className="rounded-2xl border border-rose-200/90 bg-rose-50/60 p-4 space-y-3">
          <p className="text-sm font-medium text-slate-800">
            La persona dejará de acceder a esta empresa. Su ficha e historial se conservarán.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              disabled={ocupado}
              onClick={() => void revocar()}
              className="btn-pressable min-h-[44px] rounded-xl bg-rose-700 px-5 text-sm font-semibold text-white hover:bg-rose-800 active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600 disabled:opacity-60 transition-colors"
            >
              Confirmar retiro
            </button>
            <button
              type="button"
              disabled={ocupado}
              onClick={() => setConfirmar(false)}
              className="btn-pressable min-h-[44px] rounded-xl border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700 hover:bg-slate-50 active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400 disabled:opacity-60 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      ))}

      {mensaje && (
        <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50/80 px-4 py-3 text-sm font-semibold text-[#007055]">
          {mensaje}
        </p>
      )}

      {error && (
        <p role="alert" className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50/70 p-3 text-sm font-semibold text-rose-700">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}
