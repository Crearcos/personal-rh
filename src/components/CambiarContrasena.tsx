import { useState, type FormEvent } from 'react';

type Resultado = 'actualizada' | 'credenciales_invalidas' | 'datos_invalidos' | 'error';
interface Props { onGuardar: (actual: string, nueva: string) => Promise<Resultado>; onVolver: () => void }
const campo = 'mt-2 min-h-11 w-full rounded-xl border border-slate-300 px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 disabled:opacity-60';

export function CambiarContrasena({ onGuardar, onVolver }: Props) {
  const [actual, setActual] = useState('');
  const [nueva, setNueva] = useState('');
  const [confirmacion, setConfirmacion] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [completado, setCompletado] = useState(false);
  async function guardar(evento: FormEvent) {
    evento.preventDefault();
    if (guardando) return;
    if (nueva !== confirmacion) { setError('Las contraseñas nuevas no coinciden.'); return; }
    if (nueva.length < 10 || nueva.length > 72 || nueva === actual) { setError('La nueva contraseña debe tener entre 10 y 72 caracteres y ser distinta a la actual.'); return; }
    setGuardando(true); setError('');
    try {
      const resultado = await onGuardar(actual, nueva);
      if (resultado === 'actualizada') { setActual(''); setNueva(''); setConfirmacion(''); setCompletado(true); }
      else setError(resultado === 'credenciales_invalidas' ? 'No pudimos verificar tu cuenta. Comprueba la contraseña actual y la conexión.' : 'No pudimos confirmar el cambio. Si no puedes ingresar con la anterior, prueba la nueva.');
    } catch { setError('No pudimos confirmar el cambio. Si no puedes ingresar con la anterior, prueba la nueva.'); }
    finally { setGuardando(false); }
  }
  return <section className="mx-auto mt-6 max-w-lg rounded-3xl border border-slate-200 bg-white p-5 shadow-soft sm:p-6">
    <h1 className="text-lg font-bold tracking-tight text-slate-900">Cambiar contraseña</h1>
    <p className="mt-2 text-sm text-slate-600">Cambiarás la contraseña de la cuenta con la que iniciaste sesión.</p>
    {completado ? <p role="status" className="mt-5 text-sm font-semibold text-emerald-800">Contraseña actualizada. Si se cierra tu sesión, vuelve a ingresar con la nueva.</p> :
      <form onSubmit={guardar} className="mt-5 space-y-4">
        <label className="block text-sm font-semibold text-slate-800">Contraseña actual<input className={campo} type="password" autoComplete="current-password" required disabled={guardando} value={actual} onChange={(e) => setActual(e.target.value)} /></label>
        <label className="block text-sm font-semibold text-slate-800">Nueva contraseña<input className={campo} type="password" autoComplete="new-password" required minLength={10} maxLength={72} disabled={guardando} value={nueva} onChange={(e) => setNueva(e.target.value)} /></label>
        <label className="block text-sm font-semibold text-slate-800">Confirmar nueva contraseña<input className={campo} type="password" autoComplete="new-password" required minLength={10} maxLength={72} disabled={guardando} value={confirmacion} onChange={(e) => setConfirmacion(e.target.value)} /></label>
        <p className="text-sm text-slate-600">Usa al menos 10 caracteres y una contraseña diferente a la actual.</p>
        {error && <p role="alert" className="text-sm text-rose-700">{error}</p>}
        <button type="submit" disabled={guardando} className="min-h-11 rounded-xl bg-emerald-700 px-4 text-sm font-semibold text-white hover:bg-emerald-800 active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-emerald-600 disabled:opacity-60">{guardando ? 'Guardando…' : 'Guardar contraseña'}</button>
      </form>}
    <button type="button" disabled={guardando} onClick={onVolver} className="mt-4 min-h-11 rounded-xl border border-slate-300 px-4 text-sm font-semibold text-slate-800 hover:bg-slate-50 active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-emerald-600 disabled:opacity-60">Volver</button>
  </section>;
}
