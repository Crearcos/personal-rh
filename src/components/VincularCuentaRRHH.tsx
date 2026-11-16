import { useEffect, useRef, useState } from 'react';
import { ShieldCheck, Mail, AlertCircle } from 'lucide-react';
import { GestionAccesoRRHH } from './GestionAccesoRRHH';
import { crearAccesoRRHH, estadoAcceso, revocarAcceso, restablecerClaveRRHH } from '../services/gestionAccesoRRHH';
import type { RolColaborador } from '../services/gestionRRHHValidation';

type Resultado = 'vinculada' | 'existente' | null;
interface Props {
  onConsultar: () => Promise<string | null>;
  onVincular: (correo: string) => Promise<Resultado>;
  onVolver: () => void;
  empresaId?: string;
  empleadoId?: string;
  rol?: RolColaborador;
}

export function VincularCuentaRRHH({ onConsultar, onVincular, onVolver, empresaId, empleadoId, rol }: Props) {
  const consultar = useRef(onConsultar);
  const [correo, setCorreo] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [operacionActiva, setOperacionActiva] = useState(false);
  const [resultado, setResultado] = useState<Resultado>(null);
  const [error, setError] = useState('');
  const [estado, setEstado] = useState<'activo' | 'sin_acceso' | null>(null);
  const [cargandoEstado, setCargandoEstado] = useState(Boolean(empresaId && empleadoId));

  useEffect(() => {
    let vigente = true;
    consultar.current().then((valor) => {
      if (!vigente) return;
      if (valor) setCorreo(valor); else setError('No se pudo cargar el correo. Vuelve a intentarlo.');
    }).catch(() => { if (vigente) setError('No se pudo cargar el correo. Vuelve a intentarlo.'); })
      .finally(() => { if (vigente) setCargando(false); });
    return () => { vigente = false; };
  }, []);

  useEffect(() => {
    if (!empresaId || !empleadoId) return;
    let vigente = true;
    estadoAcceso(empresaId, empleadoId).then((valor) => {
      if (!vigente) return;
      if (valor) setEstado(valor); else setError('No se pudo consultar el estado del acceso. Vuelve a intentarlo.');
    }).finally(() => { if (vigente) setCargandoEstado(false); });
    return () => { vigente = false; };
  }, [empresaId, empleadoId]);

  async function vincular() {
    if (guardando || !correo) return;
    setGuardando(true); setError('');
    try {
      const respuesta = await onVincular(correo);
      if (respuesta) setResultado(respuesta);
      else setError('No se pudo vincular. Verifica que el correo de la ficha no haya cambiado y que exista una cuenta confirmada sin vincular a otra persona.');
    } catch { setError('No se pudo vincular la cuenta. Revisa tu conexión e inténtalo nuevamente.'); }
    finally { setGuardando(false); }
  }

  return (
    <section className="relative overflow-hidden rounded-3xl border border-slate-200/90 bg-white p-5 shadow-soft sm:p-6">
      <div aria-hidden="true" className="pointer-events-none absolute -top-12 inset-x-0 mx-auto h-24 w-11/12 rounded-full blur-3xl bg-fuchsia-400/30" />
      <div className="relative">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-5">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-fuchsia-200 bg-fuchsia-50 text-fuchsia-600 shadow-soft">
            <ShieldCheck aria-hidden="true" className="h-5 w-5 stroke-[2.2]" />
          </span>
          <div>
            <h2 className="text-lg font-bold tracking-tight text-slate-900">
              {empresaId ? 'Gestionar acceso' : 'Vincular cuenta existente'}
            </h2>
            <p className="text-xs sm:text-sm font-medium text-slate-500">
              {empresaId ? 'Administra el acceso del colaborador a esta empresa.' : 'La cuenta de acceso debe estar creada y confirmada con el correo de esta ficha.'}
            </p>
          </div>
        </div>

        {cargando ? (
          <p role="status" className="mt-4 text-sm text-slate-600">Cargando correo…</p>
        ) : correo && (
          <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5 flex items-center gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-slate-200/80 bg-white text-cyan-600 shadow-xs">
              <Mail aria-hidden="true" className="h-4 w-4 stroke-[2.2]" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Correo del colaborador</p>
              <p className="mt-0.5 break-all text-sm font-bold text-slate-900">{correo}</p>
            </div>
          </div>
        )}

        {error && (
          <p role="alert" className="mt-4 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50/70 p-3 text-sm font-semibold text-rose-700">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </p>
        )}

        {resultado && (
          <p role="status" className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50/80 px-4 py-3 text-sm font-semibold text-[#007055]">
            {resultado === 'vinculada' ? 'Cuenta vinculada correctamente.' : 'Esta cuenta ya estaba vinculada.'}
          </p>
        )}

        {cargandoEstado && <p role="status" className="mt-4 text-sm text-slate-600">Consultando acceso…</p>}

        {empresaId && !rol && (
          <p role="alert" className="mt-4 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50/70 p-3 text-sm font-semibold text-rose-700">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
            <span>No se pudo verificar el rol de la ficha. Actualiza la página antes de gestionar el acceso.</span>
          </p>
        )}

        {correo && empresaId && empleadoId && estado && rol && (
          <GestionAccesoRRHH
            correo={correo}
            estado={estado}
            onVincular={onVincular}
            onCrear={(email, password) => crearAccesoRRHH(empresaId, empleadoId, email, password, rol)}
            onRevocar={() => revocarAcceso(empresaId, empleadoId)}
            onRestablecer={rol === 'admin' ? undefined : (email, password) => restablecerClaveRRHH(empresaId, empleadoId, email, password)}
            onOcupado={setOperacionActiva}
          />
        )}

        {rol === 'admin' && estado === 'activo' && (
          <p className="mt-4 rounded-2xl border border-slate-100 bg-slate-50/50 p-3.5 text-xs text-slate-600">
            Las cuentas de RR. HH. cambian su propia contraseña desde la aplicación.
          </p>
        )}

        <div className="mt-6 flex flex-wrap items-center gap-3">
          {!empresaId && correo && !resultado && (
            <button
              type="button"
              disabled={guardando}
              onClick={() => void vincular()}
              className="btn-pressable min-h-[44px] rounded-xl bg-[#57CCB7] px-5 text-sm font-bold text-slate-900 shadow-soft hover:bg-[#46bfa9] active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#57CCB7] disabled:opacity-60 transition-colors"
            >
              {guardando ? 'Vinculando…' : 'Vincular cuenta'}
            </button>
          )}
          <button
            type="button"
            disabled={guardando || operacionActiva}
            onClick={onVolver}
            className="btn-pressable min-h-[44px] rounded-xl border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700 hover:bg-slate-50 active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400 disabled:opacity-60 transition-colors"
          >
            Volver a la ficha
          </button>
        </div>
      </div>
    </section>
  );
}
