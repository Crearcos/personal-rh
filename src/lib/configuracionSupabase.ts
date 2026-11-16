export function validarConfiguracionSupabase(url: string | undefined, clave: string | undefined): { url: string; clave: string } {
  if (!url?.trim() || !clave?.trim()) throw new Error('Falta configurar la conexión a Supabase.');
  let direccion: URL;
  try { direccion = new URL(url); } catch { throw new Error('La dirección de Supabase no es válida.'); }
  const local = direccion.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(direccion.hostname);
  if (direccion.protocol !== 'https:' && !local) throw new Error('La conexión a Supabase debe usar HTTPS.');
  return { url: url.trim(), clave: clave.trim() };
}
