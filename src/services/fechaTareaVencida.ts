const fechaEcuador = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Guayaquil', year: 'numeric', month: '2-digit', day: '2-digit',
});

export function tareaVencida(fechaLimite?: string, ahora = new Date()): boolean {
  if (!fechaLimite || !/^\d{4}-\d{2}-\d{2}$/.test(fechaLimite) || Number.isNaN(ahora.getTime())) return false;
  const partes = fechaEcuador.formatToParts(ahora);
  const parte = (tipo: Intl.DateTimeFormatPartTypes) => partes.find((item) => item.type === tipo)?.value ?? '';
  const hoy = `${parte('year')}-${parte('month')}-${parte('day')}`;
  return fechaLimite < hoy;
}
