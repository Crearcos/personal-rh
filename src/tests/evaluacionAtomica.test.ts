import { describe, expect, it, vi } from 'vitest';
import { insertEvaluacion } from '../services/repository';
import type { Evaluacion } from '../types/models';

const { rpc, single } = vi.hoisted(() => ({ rpc: vi.fn(), single: vi.fn() }));
vi.mock('../lib/supabase', () => ({ supabase: { rpc } }));

describe('registro de evaluación', () => {
  it('guarda evaluación y respuestas mediante una sola operación', async () => {
    rpc.mockReturnValue({ single });
    single.mockResolvedValue({ data: { id: 'ev1', puntaje_total: 85 }, error: null });
    const evaluacion = { id: 'ev1', empresa_id: 'a', empleado_id: 'e1', evaluador_id: 'j1', periodo: '2026-Q1', puntaje_total: 85, estado: 'cerrada', comentarios: 'Bien' } as Omit<Evaluacion, 'created_at'>;
    const respuestas = [{ criterio_id: 'c1', puntaje: 85, comentario: 'Bien' }];
    const resultado = await insertEvaluacion(evaluacion, respuestas);
    expect(resultado.success).toBe(true);
    expect(rpc).toHaveBeenCalledWith('crear_evaluacion_rrhh', { p_id: 'ev1', p_empresa_id: 'a', p_empleado_id: 'e1', p_evaluador_id: 'j1', p_periodo: '2026-Q1', p_comentarios: 'Bien', p_respuestas: respuestas });
  });
});
