import { useState, useMemo } from 'react';
import { Shield, AlertCircle } from 'lucide-react';
import type { RolColaborador } from '../services/gestionRRHHValidation';
import { CustomSelect, type CustomSelectOption } from './CustomSelect';

const etiquetas: Record<RolColaborador, string> = {
  empleado: 'Colaborador',
  jefe: 'Jefe de equipo',
  admin: 'Administrador de RR. HH.',
};

const descripcion: Record<RolColaborador, string> = {
  empleado: 'Podrá consultar sus datos y gestionar sus solicitudes.',
  jefe: 'Podrá revisar solicitudes y evaluaciones de las personas que tenga asignadas.',
  admin: 'Tendrá acceso administrativo a toda la empresa y podrá gestionar accesos.',
};

export function RolColaboradorRRHH({ rolActual, onGuardar, onCancelar }: {
  rolActual: RolColaborador; onGuardar: (rol: RolColaborador) => Promise<boolean>; onCancelar: () => void;
}) {
  const [rol, setRol] = useState(rolActual);
  const [revisando, setRevisando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [exito, setExito] = useState(false);
  const [error, setError] = useState('');

  const rolOpciones: CustomSelectOption[] = useMemo(
    () =>
      (Object.entries(etiquetas) as [RolColaborador, string][]).map(([valor, etiqueta]) => ({
        value: valor,
        label: etiqueta,
        description: descripcion[valor],
      })),
    []
  );

  async function guardar() {
    if (guardando || rol === rolActual) return;
    setGuardando(true); setError('');
    try {
      if (await onGuardar(rol)) setExito(true);
      else setError('No se pudo cambiar el rol. Revisa si tiene personas a cargo, si es la última ficha de RR. HH., si hay una operación de acceso en curso o si intentas cambiar tu propia cuenta.');
    } catch { setError('No se pudo cambiar el rol. Actualiza la página y vuelve a intentarlo.'); }
    finally { setGuardando(false); }
  }

  return (
    <section aria-label="Cambiar rol" className="relative overflow-hidden rounded-3xl border border-slate-200/90 bg-white p-5 shadow-soft sm:p-6">
      <div aria-hidden="true" className="pointer-events-none absolute -top-12 inset-x-0 mx-auto h-24 w-11/12 rounded-full blur-3xl bg-fuchsia-400/30" />
      <div className="relative">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-5">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-fuchsia-200 bg-fuchsia-50 text-fuchsia-600 shadow-soft">
            <Shield aria-hidden="true" className="h-5 w-5 stroke-[2.2]" />
          </span>
          <div>
            <h2 className="text-lg font-bold tracking-tight text-slate-900">Rol de acceso</h2>
            <p className="text-xs sm:text-sm font-medium text-slate-500">Configura los permisos y alcance del colaborador.</p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5 flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Rol actual</span>
          <span className="text-sm font-bold text-slate-900">
            <strong>{etiquetas[rolActual]}</strong>
          </span>
        </div>

        {exito ? (
          <p role="status" className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50/80 px-4 py-3 text-sm font-semibold text-[#007055]">
            Rol actualizado correctamente.
          </p>
        ) : (
          <div className="mt-5 space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="nuevo-rol-select" className="block text-sm font-semibold text-slate-800">
                Nuevo rol de acceso
              </label>
              <div className="relative">
                <select
                  id="nuevo-rol-select"
                  aria-label="Nuevo rol de acceso"
                  value={rol}
                  disabled={guardando || revisando}
                  onChange={(e) => setRol(e.target.value as RolColaborador)}
                  className="hidden pointer-events-none"
                  style={{ display: 'none' }}
                  tabIndex={-1}
                >
                  {Object.entries(etiquetas).map(([valor, etiqueta]) => (
                    <option key={valor} value={valor}>
                      {etiqueta}
                    </option>
                  ))}
                </select>
                <CustomSelect
                  value={rol}
                  onChange={(val) => setRol(val as RolColaborador)}
                  options={rolOpciones}
                  placeholder="Selecciona un rol"
                  title="Nuevo rol de acceso"
                  icon={<Shield className="w-4 h-4 text-cyan-600" />}
                  ariaLabel="Opciones de nuevo rol"
                  disabled={guardando || revisando}
                />
              </div>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4 space-y-1">
              <p className="text-sm font-medium text-slate-700">{descripcion[rol]}</p>
              <p className="text-xs text-slate-500">Si tiene una cuenta vinculada, sus permisos se actualizarán junto con la ficha.</p>
            </div>

            {revisando && (
              <div className="rounded-2xl border border-[#57CCB7]/50 bg-[#57CCB7]/10 p-4">
                <p className="text-sm font-bold text-[#005240]">¿Confirmas el cambio a {etiquetas[rol]}?</p>
              </div>
            )}

            {error && (
              <p role="alert" className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50/70 p-3 text-sm font-semibold text-rose-700">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                <span>{error}</span>
              </p>
            )}
          </div>
        )}

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={guardando}
            onClick={onCancelar}
            className="btn-pressable min-h-[44px] rounded-xl border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700 hover:bg-slate-50 active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400 disabled:opacity-50 transition-colors"
          >
            {exito ? 'Volver a la ficha' : 'Cancelar'}
          </button>
          {!exito && (!revisando ? (
            <button
              type="button"
              disabled={rol === rolActual}
              onClick={() => setRevisando(true)}
              className="btn-pressable min-h-[44px] rounded-xl bg-[#57CCB7] px-5 text-sm font-bold text-slate-900 shadow-soft hover:bg-[#46bfa9] active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#57CCB7] disabled:opacity-50 transition-colors"
            >
              Revisar cambio
            </button>
          ) : (
            <button
              type="button"
              disabled={guardando}
              onClick={() => void guardar()}
              className="btn-pressable min-h-[44px] rounded-xl bg-[#57CCB7] px-5 text-sm font-bold text-slate-900 shadow-soft hover:bg-[#46bfa9] active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#57CCB7] disabled:opacity-50 transition-colors"
            >
              {guardando ? 'Guardando…' : 'Confirmar cambio de rol'}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
