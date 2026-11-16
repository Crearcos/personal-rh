import React, { useState } from 'react';
import { LockKeyhole, LogIn } from 'lucide-react';

interface AccesoRRHHProps {
  onIngresar: (correo: string, contrasena: string) => Promise<boolean>;
}

export function AccesoRRHH({ onIngresar }: AccesoRRHHProps) {
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(false);

  async function ingresar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (cargando) return;
    setCargando(true);
    setError(false);
    try {
      const resultado = await onIngresar(correo.trim().toLowerCase(), contrasena);
      if (!resultado) setError(true);
    } catch {
      setError(true);
    } finally {
      setCargando(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-12 flex items-center justify-center">
      <section className="w-full max-w-md rounded-2xl bg-white border border-slate-200 p-6 sm:p-8 shadow-soft">
        <div className="flex items-center gap-3 mb-8">
          <img src="/logo.png" alt="" className="h-11 w-11 rounded-xl object-contain flex-shrink-0" />
          <span className="text-lg font-bold tracking-tight text-slate-900">PersonalHR</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Iniciar sesión</h1>
        <p className="mt-2 text-sm text-slate-600">Ingresa con las credenciales asignadas a tu cuenta.</p>
        <form onSubmit={ingresar} className="mt-7 space-y-5">
          <div>
            <label htmlFor="correo-acceso" className="block text-sm font-semibold text-slate-800">Correo</label>
            <input id="correo-acceso" type="email" required autoComplete="username" value={correo}
              onChange={(evento) => setCorreo(evento.target.value)}
              className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 px-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#57CCB7]" />
          </div>
          <div>
            <label htmlFor="clave-acceso" className="block text-sm font-semibold text-slate-800">Contraseña</label>
            <input id="clave-acceso" type="password" required autoComplete="current-password" value={contrasena}
              onChange={(evento) => setContrasena(evento.target.value)}
              className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 px-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#57CCB7]" />
          </div>
          {error && <p role="alert" className="text-sm text-rose-700">No pudimos iniciar sesión. Revisa tus credenciales e inténtalo nuevamente.</p>}
          <button type="submit" disabled={cargando} className="min-h-11 w-full rounded-xl bg-[#57CCB7] px-4 text-sm font-bold text-slate-900 hover:bg-[#46bfa9] active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#57CCB7] focus-visible:ring-offset-2 disabled:opacity-60 flex items-center justify-center gap-2">
            {cargando ? <LockKeyhole className="h-4 w-4" aria-hidden="true" /> : <LogIn className="h-4 w-4" aria-hidden="true" />}
            {cargando ? 'Ingresando…' : 'Ingresar'}
          </button>
        </form>
      </section>
    </main>
  );
}
