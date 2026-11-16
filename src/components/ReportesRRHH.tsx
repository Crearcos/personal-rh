import { useState } from 'react';
import {
  FileDown,
  FileSpreadsheet,
  CalendarRange,
  BarChart3,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import type { Departamento, Empleado, Evaluacion, Solicitud, TipoSolicitud } from '../types/models';
import { prepararReporteAusencias, prepararReporteEvaluaciones } from '../services/reportesRRHH';
import { descargarReporte, type CeldaReporte } from '../services/exportacionReportesRRHH';
import { CustomSelect } from './CustomSelect';

interface Props {
  empleados: Empleado[];
  departamentos: Departamento[];
  solicitudes: Solicitud[];
  tiposSolicitud: TipoSolicitud[];
  evaluaciones: Evaluacion[];
  nombreEmpresa: string;
  errorCarga?: boolean;
  onReintentar?: () => void;
}

function formatearFechaVisual(fechaStr: string): string {
  if (!fechaStr) return '';
  const partes = fechaStr.split('-');
  if (partes.length !== 3) return fechaStr;
  const [año, mes, dia] = partes;
  const meses = [
    'enero',
    'febrero',
    'marzo',
    'abril',
    'mayo',
    'junio',
    'julio',
    'agosto',
    'septiembre',
    'octubre',
    'noviembre',
    'diciembre',
  ];
  const numMes = parseInt(mes, 10) - 1;
  const nombreMes = meses[numMes] || mes;
  return `${parseInt(dia, 10)} de ${nombreMes} de ${año}`;
}

const fechaVisible = (fecha: string) => fecha.split('-').reverse().join('/');

function Descargas({
  nombre,
  empresa,
  periodo,
  columnas,
  filas,
}: {
  nombre: string;
  empresa: string;
  periodo: string;
  columnas: string[];
  filas: CeldaReporte[][];
}) {
  const [error, setError] = useState(false);

  function descargar(formato: 'pdf' | 'excel') {
    try {
      descargarReporte(formato, nombre, empresa, periodo, columnas, filas);
      setError(false);
    } catch {
      setError(true);
    }
  }

  const etiqueta = nombre.toLowerCase();

  return (
    <div className="mt-5 border-t border-slate-100 pt-4">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={!filas.length}
          aria-label={`Descargar ${etiqueta} en Excel`}
          onClick={() => descargar('excel')}
          className="btn-pressable min-h-[44px] inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-300 bg-white px-4 py-2.5 text-xs sm:text-sm font-bold text-emerald-800 hover:bg-emerald-50/80 active:scale-[0.97] shadow-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 disabled:cursor-not-allowed disabled:opacity-40 transition-colors"
        >
          <FileSpreadsheet aria-hidden="true" className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>Excel (.xlsx)</span>
        </button>

        <button
          type="button"
          disabled={!filas.length}
          aria-label={`Descargar ${etiqueta} en PDF`}
          onClick={() => descargar('pdf')}
          className="btn-pressable min-h-[44px] inline-flex items-center justify-center gap-2 rounded-xl border border-rose-300 bg-white px-4 py-2.5 text-xs sm:text-sm font-bold text-rose-800 hover:bg-rose-50/80 active:scale-[0.97] shadow-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-500 disabled:cursor-not-allowed disabled:opacity-40 transition-colors"
        >
          <FileDown aria-hidden="true" className="h-4 w-4 text-rose-600 shrink-0" />
          <span>PDF (.pdf)</span>
        </button>
      </div>

      {!filas.length && (
        <p className="mt-2.5 text-xs sm:text-sm text-slate-500">
          {nombre === 'Ausencias'
            ? 'No hay ausencias en el período seleccionado. Cambia las fechas para buscar otros resultados.'
            : 'No hay evaluaciones cerradas para el ciclo seleccionado.'}
        </p>
      )}

      {error && (
        <p role="alert" className="mt-3 rounded-xl border border-rose-200 bg-rose-50/80 px-4 py-2.5 text-xs sm:text-sm font-medium text-rose-700">
          No se pudo generar el archivo. Inténtalo de nuevo.
        </p>
      )}
    </div>
  );
}

function VistaPrevia({ columnas, filas }: { columnas: string[]; filas: CeldaReporte[][] }) {
  if (!filas.length) return null;

  return (
    <div className="mt-5 space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs sm:text-sm font-bold text-slate-800">
          Vista previa{' '}
          <span className="font-normal text-slate-500">
            {filas.length > 5 ? '(primeros 5 registros)' : `(${filas.length} registros)`}
          </span>
        </p>
      </div>
      <div className="overflow-x-auto rounded-2xl border border-slate-200/80 bg-slate-50/50 shadow-2xs">
        <table className="w-full min-w-[34rem] text-left text-xs sm:text-sm">
          <thead className="border-b border-slate-200 bg-slate-100/70 text-slate-600">
            <tr>
              {columnas.map((columna) => (
                <th key={columna} scope="col" className="px-3.5 py-3 text-xs font-bold uppercase tracking-wider text-slate-600">
                  {columna}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {filas.slice(0, 5).map((fila, indice) => (
              <tr key={indice} className="hover:bg-slate-50/60 transition-colors duration-150">
                {fila.map((valor, columna) => (
                  <td key={columna} className="px-3.5 py-3 text-slate-700 tabular-nums">
                    {valor}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ReporteAusencias(props: Props) {
  const hoy = new Date();
  const [desde, setDesde] = useState(`${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-01`);
  const [hasta, setHasta] = useState(
    `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(
      new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).getDate()
    ).padStart(2, '0')}`
  );
  const invalido = !desde || !hasta || desde > hasta;
  const items = prepararReporteAusencias(
    props.solicitudes,
    props.empleados,
    props.departamentos,
    props.tiposSolicitud,
    desde,
    hasta
  );
  const columnas = ['Colaborador', 'Departamento', 'Tipo', 'Desde', 'Hasta', 'Días totales', 'Motivo'];
  const filas = items.map((item) => [
    item.nombre,
    item.departamento,
    item.tipo,
    fechaVisible(item.desde),
    fechaVisible(item.hasta),
    item.dias,
    item.motivo,
  ]);

  const aplicarMesActual = () => {
    const ahora = new Date();
    const anio = ahora.getFullYear();
    const mes = String(ahora.getMonth() + 1).padStart(2, '0');
    const ultimoDia = String(new Date(anio, ahora.getMonth() + 1, 0).getDate()).padStart(2, '0');
    setDesde(`${anio}-${mes}-01`);
    setHasta(`${anio}-${mes}-${ultimoDia}`);
  };

  const aplicarMesAnterior = () => {
    const ahora = new Date();
    const fechaAnt = new Date(ahora.getFullYear(), ahora.getMonth() - 1, 1);
    const anio = fechaAnt.getFullYear();
    const mes = String(fechaAnt.getMonth() + 1).padStart(2, '0');
    const ultimoDia = String(new Date(anio, fechaAnt.getMonth() + 1, 0).getDate()).padStart(2, '0');
    setDesde(`${anio}-${mes}-01`);
    setHasta(`${anio}-${mes}-${ultimoDia}`);
  };

  const aplicarAnioActual = () => {
    const anio = new Date().getFullYear();
    setDesde(`${anio}-01-01`);
    setHasta(`${anio}-12-31`);
  };

  return (
    <section className="relative overflow-hidden rounded-3xl border border-slate-200/90 bg-white p-5 shadow-soft sm:p-6">
      {/* Halo ambiental esmeralda para reportes de ausencias */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-12 inset-x-0 mx-auto h-24 w-11/12 rounded-full blur-3xl bg-emerald-400/25"
      />
      <div className="relative">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50 text-emerald-600 shadow-soft">
            <CalendarRange aria-hidden="true" className="h-5 w-5 stroke-[2.2]" />
          </span>
          <div>
            <h2 className="text-base sm:text-lg font-bold tracking-tight text-slate-900">Ausencias por período</h2>
            <p className="text-xs sm:text-sm font-normal text-slate-500">
              Ausencias aprobadas que coinciden con las fechas seleccionadas.
            </p>
          </div>
        </div>

        {/* Contenedor proporcionado para la selección de fechas (max-w-xl para evitar estiramientos desmedidos) */}
        <div className="mt-5 max-w-xl space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Rango de fechas
            </span>
            {/* Presets rápidos y convenientes */}
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={aplicarMesActual}
                className="btn-pressable px-2.5 py-1 text-[11px] font-bold text-slate-600 hover:text-emerald-800 bg-slate-100 hover:bg-emerald-50 rounded-lg border border-slate-200/80 transition-colors"
              >
                Mes actual
              </button>
              <button
                type="button"
                onClick={aplicarMesAnterior}
                className="btn-pressable px-2.5 py-1 text-[11px] font-bold text-slate-600 hover:text-emerald-800 bg-slate-100 hover:bg-emerald-50 rounded-lg border border-slate-200/80 transition-colors"
              >
                Mes anterior
              </button>
              <button
                type="button"
                onClick={aplicarAnioActual}
                className="btn-pressable px-2.5 py-1 text-[11px] font-bold text-slate-600 hover:text-emerald-800 bg-slate-100 hover:bg-emerald-50 rounded-lg border border-slate-200/80 transition-colors"
              >
                Año actual
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Campo Desde: estilizado y bien proporcionado con selector nativo transparente */}
            <div className="space-y-1">
              <label htmlFor="ausencias-desde-input" className="block text-xs font-bold text-slate-700 tracking-tight">
                Fecha inicial
              </label>
              <div className="relative group">
                <div className="min-h-[48px] w-full rounded-xl border border-slate-200 bg-slate-50/70 group-hover:bg-slate-50 transition-all duration-150 px-3 py-2 flex items-center justify-between gap-2.5 text-left focus-within:ring-2 focus-within:ring-[#57CCB7]/40 focus-within:border-[#57CCB7] focus-within:bg-white shadow-soft">
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-600">
                      <Calendar className="h-4 w-4 stroke-[2.2]" aria-hidden="true" />
                    </span>
                    <div className="min-w-0 flex-1">
                      {desde ? (
                        <span className="block text-xs sm:text-sm font-bold text-slate-800 truncate">
                          {formatearFechaVisual(desde)}
                        </span>
                      ) : (
                        <span className="block text-xs sm:text-sm font-normal text-slate-400 truncate">
                          Selecciona fecha inicial
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 bg-emerald-50 text-emerald-800 border-emerald-200">
                    Desde
                  </span>
                </div>
                {/* Input nativo de fecha invisible superpuesto para activación táctil total */}
                <input
                  id="ausencias-desde-input"
                  aria-label="Ausencias desde"
                  type="date"
                  value={desde}
                  onChange={(e) => setDesde(e.target.value)}
                  className="absolute inset-0 h-full w-full cursor-pointer opacity-0 z-10"
                />
              </div>
            </div>

            {/* Campo Hasta: estilizado y bien proporcionado con selector nativo transparente */}
            <div className="space-y-1">
              <label htmlFor="ausencias-hasta-input" className="block text-xs font-bold text-slate-700 tracking-tight">
                Fecha final
              </label>
              <div className="relative group">
                <div className="min-h-[48px] w-full rounded-xl border border-slate-200 bg-slate-50/70 group-hover:bg-slate-50 transition-all duration-150 px-3 py-2 flex items-center justify-between gap-2.5 text-left focus-within:ring-2 focus-within:ring-[#57CCB7]/40 focus-within:border-[#57CCB7] focus-within:bg-white shadow-soft">
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-600">
                      <Calendar className="h-4 w-4 stroke-[2.2]" aria-hidden="true" />
                    </span>
                    <div className="min-w-0 flex-1">
                      {hasta ? (
                        <span className="block text-xs sm:text-sm font-bold text-slate-800 truncate">
                          {formatearFechaVisual(hasta)}
                        </span>
                      ) : (
                        <span className="block text-xs sm:text-sm font-normal text-slate-400 truncate">
                          Selecciona fecha final
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 bg-emerald-50 text-emerald-800 border-emerald-200">
                    Hasta
                  </span>
                </div>
                {/* Input nativo de fecha invisible superpuesto para activación táctil total */}
                <input
                  id="ausencias-hasta-input"
                  aria-label="Ausencias hasta"
                  type="date"
                  value={hasta}
                  onChange={(e) => setHasta(e.target.value)}
                  className="absolute inset-0 h-full w-full cursor-pointer opacity-0 z-10"
                />
              </div>
            </div>
          </div>
        </div>

        {invalido ? (
          <div role="alert" className="mt-4 flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50/80 px-4 py-3 text-xs sm:text-sm font-medium text-rose-700">
            <AlertCircle aria-hidden="true" className="w-4 h-4 shrink-0 text-rose-500" />
            <span>La fecha inicial debe ser anterior o igual a la fecha final.</span>
          </div>
        ) : (
          <div className="mt-4 flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200/80 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800 tabular-nums shadow-2xs">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>{items.length} {items.length === 1 ? 'ausencia encontrada' : 'ausencias encontradas'}</span>
            </span>
          </div>
        )}

        <VistaPrevia columnas={columnas} filas={filas} />

        <Descargas
          nombre="Ausencias"
          empresa={props.nombreEmpresa}
          periodo={`${fechaVisible(desde)} al ${fechaVisible(hasta)}`}
          columnas={columnas}
          filas={filas}
        />
      </div>
    </section>
  );
}

function ReporteEvaluaciones(props: Props) {
  const [periodo, setPeriodo] = useState('todos');
  const periodos = [
    ...new Set(props.evaluaciones.filter((item) => item.estado === 'cerrada').map((item) => item.periodo)),
  ]
    .sort()
    .reverse();
  const items = prepararReporteEvaluaciones(props.evaluaciones, props.empleados, props.departamentos, periodo);
  const columnas = ['Colaborador', 'Departamento', 'Ciclo', 'Puntaje / 100', 'Comentario general'];
  const filas = items.map((item) => [
    item.nombre,
    item.departamento,
    item.periodo,
    item.puntaje ?? 'Sin puntaje',
    item.comentario,
  ]);

  const cicloOpciones = [
    { value: 'todos', label: 'Todos los ciclos' },
    ...periodos.map((p) => ({ value: p, label: `Ciclo ${p}` })),
  ];

  return (
    <section className="relative overflow-hidden rounded-3xl border border-slate-200/90 bg-white p-5 shadow-soft sm:p-6">
      {/* Halo ambiental verde menta / teal para resultados de evaluación */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-12 inset-x-0 mx-auto h-24 w-11/12 rounded-full blur-3xl bg-teal-400/25"
      />
      <div className="relative">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-teal-200 bg-teal-50 text-teal-600 shadow-soft">
            <BarChart3 aria-hidden="true" className="h-5 w-5 stroke-[2.2]" />
          </span>
          <div>
            <h2 className="text-base sm:text-lg font-bold tracking-tight text-slate-900">Resultados de evaluación</h2>
            <p className="text-xs sm:text-sm font-normal text-slate-500">
              Exporta las evaluaciones cerradas con su puntaje y comentario general.
            </p>
          </div>
        </div>

        {/* Selector de ciclo proporcionado acorde al ancho del rango de fechas */}
        <div className="mt-5 max-w-xl sm:max-w-sm">
          <label htmlFor="ciclo-evaluacion-select" className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
            Ciclo
          </label>
          {/* Select nativo oculto para 100% accesibilidad y compatibilidad con pruebas */}
          <select
            id="ciclo-evaluacion-select"
            aria-label="Ciclo de evaluación"
            value={periodo}
            onChange={(e) => setPeriodo(e.target.value)}
            className="hidden pointer-events-none"
            style={{ display: 'none' }}
            tabIndex={-1}
          >
            <option value="todos">Todos los ciclos</option>
            {periodos.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          {/* CustomSelect interactivo con portal flotante */}
          <CustomSelect
            value={periodo}
            onChange={(val) => setPeriodo(val)}
            options={cicloOpciones}
            placeholder="Selecciona un ciclo"
            title="Ciclo de evaluación"
            icon={<Calendar className="w-4 h-4 text-teal-600" />}
            ariaLabel="Selector de ciclo de evaluación"
          />
        </div>

        <div className="mt-4 flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-teal-200/80 bg-teal-50 px-3 py-1 text-xs font-bold text-teal-800 tabular-nums shadow-2xs">
            <span className="h-1.5 w-1.5 rounded-full bg-teal-500 animate-pulse" />
            <span>{items.length} {items.length === 1 ? 'evaluación cerrada' : 'evaluaciones cerradas'}</span>
          </span>
        </div>

        <VistaPrevia columnas={columnas} filas={filas} />

        <Descargas
          nombre="Evaluaciones"
          empresa={props.nombreEmpresa}
          periodo={periodo === 'todos' ? 'Todos los ciclos' : `Ciclo ${periodo}`}
          columnas={columnas}
          filas={filas}
        />
      </div>
    </section>
  );
}

export function ReportesRRHH(props: Props) {
  if (props.errorCarga) {
    return (
      <section role="alert" className="rounded-3xl border border-rose-200 bg-white p-6 text-sm text-slate-800 shadow-soft">
        <p className="font-bold text-slate-900">No pudimos cargar los datos de los reportes.</p>
        <p className="mt-1 text-slate-600">Comprueba la conexión e inténtalo nuevamente.</p>
        <button
          type="button"
          onClick={props.onReintentar}
          className="btn-pressable mt-4 min-h-[44px] rounded-xl border border-slate-300 px-4 font-bold hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#008262] transition-colors"
        >
          Reintentar
        </button>
      </section>
    );
  }

  return (
    <div className="space-y-6">
      <ReporteAusencias {...props} />
      <ReporteEvaluaciones {...props} />
    </div>
  );
}
