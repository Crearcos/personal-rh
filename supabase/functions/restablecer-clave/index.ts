import { createClient } from 'npm:@supabase/supabase-js@2.49.1';
import { restablecerClave, type Dependencias } from './logic.ts';

const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS' };
const respuesta = (status: number, resultado: string) => new Response(JSON.stringify({ resultado }), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

Deno.serve(async (request: Request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (request.method !== 'POST') return respuesta(405, 'metodo_invalido');
  const url = Deno.env.get('SUPABASE_URL');
  const anon = Deno.env.get('SUPABASE_ANON_KEY');
  const secret = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const authorization = request.headers.get('Authorization');
  if (!url || !anon || !secret || !authorization?.startsWith('Bearer ')) return respuesta(401, 'no_autenticado');
  const caller = createClient(url, anon, { auth: { persistSession: false, autoRefreshToken: false } });
  const admin = createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } });
  try {
    const { data: { user }, error } = await caller.auth.getUser(authorization.slice(7));
    if (error || !user || user.is_anonymous) return respuesta(401, 'no_autenticado');
    const operacion = crypto.randomUUID();
    const d: Dependencias = {
      async reservar(empresa, empleado, correo) {
        const { data, error: fallo } = await admin.rpc('preparar_clave_rrhh', { p_actor: user.id, p_empresa: empresa, p_empleado: empleado, p_correo: correo, p_operacion: operacion });
        if (!fallo && typeof data === 'string') return { estado: 'reservada', cuenta: data };
        return fallo && ['42501', '55P03', '22023', '23505'].includes(fallo.code) ? { estado: 'denegada' } : { estado: 'sin_confirmar' };
      },
      async actualizar(cuenta, password) {
        const { data, error: fallo } = await admin.auth.admin.updateUserById(cuenta, { password });
        if (!fallo && data.user?.id === cuenta) return 'actualizada';
        return fallo?.code && ['same_password', 'weak_password'].includes(fallo.code) ? 'rechazada' : 'sin_confirmar';
      },
      async finalizar(exitosa) {
        const { data, error: fallo } = await admin.rpc('finalizar_clave_rrhh', { p_operacion: operacion, p_actor: user.id, p_exitosa: exitosa });
        return !fallo && data === true;
      },
    };
    return respuesta(200, await restablecerClave(await request.json(), d));
  } catch { return respuesta(500, 'error'); }
});
