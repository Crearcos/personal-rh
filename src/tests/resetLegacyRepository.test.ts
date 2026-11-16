import { describe, expect, it, vi } from 'vitest';
import { triggerResetDemoData } from '../services/repository';
const { rpc } = vi.hoisted(() => ({ rpc: vi.fn() }));
vi.mock('../lib/supabase', () => ({ supabase: { rpc } }));

describe('restablecimiento antiguo', () => {
  it('no permite que el cliente invoque la operación global', async () => {
    const resultado = await triggerResetDemoData();
    expect(resultado.success).toBe(false);
    expect(rpc).not.toHaveBeenCalled();
  });
});
