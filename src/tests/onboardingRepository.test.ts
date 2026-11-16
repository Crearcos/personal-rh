import { beforeEach, describe, expect, it, vi } from 'vitest';
import { guardarTareaOnboarding, eliminarTareaOnboarding } from '../services/onboardingRepository';

const db = vi.hoisted(() => ({ from: vi.fn(), eq: vi.fn(), select: vi.fn(), maybeSingle: vi.fn(), insert: vi.fn(), update: vi.fn(), delete: vi.fn(), single: vi.fn() }));
vi.mock('../lib/supabase', () => ({ supabase: { from: db.from } }));
const datos = { empleadoId: 'emp_1', tarea: 'Inducción', responsable: 'RRHH', fechaLimite: '2026-02-10' };

describe('guardar tarea de incorporación', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    db.from.mockReturnValue(db); db.select.mockReturnValue(db); db.eq.mockReturnValue(db);
    db.insert.mockReturnValue(db); db.update.mockReturnValue(db); db.delete.mockReturnValue(db);
    db.maybeSingle.mockResolvedValue({ data: { id: 'emp_1' }, error: null });
    db.single.mockResolvedValue({ data: { id: 't1' }, error: null });
  });
  it('rechaza entradas inválidas antes de consultar la base', async () => {
    expect((await guardarTareaOnboarding('empresa_a', { ...datos, tarea: '  ' })).success).toBe(false);
    expect(db.from).not.toHaveBeenCalled();
  });
  it('comprueba que el colaborador pertenece a la empresa antes de crear', async () => {
    db.maybeSingle.mockResolvedValue({ data: null, error: null });
    expect((await guardarTareaOnboarding('empresa_a', datos)).success).toBe(false);
    expect(db.eq).toHaveBeenCalledWith('empresa_id', 'empresa_a');
    expect(db.insert).not.toHaveBeenCalled();
  });
  it('crea una tarea pendiente para el colaborador de la empresa', async () => {
    expect((await guardarTareaOnboarding('empresa_a', datos)).success).toBe(true);
    expect(db.insert).toHaveBeenCalledWith(expect.objectContaining({ empresa_id: 'empresa_a', empleado_id: 'emp_1', estado: 'pendiente' }));
  });
  it('limita la edición a la empresa y al colaborador originales', async () => {
    expect((await guardarTareaOnboarding('empresa_a', { ...datos, id: 't1' })).success).toBe(true);
    expect(db.eq).toHaveBeenCalledWith('empresa_id', 'empresa_a');
    expect(db.eq).toHaveBeenCalledWith('empleado_id', 'emp_1');
    expect(db.eq).toHaveBeenCalledWith('id', 't1');
  });
  it('limita la eliminación a la empresa, colaborador y tarea indicados', async () => {
    expect((await eliminarTareaOnboarding('empresa_a', 'emp_1', 't1')).success).toBe(true);
    expect(db.eq).toHaveBeenCalledWith('empresa_id', 'empresa_a');
    expect(db.eq).toHaveBeenCalledWith('empleado_id', 'emp_1');
    expect(db.eq).toHaveBeenCalledWith('id', 't1');
  });
});
