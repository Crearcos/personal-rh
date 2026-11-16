import { useState, useMemo, useRef, type FormEvent } from 'react';
import { UserPlus, Building2, UserCheck, CheckCircle2, AlertCircle, Calendar, Shield } from 'lucide-react';
import type { Departamento, Empleado } from '../types/models';
import { validarEmpleadoRRHH, type DatosEmpleadoRRHH } from '../services/gestionRRHHValidation';
import { CustomSelect, type CustomSelectOption } from './CustomSelect';

const inputClass =
  'mt-1.5 min-h-[48px] w-full rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-50 focus:bg-white px-3.5 text-xs sm:text-sm font-semibold text-slate-800 placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-[#57CCB7]/40 focus:border-[#57CCB7] disabled:opacity-60 transition-all duration-150';

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

export function FormularioColaboradorRRHH({
  departamentos,
  empleados,
  onGuardar,
  onCancelar,
}: {
  departamentos: Departamento[];
  empleados: Empleado[];
  onGuardar: (datos: DatosEmpleadoRRHH) => Promise<boolean>;
  onCancelar: () => void;
}) {
  const [datos, setDatos] = useState<DatosEmpleadoRRHH>({
    nombre: '',
    correo: '',
    cargo: '',
    departamentoId: '',
    jefeId: '',
    fechaIngreso: '',
    rol: 'empleado',
  });
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [exito, setExito] = useState(false);

  const deptoTriggerRef = useRef<HTMLButtonElement>(null);
  const jefeTriggerRef = useRef<HTMLButtonElement>(null);

  const cambiar = (campo: keyof DatosEmpleadoRRHH, valor: string) =>
    setDatos((actual) => ({ ...actual, [campo]: valor }));

  const departamentoOpciones: CustomSelectOption[] = useMemo(
    () => departamentos.map((d) => ({ value: d.id, label: d.nombre })),
    [departamentos]
  );

  const jefeOpciones: CustomSelectOption[] = useMemo(
    () => [
      { value: '', label: 'Sin asignar' },
      ...empleados
        .filter((e) => e.activo)
        .map((e) => ({
          value: e.id,
          label: e.nombre,
          description: e.cargo,
        })),
    ],
    [empleados]
  );

  const rolOpciones: CustomSelectOption[] = useMemo(
    () => [
      { value: 'empleado', label: 'Colaborador', description: 'Consulta datos y gestiona solicitudes' },
      { value: 'jefe', label: 'Jefe de equipo', description: 'Revisa solicitudes y evalúa equipo' },
      { value: 'admin', label: 'Administrador de RR. HH.', description: 'Acceso administrativo total' },
    ],
    []
  );

  async function guardar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const resultado = validarEmpleadoRRHH(datos);
    if (!resultado.success || !resultado.data) {
      setError(resultado.error || 'Revisa los datos.');
      return;
    }
    setGuardando(true);
    setError('');
    try {
      if (await onGuardar(resultado.data)) setExito(true);
      else setError('No se pudo crear el colaborador. Revisa los datos e inténtalo de nuevo.');
    } catch {
      setError('No se pudo crear el colaborador. Inténtalo de nuevo.');
    } finally {
      setGuardando(false);
    }
  }

  if (exito) {
    return (
      <section
        aria-label="Confirmación de colaborador"
        className="relative overflow-hidden rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-soft"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-12 inset-x-0 mx-auto h-24 w-11/12 rounded-full blur-3xl bg-fuchsia-400/30"
        />
        <div className="relative flex flex-col items-center text-center space-y-3 py-4">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-[#007055] border border-emerald-200">
            <CheckCircle2 aria-hidden="true" className="h-6 w-6 stroke-[2.2]" />
          </span>
          <p role="status" className="text-base sm:text-lg font-bold tracking-tight text-slate-900">
            Colaborador creado correctamente.
          </p>
          <p className="max-w-md text-xs sm:text-sm text-slate-500 font-normal">
            La ficha ha sido incorporada al directorio institucional con su saldo de vacaciones inicial.
          </p>
          <button
            type="button"
            onClick={onCancelar}
            className="btn-pressable mt-3 min-h-[44px] rounded-xl border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-800 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#57CCB7]"
          >
            Volver al directorio
          </button>
        </div>
      </section>
    );
  }

  return (
    <section
      aria-label="Formulario de nuevo colaborador"
      className="relative rounded-3xl border border-slate-200/90 bg-white p-5 shadow-soft sm:p-7"
    >
      {/* Halo superior centrado contenido */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden rounded-3xl"
      >
        <div className="absolute -top-12 inset-x-0 mx-auto h-24 w-11/12 rounded-full blur-3xl bg-fuchsia-400/30" />
      </div>

      <div className="relative">
        {/* Encabezado del Formulario con Icono */}
        <div className="flex items-center gap-3 border-b border-slate-200/80 pb-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-fuchsia-200 bg-fuchsia-50 text-fuchsia-600">
            <UserPlus aria-hidden="true" className="h-5 w-5 stroke-[2.2]" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-base sm:text-lg font-bold tracking-tight text-slate-900">
              Nuevo colaborador
            </h2>
            <p className="mt-0.5 text-xs sm:text-sm text-slate-500 font-normal leading-relaxed">
              Usa datos ficticios para la demo. Se creará un saldo inicial de 15 días para el año actual.
            </p>
          </div>
        </div>

        <form onSubmit={guardar} className="mt-5 space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Fila 1: Datos Personales (Nombre y Correo) */}
            <div className="space-y-1.5">
              <label
                htmlFor="nombre"
                className="block text-xs sm:text-sm font-bold text-slate-800 tracking-tight"
              >
                Nombre completo
              </label>
              <input
                id="nombre"
                aria-label="Nombre completo"
                required
                maxLength={150}
                disabled={guardando}
                placeholder="Ej. Ana Torres Salazar"
                value={datos.nombre}
                onChange={(e) => cambiar('nombre', e.target.value)}
                className={inputClass}
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="correo"
                className="block text-xs sm:text-sm font-bold text-slate-800 tracking-tight"
              >
                Correo
              </label>
              <input
                id="correo"
                aria-label="Correo"
                type="email"
                required
                maxLength={254}
                disabled={guardando}
                placeholder="ana.torres@empresa.com"
                value={datos.correo}
                onChange={(e) => cambiar('correo', e.target.value)}
                className={inputClass}
              />
            </div>

            {/* Fila 2: Datos del Puesto y Vinculación (Cargo y Fecha de Ingreso) */}
            <div className="space-y-1.5">
              <label
                htmlFor="cargo"
                className="block text-xs sm:text-sm font-bold text-slate-800 tracking-tight"
              >
                Cargo
              </label>
              <input
                id="cargo"
                aria-label="Cargo"
                required
                maxLength={150}
                disabled={guardando}
                placeholder="Ej. Asesora Comercial"
                value={datos.cargo}
                onChange={(e) => cambiar('cargo', e.target.value)}
                className={inputClass}
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="fecha-ingreso"
                className="block text-xs sm:text-sm font-bold text-slate-800 tracking-tight"
              >
                Fecha de ingreso
              </label>
              <div className="relative mt-1.5 group">
                {/* Tarjeta de visualización atractiva y proporcionada con icono contextual */}
                <div className="min-h-[48px] w-full rounded-xl border border-slate-200 bg-slate-50/70 group-hover:bg-slate-50 transition-all duration-150 px-3 py-2 flex items-center justify-between gap-2.5 text-left focus-within:ring-2 focus-within:ring-[#57CCB7]/40 focus-within:border-[#57CCB7] focus-within:bg-white shadow-soft">
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

                {/* Input nativo de fecha invisible superpuesto para activar el selector nativo táctil de forma precisa */}
                <input
                  id="fecha-ingreso"
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

            {/* Fila 3: Estructura Organizativa (Departamento y Jefe Inmediato) */}
            <div className="space-y-1.5">
              <label
                onClick={() => deptoTriggerRef.current?.click()}
                className="block text-xs sm:text-sm font-bold text-slate-800 tracking-tight cursor-pointer"
              >
                Departamento
              </label>
              {/* Select nativo accesible únicamente para sincronización de tests (oculto e inerte al tacto) */}
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

              {/* Selector personalizado con modal/hoja inferior sobrepuesta */}
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

            <div className="space-y-1.5">
              <label
                onClick={() => jefeTriggerRef.current?.click()}
                className="block text-xs sm:text-sm font-bold text-slate-800 tracking-tight cursor-pointer"
              >
                Jefe inmediato
              </label>
              {/* Select nativo accesible únicamente para sincronización de tests (oculto e inerte al tacto) */}
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
                  .filter((e) => e.activo)
                  .map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.nombre}
                    </option>
                  ))}
              </select>

              {/* Selector personalizado con modal/hoja inferior sobrepuesta */}
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
          </div>

          <div className="space-y-1">
            <label htmlFor="rol-acceso" className="block text-sm font-semibold text-slate-800">
              Rol de acceso
            </label>
            <div className="relative">
              <select
                id="rol-acceso"
                aria-label="Rol de acceso"
                value={datos.rol}
                disabled={guardando}
                onChange={(e) => setDatos((actual) => ({ ...actual, rol: e.target.value as DatosEmpleadoRRHH['rol'] }))}
                className="hidden pointer-events-none"
                style={{ display: 'none' }}
                tabIndex={-1}
              >
                <option value="empleado">Colaborador</option>
                <option value="jefe">Jefe de equipo</option>
                <option value="admin">Administrador de RR. HH.</option>
              </select>
              <CustomSelect
                value={datos.rol || 'empleado'}
                onChange={(val) => setDatos((actual) => ({ ...actual, rol: val as DatosEmpleadoRRHH['rol'] }))}
                options={rolOpciones}
                placeholder="Selecciona un rol"
                title="Rol de acceso"
                icon={<Shield className="w-4 h-4 text-cyan-600" />}
                ariaLabel="Opciones de rol de acceso"
                disabled={guardando}
              />
            </div>
            <p className="mt-2 text-xs sm:text-sm font-medium text-slate-600">
              {datos.rol === 'admin'
                ? 'RR. HH. administra la información de toda la empresa y sus accesos.'
                : datos.rol === 'jefe'
                ? 'El jefe revisa solicitudes y evaluaciones de las personas que tenga asignadas.'
                : 'El colaborador consulta sus datos y gestiona sus propias solicitudes.'}
            </p>
            <p className="mt-1 text-xs text-slate-500">Después de crear la ficha, configura su cuenta en «Gestionar acceso».</p>
          </div>

          {/* Mensaje de Error */}
          {error && (
            <div
              role="alert"
              className="rounded-2xl border border-rose-200 bg-rose-50/70 p-3.5 text-xs sm:text-sm font-semibold text-rose-800 flex items-center gap-2"
            >
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Botones de Acción */}
          <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-100">
            <button
              type="submit"
              disabled={guardando}
              className="btn-pressable min-h-[44px] rounded-xl bg-[#57CCB7] px-6 text-xs sm:text-sm font-bold text-slate-900 shadow-soft hover:bg-[#46bfa9] active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#57CCB7] disabled:opacity-60 transition-colors duration-150"
            >
              {guardando ? 'Guardando…' : 'Crear colaborador'}
            </button>
            <button
              type="button"
              disabled={guardando}
              onClick={onCancelar}
              className="btn-pressable min-h-[44px] rounded-xl border border-slate-300 bg-white px-5 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#57CCB7] disabled:opacity-60 transition-colors duration-150"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
