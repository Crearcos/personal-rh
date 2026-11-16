const clave = 'personalhr-cierre-pendiente';

export function existeCierrePendiente(): boolean {
  try { return localStorage.getItem(clave) === '1'; } catch { return false; }
}

export function guardarCierrePendiente(pendiente: boolean): void {
  try {
    if (pendiente) localStorage.setItem(clave, '1');
    else localStorage.removeItem(clave);
  } catch { /* El estado de la pantalla sigue protegido durante esta visita. */ }
}
