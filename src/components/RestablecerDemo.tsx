import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { consultarRestablecimiento, ejecutarRestablecimiento, obtenerActorRestablecimiento, type OperacionRestablecimiento, type VistaRestablecimiento } from '../services/restablecerDemoRepository';

interface Props { empresaId: string; nombreEmpresa: string; onCerrar: () => void; onCompletado: () => void }
const control = 'min-h-11 rounded-xl px-4 text-sm font-semibold active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#57CCB7] disabled:opacity-50';
const etiquetas: Record<string, string> = {
  empleados: 'Colaboradores', usuarios: 'Perfiles de colaborador', departamentos: 'Departamentos',
  solicitudes: 'Solicitudes', tipos_solicitud: 'Tipos de solicitud', saldos_vacaciones: 'Saldos',
  evaluaciones: 'Evaluaciones', respuestas_evaluacion: 'Respuestas de evaluación',
  criterios_evaluacion: 'Criterios de evaluación', periodos_evaluacion: 'Periodos de evaluación',
  onboarding_tareas: 'Tareas de incorporación',
};
const clave = (empresa: string, actor: string) => `personalhr:restablecimiento:${empresa}:${actor}`;

function leerPendiente(empresa: string, actor: string): OperacionRestablecimiento | null {
  try {
    const valor: unknown = JSON.parse(sessionStorage.getItem(clave(empresa, actor)) || 'null');
    if (!valor || typeof valor !== 'object') return null;
    const dato = valor as Partial<OperacionRestablecimiento>;
    return dato.empresa === empresa && typeof dato.huella === 'string' && /^[a-f0-9]{32}$/.test(dato.huella)
      && typeof dato.operacion === 'string' && /^[a-f0-9-]{36}$/.test(dato.operacion) ? dato as OperacionRestablecimiento : null;
  } catch { return null; }
}

function identificador(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40; bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const h = Array.from(bytes, (n) => n.toString(16).padStart(2, '0')).join('');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

function mantenerFoco(evento: KeyboardEvent<HTMLDivElement>) {
  if (evento.key !== 'Tab') return;
  const controles = Array.from(evento.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), [tabindex="0"]'));
  if (!controles.length) return;
  if (!controles.includes(document.activeElement as HTMLElement)) {
    evento.preventDefault(); (evento.shiftKey ? controles[controles.length - 1] : controles[0]).focus(); return;
  }
  if (evento.shiftKey && document.activeElement === controles[0]) { evento.preventDefault(); controles[controles.length - 1].focus(); }
  if (!evento.shiftKey && document.activeElement === controles[controles.length - 1]) { evento.preventDefault(); controles[0].focus(); }
}

export function RestablecerDemo({ empresaId, nombreEmpresa, onCerrar, onCompletado }: Props) {
  const [actor, setActor] = useState('');
  const [pendiente, setPendiente] = useState<OperacionRestablecimiento | null>(null);
  const [vista, setVista] = useState<VistaRestablecimiento | null>(null);
  const [cargando, setCargando] = useState(true);
  const [ocupado, setOcupado] = useState(false);
  const [confirmacion, setConfirmacion] = useState('');
  const [error, setError] = useState('');
  const [completado, setCompletado] = useState(false);
  const titulo = useRef<HTMLHeadingElement>(null);

  useEffect(() => { titulo.current?.focus(); }, []);
  useEffect(() => {
    let vigente = true;
    void obtenerActorRestablecimiento().then((id) => {
      if (!vigente) return;
      if (!id) { setCargando(false); setError('No pudimos verificar tu sesión. Vuelve a ingresar e inténtalo de nuevo.'); return; }
      const anterior = leerPendiente(empresaId, id);
      setPendiente(anterior); setActor(id);
      if (anterior) setCargando(false);
    });
    return () => { vigente = false; };
  }, [empresaId]);
  useEffect(() => {
    if (!actor || pendiente || completado) return;
    let vigente = true;
    setCargando(true);
    void consultarRestablecimiento(empresaId).then((r) => {
      if (!vigente) return;
      setVista(r.data || null); setCargando(false);
      if (!r.success) setError('No pudimos cargar la vista previa. Comprueba tu conexión e inténtalo nuevamente.');
    });
    return () => { vigente = false; };
  }, [actor, empresaId, pendiente, completado]);

  async function ejecutar(datos: OperacionRestablecimiento) {
    setOcupado(true); setError('');
    const resultado = await ejecutarRestablecimiento(datos);
    setOcupado(false);
    if (resultado === 'sin_confirmar') { setPendiente(datos); setError('No pudimos confirmar el resultado. Verifícalo para consultar o completar la misma operación.'); return; }
    try { sessionStorage.removeItem(clave(empresaId, actor)); } catch { /* La operación ya terminó. */ }
    setPendiente(null);
    if (resultado === 'rechazado') { setVista(null); setError('Los datos cambiaron o existe un conflicto. Cierra esta ventana y revisa de nuevo.'); return; }
    setCompletado(true); onCompletado();
  }

  function confirmar() {
    if (!vista || vista.bloqueos.length || confirmacion !== 'RESTABLECER' || ocupado) return;
    const datos = { empresa: empresaId, huella: vista.huella, operacion: identificador() };
    try { sessionStorage.setItem(clave(empresaId, actor), JSON.stringify(datos)); }
    catch { setError('No se puede guardar la operación de forma segura en este navegador.'); return; }
    setPendiente(datos); void ejecutar(datos);
  }

  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4" role="presentation">
    <div role="dialog" aria-modal="true" aria-labelledby="titulo-restablecer-demo" onKeyDown={mantenerFoco} className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-5 shadow-xl sm:p-7">
      <h2 ref={titulo} tabIndex={-1} id="titulo-restablecer-demo" className="text-xl font-bold tracking-tight text-slate-900 focus:outline-none">Restablecer demo</h2>
      <p className="mt-2 text-sm text-slate-700">Empresa seleccionada: <strong>{nombreEmpresa}</strong></p>
      {cargando && <p role="status" className="mt-5 text-sm text-slate-700">Preparando vista previa…</p>}
      {completado && <p role="status" className="mt-5 text-sm font-semibold text-[#007055]">La demo se restableció correctamente.</p>}
      {!pendiente && vista && !completado && <>
        <p className="mt-5 text-sm text-slate-700">Los cambios de esta empresa se reemplazarán por el escenario inicial. Se conservarán los accesos y el registro de actividad.</p>
        <p className="mt-4 text-sm font-semibold text-slate-900">Datos actuales de la empresa</p>
        <p className="mt-1 text-sm text-slate-700">Se reemplazarán o actualizarán los siguientes registros:</p>
        <dl className="mt-4 divide-y divide-slate-200 border-y border-slate-200">
          {Object.entries(etiquetas).map(([id, etiqueta]) => <div key={id} className="flex justify-between gap-4 py-2 text-sm"><dt className="text-slate-700">{etiqueta}</dt><dd className="font-semibold tabular-nums text-slate-900">{vista.totales[id] ?? 0}</dd></div>)}
        </dl>
        {vista.bloqueos.length > 0 ? <div role="alert" className="mt-4 space-y-2 text-sm font-semibold text-rose-800">
          {vista.bloqueos.some((bloqueo) => bloqueo.codigo === 'FIN_ANIO_SALDOS') && <p>El restablecimiento está pausado por el cambio de año para proteger los saldos. Vuelve a intentarlo a partir de enero.</p>}
          {vista.bloqueos.some((bloqueo) => bloqueo.codigo !== 'FIN_ANIO_SALDOS') && <p>Hay cuentas vinculadas o datos que requieren revisión antes de restablecer. Contacta al administrador técnico.</p>}
        </div> :
          <label className="mt-5 block text-sm font-semibold text-slate-800">Para confirmar, escribe RESTABLECER
            <input autoComplete="off" spellCheck={false} value={confirmacion} onChange={(e) => setConfirmacion(e.target.value)} className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 px-3 text-base text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#57CCB7]" />
          </label>}
      </>}
      {pendiente && <p className="mt-5 text-sm text-slate-700">Hay una operación anterior sin confirmar. Al verificar, se consultará o completará esa misma operación.</p>}
      {error && <p role="alert" className="mt-4 text-sm text-rose-800">{error}</p>}
      <div className="mt-6 flex flex-wrap justify-end gap-3">
        <button type="button" disabled={ocupado} onClick={onCerrar} className={`${control} border border-slate-300 text-slate-800 hover:bg-slate-50`}>{completado ? 'Cerrar' : 'Volver'}</button>
        {pendiente && <button type="button" disabled={ocupado} onClick={() => { void ejecutar(pendiente); }} className={`${control} bg-slate-900 text-white hover:bg-slate-800`}>{ocupado ? 'Verificando…' : 'Verificar resultado'}</button>}
        {!pendiente && vista && !completado && !vista.bloqueos.length && <button type="button" disabled={ocupado || confirmacion !== 'RESTABLECER'} onClick={confirmar} className={`${control} bg-rose-700 text-white hover:bg-rose-800`}>Confirmar restablecimiento</button>}
      </div>
    </div>
  </div>;
}
