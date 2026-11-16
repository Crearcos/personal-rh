import { describe, expect, it } from 'vitest';
import { validarConfiguracionSupabase } from '../lib/configuracionSupabase';

describe('configuración de Supabase', () => {
  it('acepta una URL segura y una clave pública definidas explícitamente', () => {
    expect(validarConfiguracionSupabase('https://ejemplo.supabase.co', 'clave-publica'))
      .toEqual({ url: 'https://ejemplo.supabase.co', clave: 'clave-publica' });
  });
  it('rechaza configuración ausente o una conexión insegura', () => {
    expect(() => validarConfiguracionSupabase('', 'clave')).toThrow();
    expect(() => validarConfiguracionSupabase('https://ejemplo.supabase.co', '')).toThrow();
    expect(() => validarConfiguracionSupabase('http://servidor.example', 'clave')).toThrow();
    expect(() => validarConfiguracionSupabase('no-es-una-url', 'clave')).toThrow();
  });
  it('permite HTTP únicamente para Supabase local de desarrollo', () => {
    expect(validarConfiguracionSupabase('http://127.0.0.1:54321', 'clave').url).toBe('http://127.0.0.1:54321');
  });
});
