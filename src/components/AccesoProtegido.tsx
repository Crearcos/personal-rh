import React, { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { iniciarSesion, cerrarSesion } from '../services/accesoCuenta';
import { consultarAccesosAutorizados, type AccesoAutorizado } from '../services/accesoDemo';
import { AccesoRRHH } from './AccesoRRHH';
import { CierreSesionPendiente } from './CierreSesionPendiente';
import { PantallaCarga } from './PantallaCarga';
import { existeCierrePendiente, guardarCierrePendiente } from '../services/cierrePendiente';

interface Props {
  children: (acceso: { empresas: string[]; accesos: AccesoAutorizado[]; salir: () => Promise<void> }) => React.ReactNode;
}

export function AccesoProtegido({ children }: Props) {
  const [accesos, setAccesos] = useState<AccesoAutorizado[]>([]);
  const [cargando, setCargando] = useState(true);
  const revision = useRef(0);
  const ingresando = useRef(false);
  const bloqueoCierre = useRef(existeCierrePendiente());
  const cierreEnCurso = useRef(false);
  const [estadoCierre, setEstadoCierre] = useState<'inactivo' | 'cerrando' | 'error'>(
    () => existeCierrePendiente() ? 'error' : 'inactivo',
  );

  useEffect(() => {
    let vigente = true;
    const comprobar = () => {
      if (ingresando.current || bloqueoCierre.current) return;
      const actual = ++revision.current;
      void consultarAccesosAutorizados().catch(() => []).then((resultado) => {
        if (vigente && actual === revision.current) { setAccesos(resultado); setCargando(false); }
      });
    };
    const alMostrar = () => { if (document.visibilityState === 'visible') comprobar(); };
    comprobar();
    window.addEventListener('focus', comprobar);
    document.addEventListener('visibilitychange', alMostrar);
    let temporizador: ReturnType<typeof setTimeout> | undefined;
    const { data } = supabase.auth.onAuthStateChange((evento) => {
      if (evento === 'SIGNED_OUT' && vigente) {
        revision.current++;
        clearTimeout(temporizador);
        setAccesos([]);
        setCargando(false);
        if (!cierreEnCurso.current) {
          bloqueoCierre.current = false;
          guardarCierrePendiente(false);
          setEstadoCierre('inactivo');
        }
      }
      if (evento === 'TOKEN_REFRESHED') {
        clearTimeout(temporizador);
        temporizador = setTimeout(comprobar, 0);
      }
    });
    return () => {
      vigente = false;
      revision.current++;
      clearTimeout(temporizador);
      window.removeEventListener('focus', comprobar);
      document.removeEventListener('visibilitychange', alMostrar);
      data.subscription.unsubscribe();
    };
  }, []);

  async function ingresar(correo: string, contrasena: string): Promise<boolean> {
    if (ingresando.current) return false;
    ingresando.current = true;
    try {
      if (!await iniciarSesion(correo, contrasena)) return false;
      const actual = ++revision.current;
      const resultado = await consultarAccesosAutorizados();
      if (actual !== revision.current) return false;
      if (resultado.length > 0) { setAccesos(resultado); return true; }
      await cerrarSesion();
      return false;
    } catch {
      await cerrarSesion();
      return false;
    } finally {
      ingresando.current = false;
    }
  }

  async function salir(): Promise<void> {
    if (cierreEnCurso.current) return;
    cierreEnCurso.current = true;
    bloqueoCierre.current = true;
    guardarCierrePendiente(true);
    revision.current++;
    setAccesos([]);
    setEstadoCierre('cerrando');
    const cerrado = await cerrarSesion();
    cierreEnCurso.current = false;
    if (!cerrado) { setEstadoCierre('error'); return; }
    bloqueoCierre.current = false;
    guardarCierrePendiente(false);
    setCargando(false);
    setEstadoCierre('inactivo');
  }

  if (estadoCierre !== 'inactivo') return <CierreSesionPendiente cerrando={estadoCierre === 'cerrando'} reintentar={() => void salir()} />;
  if (cargando) return <PantallaCarga />;
  if (!accesos.length) return <AccesoRRHH onIngresar={ingresar} />;
  const identidad = JSON.stringify(accesos.map(({ empresa_id, rol, empleado_id }) => [empresa_id, rol, empleado_id]).sort());
  return <React.Fragment key={identidad}>{children({ empresas: [...new Set(accesos.map((acceso) => acceso.empresa_id))], accesos, salir })}</React.Fragment>;
}
