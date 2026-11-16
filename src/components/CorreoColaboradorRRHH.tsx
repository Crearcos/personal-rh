import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Mail, AlertCircle } from 'lucide-react';

export function CorreoColaboradorRRHH({ onConsultar, onGuardar, onCancelar }: {
  onConsultar: () => Promise<string | null>; onGuardar: (correo: string) => Promise<boolean>; onCancelar: () => void;
}) {
  const consultar = useRef(onConsultar);
  const [correo, setCorreo] = useState('');
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [errorCarga, setErrorCarga] = useState(false);
  const [exito, setExito] = useState(false);

  useEffect(() => {
    let activo = true;
    consultar.current().then((valor) => {
      if (!activo) return;
      if (valor === null) { setErrorCarga(true); setError('No se pudo cargar el correo. Vuelve a intentarlo.'); }
      else setCorreo(valor);
    }).catch(() => { if (activo) { setErrorCarga(true); setError('No se pudo cargar el correo. Vuelve a intentarlo.'); } })
      .finally(() => { if (activo) setCargando(false); });
    return () => { activo = false; };
  }, []);

  async function guardar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const valor = correo.trim().toLowerCase();
    if (valor.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor)) { setError('Ingresa un correo válido.'); return; }
    setGuardando(true); setError('');
    try {
      if (await onGuardar(valor)) setExito(true);
      else setError('No se pudo guardar el correo. Comprueba que no esté registrado e inténtalo de nuevo.');
    } catch { setError('No se pudo guardar el correo. Inténtalo de nuevo.'); }
    finally { setGuardando(false); }
  }

  return (
    <section className="relative overflow-hidden rounded-3xl border border-slate-200/90 bg-white p-5 shadow-soft sm:p-6">
      <div aria-hidden="true" className="pointer-events-none absolute -top-12 inset-x-0 mx-auto h-24 w-11/12 rounded-full blur-3xl bg-fuchsia-400/30" />
      <div className="relative">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-5">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-fuchsia-200 bg-fuchsia-50 text-fuchsia-600 shadow-soft">
            <Mail aria-hidden="true" className="h-5 w-5 stroke-[2.2]" />
          </span>
          <div>
            <h2 className="text-lg font-bold tracking-tight text-slate-900">Cambiar correo</h2>
            <p className="text-xs sm:text-sm font-medium text-slate-500">Actualiza el correo de la ficha del colaborador.</p>
          </div>
        </div>

        {cargando ? (
          <p role="status" className="mt-4 text-sm text-slate-600">Cargando correo…</p>
        ) : exito ? (
          <p role="status" className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50/80 px-4 py-3 text-sm font-semibold text-[#007055]">
            Correo actualizado correctamente.
          </p>
        ) : (
          <form onSubmit={guardar} className="mt-5 space-y-4">
            <label className="block text-sm font-semibold text-slate-800">
              Correo
              <input
                type="email"
                required
                maxLength={254}
                disabled={guardando || errorCarga}
                value={correo}
                onChange={(event) => setCorreo(event.target.value)}
                className="mt-1.5 min-h-[48px] w-full rounded-xl border border-slate-300 bg-white px-3.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#57CCB7]/40 focus:border-[#57CCB7] disabled:opacity-60 transition-colors shadow-xs"
              />
            </label>

            {error && (
              <p role="alert" className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50/70 p-3 text-sm font-semibold text-rose-700">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                <span>{error}</span>
              </p>
            )}

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={guardando || errorCarga}
                className="btn-pressable min-h-[44px] rounded-xl bg-[#57CCB7] px-5 text-sm font-bold text-slate-900 shadow-soft hover:bg-[#46bfa9] active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#57CCB7] disabled:opacity-60 transition-colors"
              >
                {guardando ? 'Guardando…' : 'Guardar correo'}
              </button>
              <button
                type="button"
                disabled={guardando}
                onClick={onCancelar}
                className="btn-pressable min-h-[44px] rounded-xl border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700 hover:bg-slate-50 active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400 disabled:opacity-60 transition-colors"
              >
                Volver a la ficha
              </button>
            </div>
          </form>
        )}

        {exito && (
          <div className="mt-5">
            <button
              type="button"
              disabled={guardando}
              onClick={onCancelar}
              className="btn-pressable min-h-[44px] rounded-xl border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700 hover:bg-slate-50 active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400 disabled:opacity-60 transition-colors"
            >
              Volver a la ficha
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
