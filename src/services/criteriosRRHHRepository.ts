import { supabase } from '../lib/supabase';
import type { ApiResponse, CriterioConfig, CriterioEvaluacion } from '../types/models';

export async function guardarCriteriosRRHH(empresaId: string, entrada: CriterioConfig[]): Promise<ApiResponse<CriterioEvaluacion[]>> {
  const datos = entrada.map((item) => ({ nombre: item.nombre.trim(), peso: item.peso }));
  const nombres = datos.map((item) => item.nombre.toLocaleLowerCase('es'));
  const pesoTotal = datos.reduce((total, item) => total + Math.round(item.peso * 10000), 0);
  if (!empresaId.trim() || !datos.length || datos.length > 20 || new Set(nombres).size !== nombres.length || pesoTotal !== 10000 ||
      datos.some((item) => !item.nombre || item.nombre.length > 100 || !Number.isFinite(item.peso) || item.peso <= 0 || item.peso > 1 || Math.abs(Math.round(item.peso * 10000) - item.peso * 10000) > 1e-8)) {
    return { success: false, error: 'Revisa los criterios y sus pesos.' };
  }
  try {
    const { data, error } = await supabase.rpc('configurar_criterios_rrhh', { p_empresa_id: empresaId, p_criterios: datos });
    if (error || !data?.length) return { success: false, error: 'No se pudieron guardar los criterios.' };
    return { success: true, data };
  } catch { return { success: false, error: 'No se pudieron guardar los criterios.' }; }
}
