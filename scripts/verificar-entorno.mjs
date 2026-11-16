import { pathToFileURL } from 'node:url';
import { loadEnv } from 'vite';

function esClavePrivilegiada(clave) {
  if (clave.startsWith('sb_secret_')) return true;
  try {
    const cuerpo = JSON.parse(Buffer.from(clave.split('.')[1], 'base64url').toString('utf8'));
    return cuerpo.role === 'service_role' || cuerpo.role === 'supabase_admin';
  } catch { return false; }
}

export function validarEntornoBuild(entorno) {
  const url = entorno.VITE_SUPABASE_URL?.trim();
  const clave = entorno.VITE_SUPABASE_ANON_KEY?.trim();
  if (!url || !clave) throw new Error('Configura VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY antes de compilar.');
  let direccion;
  try { direccion = new URL(url); } catch { throw new Error('La dirección de Supabase no es válida.'); }
  if (direccion.protocol !== 'https:') throw new Error('La compilación requiere una conexión HTTPS a Supabase.');
  if (esClavePrivilegiada(clave)) throw new Error('La aplicación pública no debe contener una clave privilegiada de Supabase.');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try { validarEntornoBuild(loadEnv('production', process.cwd(), 'VITE_')); }
  catch (error) { console.error(error.message); process.exitCode = 1; }
}
