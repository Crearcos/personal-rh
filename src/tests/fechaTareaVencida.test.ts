import { describe, expect, it } from 'vitest';
import { tareaVencida } from '../services/fechaTareaVencida';

describe('fecha de vencimiento de tareas', () => {
  it('compara días de calendario de Ecuador sin vencer la tarea durante su fecha límite', () => {
    const nocheAnterior = new Date('2026-11-14T02:30:00Z');
    expect(tareaVencida('2026-11-12', nocheAnterior)).toBe(true);
    expect(tareaVencida('2026-11-13', nocheAnterior)).toBe(false);
    expect(tareaVencida('2026-11-14', nocheAnterior)).toBe(false);
  });
  it('usa la fecha actual y trata fechas ausentes como no vencidas', () => {
    expect(tareaVencida('2026-11-13', new Date('2026-11-14T05:01:00Z'))).toBe(true);
    expect(tareaVencida(undefined, new Date('2026-11-14T05:01:00Z'))).toBe(false);
    expect(tareaVencida('fecha inválida', new Date('2026-11-14T05:01:00Z'))).toBe(false);
  });
});
