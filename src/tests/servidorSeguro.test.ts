// @vitest-environment node
import { describe, expect, it } from 'vitest';
import configuracion from '../../vite.config';

describe('servidor de la demo', () => {
  it('permite acceso por red sin aceptar todos los nombres de host', () => {
    expect(configuracion.server?.host).toBe('0.0.0.0');
    expect(configuracion.preview?.host).toBe('0.0.0.0');
    expect(configuracion.server?.allowedHosts).not.toBe(true);
    expect(configuracion.preview?.allowedHosts).not.toBe(true);
  });
});
