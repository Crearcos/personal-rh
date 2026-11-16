import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

export interface ReporteItem {
  nombre: string;
  cargo: string;
  departamento: string;
  diasDerecho: number | null;
  diasTomados: number | null;
  diasPendientes: number | null;
}

/**
 * Genera y descarga el reporte en formato Excel (.xlsx)
 */
export function exportVacationBalancesToExcel(
  items: readonly ReporteItem[],
  nombreEmpresa: string = 'PersonalHR'
): void {
  const data = items.map((i) => ({
    'Colaborador': i.nombre,
    'Cargo': i.cargo,
    'Departamento': i.departamento,
    'Días Asignados': i.diasDerecho,
    'Días Tomados': i.diasTomados,
    'Días Pendientes': i.diasPendientes,
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Saldos_Vacaciones');

  const fechaStr = new Date().toISOString().split('T')[0];
  XLSX.writeFile(workbook, `Reporte_Vacaciones_${nombreEmpresa}_${fechaStr}.xlsx`);
}

/**
 * Genera y descarga el reporte en formato PDF (.pdf)
 */
export function exportVacationBalancesToPdf(
  items: readonly ReporteItem[],
  nombreEmpresa: string = 'Comercial Demo Andes S.A.'
): void {
  const doc = new jsPDF();
  const fechaStr = new Date().toLocaleDateString('es-EC');

  // Encabezado
  doc.setFontSize(16);
  doc.setTextColor(79, 70, 229); // Brand color #4f46e5
  doc.text('PersonalHR - Reporte de Saldos de Vacaciones', 14, 18);

  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text(`Empresa: ${nombreEmpresa} | Fecha de Emisión: ${fechaStr}`, 14, 25);

  const tableData = items.map((i) => [
    i.nombre,
    i.cargo,
    i.departamento,
    i.diasDerecho?.toString() ?? 'Sin registro',
    i.diasTomados?.toString() ?? 'Sin registro',
    i.diasPendientes?.toString() ?? 'Sin registro',
  ]);

  autoTable(doc, {
    startY: 30,
    head: [['Colaborador', 'Cargo', 'Departamento', 'Derecho', 'Tomados', 'Saldo']],
    body: tableData,
    theme: 'striped',
    headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255] },
    styles: { font: 'helvetica', fontSize: 9 },
  });

  const fechaIso = new Date().toISOString().split('T')[0];
  doc.save(`Reporte_Vacaciones_${fechaIso}.pdf`);
}
