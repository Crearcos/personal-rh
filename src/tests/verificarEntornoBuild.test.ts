// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { validarEntornoBuild } from '../../scripts/verificar-entorno.mjs';

const valido = { VITE_SUPABASE_URL: 'https://ejemplo.supabase.co', VITE_SUPABASE_ANON_KEY: 'sb_publishable_prueba' };
const jwt = (rol: string) => `e30.${Buffer.from(JSON.stringify({ role: rol })).toString('base64url')}.firma`;

describe('variables para compilar', () => {
  it('acepta la clave pública de Supabase', () => {
    expect(() => validarEntornoBuild(valido)).not.toThrow();
    expect(() => validarEntornoBuild({ ...valido, VITE_SUPABASE_ANON_KEY: jwt('anon') })).not.toThrow();
  });
  it('impide compilar sin configuración o con una clave privilegiada', () => {
    expect(() => validarEntornoBuild({ ...valido, VITE_SUPABASE_URL: '' })).toThrow();
    expect(() => validarEntornoBuild({ ...valido, VITE_SUPABASE_URL: 'http://ejemplo.supabase.co' })).toThrow();
    expect(() => validarEntornoBuild({ ...valido, VITE_SUPABASE_ANON_KEY: '' })).toThrow();
    expect(() => validarEntornoBuild({ ...valido, VITE_SUPABASE_ANON_KEY: 'sb_secret_prueba' })).toThrow();
    expect(() => validarEntornoBuild({ ...valido, VITE_SUPABASE_ANON_KEY: jwt('service_role') })).toThrow();
  });
});
