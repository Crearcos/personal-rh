import { describe, expect, it } from 'vitest';
import * as XLSX from 'xlsx';
import { crearLibroReporte, crearPdfReporte } from '../services/exportacionReportesRRHH';

describe('archivos de reportes', () => {
  const columnas = ['Colaborador', 'Motivo', 'Días'];
  const filas = [['Ana Torres', 'Descanso', 4]];
  it('genera un Excel legible con encabezados y valores', () => {
    const libro = crearLibroReporte('Ausencias', columnas, filas);
    const datos = XLSX.write(libro, { type: 'array', bookType: 'xlsx' });
    const lectura = XLSX.read(datos, { type: 'array' });
    expect(XLSX.utils.sheet_to_json(lectura.Sheets.Ausencias, { header: 1 })).toEqual([columnas, ...filas]);
  });
  it('genera un documento PDF', () => {
    const pdf = crearPdfReporte('Ausencias', 'Empresa demo', '01/03/2026 al 31/03/2026', columnas, filas);
    expect(pdf.output().startsWith('%PDF-')).toBe(true);
    expect(pdf.output()).toContain('Empresa demo');
    expect(pdf.output()).toContain('Ana Torres');
    expect(pdf.output()).toContain('Descanso');
  });
  it('conserva texto que empieza por igual como texto, no como fórmula', () => {
    const libro = crearLibroReporte('Ausencias', columnas, [['Ana', '=1+1', 4]]);
    expect(libro.Sheets.Ausencias.B2.t).toBe('s');
    expect(libro.Sheets.Ausencias.B2.f).toBeUndefined();
  });
  it('incluye empresa y período en el Excel exportado', () => {
    const libro = crearLibroReporte('Ausencias', columnas, filas, 'Empresa demo', '01/03/2026 al 31/03/2026');
    const filasLeidas = XLSX.utils.sheet_to_json(libro.Sheets.Ausencias, { header: 1 });
    expect(filasLeidas).toContainEqual(['Empresa', 'Empresa demo']);
    expect(filasLeidas).toContainEqual(['Período', '01/03/2026 al 31/03/2026']);
  });
});
