import { createClient } from 'npm:@supabase/supabase-js@2.49.1';
import { crearAcceso, type Dependencias } from './logic.ts';

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
  const caller = createClient(url, anon, { global: { headers: { Authorization: authorization } }, auth: { persistSession: false, autoRefreshToken: false } });
  const admin = createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } });
  try {
    const { data: { user }, error: userError } = await caller.auth.getUser(authorization.slice(7));
    if (userError || !user || user.is_anonymous) return respuesta(401, 'no_autenticado');
    const d: Dependencias = {
      async verificarAdministrador(empresa) {
        const { data, error } = await caller.from('accesos_empresa').select('rol').eq('auth_user_id', user.id).eq('empresa_id', empresa).eq('rol', 'admin').maybeSingle();
        return !error && Boolean(data);
      },
      async consultarFicha(empresa, empleado) {
        const { data: e, error } = await caller.from('empleados').select('usuario_id,activo').eq('empresa_id', empresa).eq('id', empleado).maybeSingle();
        if (error || !e?.activo) return null;
        const { data: u, error: errorUsuario } = await caller.from('usuarios').select('correo,rol,activo').eq('empresa_id', empresa).eq('id', e.usuario_id).maybeSingle();
        return !errorUsuario && u ? u : null;
      },
      async crearUsuario(correo, password) {
        const { data, error } = await admin.auth.admin.createUser({ email: correo, password, email_confirm: true });
        return !error && Boolean(data.user);
      },
      async vincular(empresa, empleado, correo, rol) {
        const { data, error } = await caller.rpc('vincular_cuenta_con_rol', { p_empresa: empresa, p_empleado: empleado, p_correo_esperado: correo, p_rol_esperado: rol });
        return !error && (data === 'vinculada' || data === 'existente');
      },
    };
    const resultado = await crearAcceso(await request.json(), d);
    return respuesta(resultado === 'prohibida' ? 403 : 200, resultado);
  } catch { return respuesta(500, 'error'); }
});
