import { useState, useMemo, useRef, type FormEvent } from 'react';
import { Building2, UserCheck, AlertCircle, Calendar, UserRound } from 'lucide-react';
import type { Departamento, Empleado } from '../types/models';
import { validarEdicionColaborador, type DatosEdicionColaborador } from '../services/gestionRRHHValidation';
import { CustomSelect, type CustomSelectOption } from './CustomSelect';

const input = 'mt-1.5 min-h-[48px] w-full rounded-xl border border-slate-300 bg-white px-3.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#57CCB7]/40 focus:border-[#57CCB7] disabled:opacity-60 transition-colors duration-150 shadow-xs';

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

export function EditarColaboradorRRHH({ empleado, empleados, departamentos, onGuardar, onCancelar }: {
  empleado: Empleado; empleados: Empleado[]; departamentos: Departamento[]; onGuardar: (datos: DatosEdicionColaborador) => Promise<boolean>; onCancelar: () => void;
}) {
  const [datos, setDatos] = useState<DatosEdicionColaborador>({ id: empleado.id, nombre: empleado.nombre, cargo: empleado.cargo, departamentoId: empleado.departamento_id || '', jefeId: empleado.jefe_id || '', fechaIngreso: empleado.fecha_ingreso });
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);

  const deptoTriggerRef = useRef<HTMLButtonElement>(null);
  const jefeTriggerRef = useRef<HTMLButtonElement>(null);

  const cambiar = (campo: keyof DatosEdicionColaborador, valor: string) => setDatos((actual) => ({ ...actual, [campo]: valor }));

  const departamentoOpciones: CustomSelectOption[] = useMemo(
    () => departamentos.map((d) => ({ value: d.id, label: d.nombre })),
    [departamentos]
  );

  const jefeOpciones: CustomSelectOption[] = useMemo(
    () => [
      { value: '', label: 'Sin asignar' },
      ...empleados
        .filter((e) => e.activo && e.id !== empleado.id)
        .map((e) => ({
          value: e.id,
          label: e.nombre,
          description: e.cargo,
        })),
    ],
    [empleados, empleado.id]
  );

  async function guardar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validacion = validarEdicionColaborador(datos);
    if (!validacion.success || !validacion.data) { setError(validacion.error || 'Revisa los datos.'); return; }
    setGuardando(true); setError('');
    try { if (!await onGuardar(validacion.data)) setError('No se pudo actualizar la ficha. Inténtalo de nuevo.'); }
    catch { setError('No se pudo actualizar la ficha. Inténtalo de nuevo.'); }
    finally { setGuardando(false); }
  }

  return (
    <section className="relative overflow-hidden rounded-3xl border border-slate-200/90 bg-white p-5 shadow-soft sm:p-6">
      <div aria-hidden="true" className="pointer-events-none absolute -top-12 inset-x-0 mx-auto h-24 w-11/12 rounded-full blur-3xl bg-fuchsia-400/30" />
      <div className="relative">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-6">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-fuchsia-200 bg-fuchsia-50 text-fuchsia-600 shadow-soft">
            <UserRound aria-hidden="true" className="h-5 w-5 stroke-[2.2]" />
          </span>
          <div>
            <h2 className="text-lg font-bold tracking-tight text-slate-900">Editar ficha</h2>
            <p className="text-xs sm:text-sm font-medium text-slate-500">Actualiza la información laboral del colaborador.</p>
          </div>
        </div>

        <form onSubmit={guardar} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="block text-sm font-semibold text-slate-800">
              Nombre completo
              <input required maxLength={150} disabled={guardando} value={datos.nombre} onChange={(e) => cambiar('nombre', e.target.value)} className={input} />
            </label>
            <label className="block text-sm font-semibold text-slate-800">
              Cargo
              <input required maxLength={150} disabled={guardando} value={datos.cargo} onChange={(e) => cambiar('cargo', e.target.value)} className={input} />
            </label>
            
            {/* Departamento */}
            <div className="space-y-1">
              <label onClick={() => deptoTriggerRef.current?.click()} className="block text-sm font-semibold text-slate-800 cursor-pointer">
                Departamento
              </label>
              <select
                aria-label="Departamento"
                disabled={guardando}
                value={datos.departamentoId}
                onChange={(e) => cambiar('departamentoId', e.target.value)}
                className="hidden pointer-events-none"
                style={{ display: 'none' }}
                tabIndex={-1}
                aria-hidden="true"
              >
                <option value="">Selecciona un departamento</option>
                {departamentos.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.nombre}
                  </option>
                ))}
              </select>
              <CustomSelect
                triggerRef={deptoTriggerRef}
                value={datos.departamentoId}
                onChange={(val) => cambiar('departamentoId', val)}
                options={departamentoOpciones}
                placeholder="Selecciona un departamento"
                title="Departamento"
                icon={<Building2 className="w-4 h-4 text-cyan-600" />}
                ariaLabel="Opciones de departamento"
              />
            </div>

            {/* Jefe inmediato */}
            <div className="space-y-1">
              <label onClick={() => jefeTriggerRef.current?.click()} className="block text-sm font-semibold text-slate-800 cursor-pointer">
                Jefe inmediato
              </label>
              <select
                aria-label="Jefe inmediato"
                disabled={guardando}
                value={datos.jefeId}
                onChange={(e) => cambiar('jefeId', e.target.value)}
                className="hidden pointer-events-none"
                style={{ display: 'none' }}
                tabIndex={-1}
                aria-hidden="true"
              >
                <option value="">Sin asignar</option>
                {empleados
                  .filter((e) => e.activo && e.id !== empleado.id)
                  .map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.nombre}
                    </option>
                  ))}
              </select>
              <CustomSelect
                triggerRef={jefeTriggerRef}
                value={datos.jefeId}
                onChange={(val) => cambiar('jefeId', val)}
                options={jefeOpciones}
                placeholder="Sin asignar"
                title="Jefe inmediato"
                icon={<UserCheck className="w-4 h-4 text-cyan-600" />}
                ariaLabel="Opciones de jefe inmediato"
              />
            </div>

            {/* Fecha de ingreso */}
            <div className="space-y-1 sm:col-span-2">
              <label htmlFor="fecha-ingreso-editar" className="block text-sm font-semibold text-slate-800">
                Fecha de ingreso
              </label>
              <div className="relative mt-1.5 group">
                <div className="min-h-[48px] w-full rounded-xl border border-slate-300 bg-white group-hover:bg-slate-50 transition-all duration-150 px-3.5 py-2 flex items-center justify-between gap-2.5 text-left focus-within:ring-2 focus-within:ring-[#57CCB7]/40 focus-within:border-[#57CCB7] shadow-soft">
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-cyan-200 bg-cyan-50 text-cyan-600">
                      <Calendar className="h-4 w-4 stroke-[2.2]" aria-hidden="true" />
                    </span>
                    <div className="min-w-0 flex-1">
                      {datos.fechaIngreso ? (
                        <span className="block text-xs sm:text-sm font-bold text-slate-800 truncate">
                          {formatearFechaVisual(datos.fechaIngreso)}
                        </span>
                      ) : (
                        <span className="block text-xs sm:text-sm font-normal text-slate-400 truncate">
                          Selecciona una fecha
                        </span>
                      )}
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${
                      datos.fechaIngreso
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-slate-100 text-slate-500 border-slate-200'
                    }`}
                  >
                    {datos.fechaIngreso ? 'Definida' : 'Requerida'}
                  </span>
                </div>

                <input
                  id="fecha-ingreso-editar"
                  aria-label="Fecha de ingreso"
                  type="date"
                  required
                  disabled={guardando}
                  value={datos.fechaIngreso}
                  onChange={(e) => cambiar('fechaIngreso', e.target.value)}
                  className="absolute inset-0 h-full w-full cursor-pointer opacity-0 z-10"
                />
              </div>
            </div>
          </div>

          {error && (
            <p role="alert" className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50/70 p-3 text-sm font-semibold text-rose-700">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </p>
          )}

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={guardando}
              className="btn-pressable min-h-[44px] rounded-xl bg-[#57CCB7] px-5 text-sm font-bold text-slate-900 shadow-soft hover:bg-[#46bfa9] active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#57CCB7] disabled:opacity-60 transition-colors"
            >
              {guardando ? 'Guardando…' : 'Guardar cambios'}
            </button>
            <button
              type="button"
              disabled={guardando}
              onClick={onCancelar}
              className="btn-pressable min-h-[44px] rounded-xl border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700 hover:bg-slate-50 active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400 disabled:opacity-60 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
