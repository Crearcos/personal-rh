import { useState, useMemo, type FormEvent } from 'react';
import { ClipboardList, AlertCircle, UserRound } from 'lucide-react';
import type { Empleado, OnboardingTarea } from '../types/models';
import { validarDatosTarea, type DatosTarea } from '../services/onboardingValidacion';
import { CustomSelect, type CustomSelectOption } from './CustomSelect';

const inputClass = 'mt-1.5 min-h-[48px] w-full rounded-xl border border-slate-300 bg-white px-3.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#57CCB7]/40 focus:border-[#57CCB7] disabled:opacity-60 transition-colors duration-150 shadow-xs';

export function FormularioTarea({ empleados, inicial, onCancelar, onGuardar }: {
  empleados: Empleado[];
  inicial?: OnboardingTarea;
  onCancelar: () => void;
  onGuardar: (datos: DatosTarea) => Promise<boolean>;
}) {
  const [empleadoId, setEmpleadoId] = useState(inicial?.empleado_id || '');
  const [tarea, setTarea] = useState(inicial?.tarea || '');
  const [responsable, setResponsable] = useState(inicial?.responsable || '');
  const [fechaLimite, setFechaLimite] = useState(inicial?.fecha_limite || '');
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);

  const colaboradorOpciones: CustomSelectOption[] = useMemo(
    () => [
      { value: '', label: 'Selecciona un colaborador' },
      ...empleados.map((e) => ({
        value: e.id,
        label: e.nombre,
        description: e.cargo,
      })),
    ],
    [empleados]
  );

  async function guardar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const datos = validarDatosTarea({ id: inicial?.id, empleadoId, tarea, responsable, fechaLimite });
    if (!datos) { setError('Completa todos los campos con datos válidos.'); return; }
    setGuardando(true);
    setError('');
    try {
      if (!await onGuardar(datos)) setError('No se pudo guardar la tarea. Inténtalo de nuevo.');
    } catch {
      setError('No se pudo guardar la tarea. Inténtalo de nuevo.');
    } finally {
      setGuardando(false);
    }
  }

  return (
    <section className="relative overflow-hidden rounded-3xl border border-slate-200/90 bg-white p-5 shadow-soft sm:p-6">
      <div aria-hidden="true" className="pointer-events-none absolute -top-12 inset-x-0 mx-auto h-24 w-11/12 rounded-full blur-3xl bg-cyan-400/30" />
      <div className="relative">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-5">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-cyan-200 bg-cyan-50 text-cyan-600 shadow-soft">
            <ClipboardList aria-hidden="true" className="h-5 w-5 stroke-[2.2]" />
          </span>
          <div>
            <h2 className="text-lg font-bold tracking-tight text-slate-900">
              {inicial ? 'Editar tarea' : 'Nueva tarea de incorporación'}
            </h2>
            <p className="text-xs sm:text-sm font-medium text-slate-500">Asigna una actividad, un responsable y una fecha límite.</p>
          </div>
        </div>

        <form onSubmit={guardar} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1 sm:col-span-2">
              <label htmlFor="colaborador-select" className="block text-sm font-semibold text-slate-800">
                Colaborador
              </label>
              <div className="relative">
                <select
                  id="colaborador-select"
                  aria-label="Colaborador"
                  value={empleadoId}
                  onChange={(e) => setEmpleadoId(e.target.value)}
                  disabled={guardando}
                  className="hidden pointer-events-none"
                  style={{ display: 'none' }}
                  tabIndex={-1}
                >
                  <option value="">Selecciona un colaborador</option>
                  {empleados.map((empleado) => (
                    <option key={empleado.id} value={empleado.id}>
                      {empleado.nombre}
                    </option>
                  ))}
                </select>
                <CustomSelect
                  value={empleadoId}
                  onChange={(val) => setEmpleadoId(val)}
                  options={colaboradorOpciones}
                  placeholder="Selecciona un colaborador"
                  title="Colaborador"
                  icon={<UserRound className="w-4 h-4 text-cyan-600" />}
                  ariaLabel="Opciones de colaborador"
                  disabled={guardando}
                />
              </div>
            </div>

            <label className="block text-sm font-semibold text-slate-800 sm:col-span-2">
              Tarea
              <input
                required
                maxLength={200}
                value={tarea}
                onChange={(e) => setTarea(e.target.value)}
                disabled={guardando}
                className={inputClass}
              />
            </label>

            <label className="block text-sm font-semibold text-slate-800">
              Responsable
              <input
                required
                maxLength={150}
                value={responsable}
                onChange={(e) => setResponsable(e.target.value)}
                disabled={guardando}
                className={inputClass}
              />
            </label>

            <label className="block text-sm font-semibold text-slate-800">
              Fecha límite
              <input
                required
                type="date"
                value={fechaLimite}
                onChange={(e) => setFechaLimite(e.target.value)}
                disabled={guardando}
                className={inputClass}
              />
            </label>
          </div>

          {error && (
            <p role="alert" className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50/70 p-3 text-sm font-semibold text-rose-700">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </p>
          )}

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              disabled={guardando}
              type="submit"
              className="btn-pressable min-h-[44px] rounded-xl bg-[#57CCB7] px-5 text-sm font-bold text-slate-900 shadow-soft hover:bg-[#46bfa9] active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#57CCB7] disabled:opacity-60 transition-colors"
            >
              {guardando ? 'Guardando…' : inicial ? 'Guardar cambios' : 'Guardar tarea'}
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
