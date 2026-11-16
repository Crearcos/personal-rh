// @vitest-environment node
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('configuración de Vercel', () => {
  it('protege las respuestas y permite las conexiones necesarias para la aplicación', () => {
    const config = JSON.parse(readFileSync('vercel.json', 'utf8'));
    const global = config.headers.find((item: { source: string }) => item.source === '/(.*)');
    const headers = Object.fromEntries(global.headers.map(({ key, value }: { key: string; value: string }) => [key.toLowerCase(), value])) as Record<string, string>;
    expect(headers['x-content-type-options']).toBe('nosniff');
    expect(headers['x-frame-options']).toBe('DENY');
    expect(headers['strict-transport-security']).toContain('max-age=');
    expect(headers['content-security-policy']).toContain("frame-ancestors 'none'");
    expect(headers['content-security-policy']).toContain('https://*.supabase.co');
    expect(headers['content-security-policy']).toContain('https://fonts.googleapis.com');
  });
});
