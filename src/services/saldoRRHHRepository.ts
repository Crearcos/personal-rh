import { supabase } from '../lib/supabase';
import type { ApiResponse, SaldoVacaciones } from '../types/models';
import { validarSaldoRRHH } from './gestionRRHHValidation';

export async function ajustarSaldoRRHH(empresaId: string, saldo: SaldoVacaciones, diasDerecho: number): Promise<ApiResponse<SaldoVacaciones>> {
  const valido = validarSaldoRRHH({ anio: saldo.anio, diasDerecho, diasTomados: Number(saldo.dias_tomados) });
  if (!empresaId || empresaId !== saldo.empresa_id || !valido.success) return { success: false, error: 'Revisa los datos del saldo.' };
  try {
    const { data, error } = await supabase.rpc('ajustar_saldo_vacaciones', {
      p_empresa_id: empresaId, p_empleado_id: saldo.empleado_id, p_saldo_id: saldo.id,
      p_anio: saldo.anio, p_dias_derecho: diasDerecho,
    }).single();
    if (error || !data) return { success: false, error: 'No se pudo guardar el saldo.' };
    return { success: true, data };
  } catch {
    return { success: false, error: 'No se pudo guardar el saldo.' };
  }
}

export async function acreditarSaldoRRHH(empresaId: string, saldo: SaldoVacaciones, dias: number, motivo: string, operacion: string): Promise<ApiResponse<SaldoVacaciones>> {
  const texto = motivo.trim();
  if (!empresaId || empresaId !== saldo.empresa_id || !Number.isFinite(dias) || dias <= 0 || dias > 366 || Math.abs(Math.round(dias * 100) - dias * 100) > 1e-8 || texto.length < 3 || texto.length > 200 || !operacion) return { success: false, error: 'Revisa los datos del crédito.' };
  try {
    const { data, error } = await supabase.rpc('acreditar_saldo_vacaciones', {
      p_empresa_id: empresaId, p_empleado_id: saldo.empleado_id, p_saldo_id: saldo.id,
      p_anio: saldo.anio, p_dias: dias, p_motivo: texto, p_operacion: operacion,
    }).single();
    return !error && data ? { success: true, data } : { success: false, error: 'No se pudo acreditar el saldo.' };
  } catch { return { success: false, error: 'No se pudo acreditar el saldo.' }; }
}
