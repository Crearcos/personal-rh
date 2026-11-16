import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

export type CeldaReporte = string | number;

export function crearLibroReporte(nombre: string, columnas: string[], filas: CeldaReporte[][], empresa?: string, periodo?: string): XLSX.WorkBook {
  const metadatos = empresa && periodo ? [['Empresa', empresa], ['Período', periodo], []] : [];
  const hoja = XLSX.utils.aoa_to_sheet([...metadatos, columnas, ...filas]);
  hoja['!cols'] = columnas.map(() => ({ wch: 24 }));
  const libro = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(libro, hoja, nombre.slice(0, 31));
  return libro;
}

export function crearPdfReporte(titulo: string, empresa: string, periodo: string, columnas: string[], filas: CeldaReporte[][]): jsPDF {
  const doc = new jsPDF({ orientation: 'landscape' });
  doc.setFontSize(16); doc.setTextColor(0, 82, 102); doc.text(`PersonalHR - ${titulo}`, 14, 18);
  doc.setFontSize(10); doc.setTextColor(71, 85, 105);
  const subtitulo = doc.splitTextToSize(`Empresa: ${empresa} | ${periodo}`, 260) as string[];
  doc.text(subtitulo, 14, 25);
  autoTable(doc, { startY: 30 + subtitulo.length * 5, head: [columnas], body: filas, theme: 'striped', headStyles: { fillColor: [0, 82, 102], textColor: [255, 255, 255] }, styles: { font: 'helvetica', fontSize: 8, overflow: 'linebreak' } });
  return doc;
}

export function descargarReporte(formato: 'pdf' | 'excel', titulo: string, empresa: string, periodo: string, columnas: string[], filas: CeldaReporte[][]): void {
  const archivo = titulo.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9]+/g, '_');
  const fecha = new Date().toISOString().slice(0, 10);
  if (formato === 'pdf') { crearPdfReporte(titulo, empresa, periodo, columnas, filas).save(`${archivo}_${fecha}.pdf`); return; }
  XLSX.writeFile(crearLibroReporte(titulo, columnas, filas, empresa, periodo), `${archivo}_${fecha}.xlsx`);
}
