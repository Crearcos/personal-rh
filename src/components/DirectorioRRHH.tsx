import { useState } from 'react';
import {
  ArrowLeft,
  ChevronRight,
  UserRound,
  Users,
  UserPlus,
  Briefcase,
  Building2,
  UserCheck,
  Calendar,
  FileText,
  Shield,
  Clock,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import type { Departamento, Empleado, SaldoVacaciones, Usuario } from '../types/models';
import { AjusteSaldoRRHH } from './AjusteSaldoRRHH';
import { FormularioColaboradorRRHH } from './FormularioColaboradorRRHH';
import { EditarColaboradorRRHH } from './EditarColaboradorRRHH';
import { CorreoColaboradorRRHH } from './CorreoColaboradorRRHH';
import { VincularCuentaRRHH } from './VincularCuentaRRHH';
import { CreditoSaldoRRHH } from './CreditoSaldoRRHH';
import { RolColaboradorRRHH } from './RolColaboradorRRHH';
import type { RolColaborador } from '../services/gestionRRHHValidation';
import type { DatosEmpleadoRRHH, DatosEdicionColaborador } from '../services/gestionRRHHValidation';

interface Props {
  onLimpiarFiltros?: () => void;
  empleados: Empleado[];
  todosEmpleados?: Empleado[];
  departamentos: Departamento[];
  saldos: SaldoVacaciones[];
  usuarios?: Usuario[];
  onCambiarRol?: (empleadoId: string, rol: RolColaborador) => Promise<boolean>;
  onAjustarSaldo?: (saldo: SaldoVacaciones, dias: number) => Promise<boolean>;
  onAcreditarSaldo?: (saldo: SaldoVacaciones, dias: number, motivo: string, operacion: string) => Promise<boolean>;
  onCrearColaborador?: (datos: DatosEmpleadoRRHH) => Promise<boolean>;
  onEditarColaborador?: (datos: DatosEdicionColaborador) => Promise<boolean>;
  onDesactivarColaborador?: (id: string) => Promise<boolean>;
  onReactivarColaborador?: (id: string) => Promise<boolean>;
  onConsultarCorreo?: (usuarioId: string) => Promise<string | null>;
  onCambiarCorreo?: (id: string, correo: string) => Promise<boolean>;
  onVincularCuenta?: (id: string, correo: string, rol: RolColaborador) => Promise<'vinculada' | 'existente' | null>;
}

function fechaVisible(fecha: string): string {
  const partes = fecha?.split('-');
  return partes?.length === 3 ? `${partes[2]}/${partes[1]}/${partes[0]}` : 'No registrada';
}

function departamentoNombre(empleado: Empleado, departamentos: Departamento[]): string {
  return departamentos.find((item) => item.id === empleado.departamento_id)?.nombre || 'No asignado';
}

function DatosEmpleado({ empleado, jefe, departamento, rol }: { empleado: Empleado; jefe?: Empleado; departamento: string; rol?: RolColaborador }) {
  const datos = [
    { nombre: 'Cargo', valor: empleado.cargo, icon: Briefcase },
    { nombre: 'Departamento', valor: departamento, icon: Building2 },
    { nombre: 'Jefe inmediato', valor: jefe?.nombre || 'No asignado', icon: UserCheck },
    { nombre: 'Fecha de ingreso', valor: fechaVisible(empleado.fecha_ingreso), icon: Calendar },
    { nombre: 'Tipo de contrato', valor: empleado.tipo_contrato, icon: FileText },
    { nombre: 'Estado', valor: empleado.activo ? 'Activo' : 'Inactivo', icon: empleado.activo ? CheckCircle2 : XCircle },
    { nombre: 'Rol de acceso', valor: rol === 'admin' ? 'Administrador de RR. HH.' : rol === 'jefe' ? 'Jefe de equipo' : rol === 'empleado' ? 'Colaborador' : 'No disponible', icon: Shield, isFullWidth: true },
  ];
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-slate-50/60 p-2 sm:p-3">
      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-2">
        {datos.map((dato) => {
          const Icon = dato.icon;
          return (
            <div
              key={dato.nombre}
              className={`flex items-center justify-between gap-3 rounded-xl bg-white px-3.5 py-2.5 border border-slate-200/60 shadow-2xs transition-colors ${
                dato.isFullWidth ? 'sm:col-span-2' : ''
              }`}
            >
              <dt className="flex items-center gap-2.5 min-w-0 text-xs font-semibold text-slate-500">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-fuchsia-100 bg-fuchsia-50 text-fuchsia-600 shadow-2xs">
                  <Icon aria-hidden="true" className="h-3.5 w-3.5 stroke-[2.2]" />
                </span>
                <span className="truncate">{dato.nombre}</span>
              </dt>
              <dd className="text-xs sm:text-sm font-bold text-slate-900 text-right tabular-nums truncate max-w-[55%]">
                {dato.valor || 'No registrado'}
              </dd>
            </div>
          );
        })}
      </dl>
    </div>
  );
}

function SaldoEmpleado({ saldo, onAjustar, onAcreditar }: { saldo?: SaldoVacaciones; onAjustar?: () => void; onAcreditar?: () => void }) {
  return (
    <section aria-label="Saldo de vacaciones" className="relative overflow-hidden rounded-3xl border border-slate-200/90 bg-white p-5 shadow-soft sm:p-6">
      <div className="relative">
        <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-fuchsia-200 bg-fuchsia-50 text-fuchsia-600 shadow-xs">
            <Clock aria-hidden="true" className="h-4 w-4 stroke-[2.2]" />
          </span>
          <div>
            <h3 className="text-base font-bold tracking-tight text-slate-900">Saldo de vacaciones</h3>
            {saldo && <p className="text-xs font-medium text-slate-500">Período {saldo.anio}</p>}
          </div>
        </div>

        {!saldo ? (
          <p className="mt-4 text-sm text-slate-600">Sin saldo registrado</p>
        ) : (
          <>
            <dl className="mt-4 grid grid-cols-3 gap-2 sm:gap-3">
              {[
                { nombre: 'Derecho', valor: saldo.dias_derecho, highlight: false },
                { nombre: 'Tomados', valor: saldo.dias_tomados, highlight: false },
                { nombre: 'Disponibles', valor: saldo.dias_pendientes, highlight: true },
              ].map((item) => (
                <div
                  key={item.nombre}
                  className={`rounded-2xl border p-2.5 sm:p-3.5 text-center transition-colors ${
                    item.highlight
                      ? 'border-[#57CCB7]/60 bg-[#57CCB7]/10'
                      : 'border-slate-200/70 bg-slate-50/70'
                  }`}
                >
                  <dt className={`text-[11px] sm:text-xs font-semibold uppercase tracking-wider ${item.highlight ? 'text-[#00614a]' : 'text-slate-500'}`}>
                    {item.nombre}
                  </dt>
                  <dd className={`mt-0.5 sm:mt-1 text-sm sm:text-lg font-bold tabular-nums ${item.highlight ? 'text-[#005240]' : 'text-slate-900'}`}>
                    {item.valor} días
                  </dd>
                </div>
              ))}
            </dl>
            <div className="mt-4 grid grid-cols-2 gap-2.5 sm:gap-3">
              {onAjustar && (
                <button
                  type="button"
                  onClick={onAjustar}
                  className="btn-pressable flex w-full min-h-[44px] items-center justify-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs sm:text-sm font-semibold text-slate-700 hover:border-[#57CCB7] hover:bg-slate-50/80 active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#57CCB7] transition-colors"
                >
                  Ajustar saldo
                </button>
              )}
              {onAcreditar && (
                <button
                  type="button"
                  onClick={onAcreditar}
                  className="btn-pressable flex w-full min-h-[44px] items-center justify-center rounded-xl bg-[#57CCB7] px-3 py-2 text-xs sm:text-sm font-bold text-slate-900 shadow-soft hover:bg-[#46bfa9] active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#57CCB7] transition-colors"
                >
                  Acreditar días
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </section>
  );
}

function FichaEmpleado({ empleado, todosEmpleados, departamentos, saldo, rol, onCambiarRol, onVolver, onAjustarSaldo, onAcreditarSaldo, onEditarColaborador, onDesactivarColaborador, onReactivarColaborador, onConsultarCorreo, onCambiarCorreo, onVincularCuenta }: {
  empleado: Empleado; todosEmpleados: Empleado[]; departamentos: Departamento[]; saldo?: SaldoVacaciones; onVolver: () => void;
  onAjustarSaldo?: (saldo: SaldoVacaciones, dias: number) => Promise<boolean>;
  onAcreditarSaldo?: (saldo: SaldoVacaciones, dias: number, motivo: string, operacion: string) => Promise<boolean>;
  onEditarColaborador?: (datos: DatosEdicionColaborador) => Promise<boolean>; onDesactivarColaborador?: (id: string) => Promise<boolean>;
  onReactivarColaborador?: (id: string) => Promise<boolean>; onConsultarCorreo?: (usuarioId: string) => Promise<string | null>; onCambiarCorreo?: (id: string, correo: string) => Promise<boolean>;
  onVincularCuenta?: (id: string, correo: string, rol: RolColaborador) => Promise<'vinculada' | 'existente' | null>;
  rol?: RolColaborador; onCambiarRol?: (empleadoId: string, rol: RolColaborador) => Promise<boolean>;
}) {
  const [ajustando, setAjustando] = useState(false);
  const [acreditando, setAcreditando] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [editando, setEditando] = useState(false);
  const [confirmar, setConfirmar] = useState(false);
  const [desactivando, setDesactivando] = useState(false);
  const [error, setError] = useState(false);
  const [errorReactivar, setErrorReactivar] = useState(false);
  const [editandoCorreo, setEditandoCorreo] = useState(false);
  const [vinculandoCuenta, setVinculandoCuenta] = useState(false);
  const [editandoRol, setEditandoRol] = useState(false);
  const jefe = todosEmpleados.find((item) => item.id === empleado.jefe_id);
  async function desactivar() {
    if (!onDesactivarColaborador || desactivando) return;
    setDesactivando(true); setError(false);
    try { if (await onDesactivarColaborador(empleado.id)) { setConfirmar(false); setMensaje('Colaborador desactivado correctamente.'); } else setError(true); }
    catch { setError(true); }
    finally { setDesactivando(false); }
  }
  async function reactivar() {
    if (!onReactivarColaborador || desactivando) return;
    setDesactivando(true); setErrorReactivar(false); setMensaje('');
    try { if (await onReactivarColaborador(empleado.id)) setMensaje('Colaborador reactivado correctamente.'); else setErrorReactivar(true); }
    catch { setErrorReactivar(true); }
    finally { setDesactivando(false); }
  }
  if (editandoCorreo && onConsultarCorreo && onCambiarCorreo) return <CorreoColaboradorRRHH onConsultar={() => onConsultarCorreo(empleado.usuario_id)} onGuardar={(correo) => onCambiarCorreo(empleado.id, correo)} onCancelar={() => setEditandoCorreo(false)} />;
  if (editandoRol && rol && onCambiarRol) return <RolColaboradorRRHH rolActual={rol} onGuardar={(nuevo) => onCambiarRol(empleado.id, nuevo)} onCancelar={() => setEditandoRol(false)} />;
  if (vinculandoCuenta && onConsultarCorreo && onVincularCuenta) return <VincularCuentaRRHH empresaId={empleado.empresa_id} empleadoId={empleado.id} rol={rol} onConsultar={() => onConsultarCorreo(empleado.usuario_id)} onVincular={(correo) => rol ? onVincularCuenta(empleado.id, correo, rol) : Promise.resolve(null)} onVolver={() => setVinculandoCuenta(false)} />;
  if (editando && onEditarColaborador) return <EditarColaboradorRRHH empleado={empleado} empleados={todosEmpleados} departamentos={departamentos} onCancelar={() => setEditando(false)} onGuardar={async (datos) => { const exito = await onEditarColaborador(datos); if (exito) { setEditando(false); setMensaje('Ficha actualizada correctamente.'); } return exito; }} />;
  return <div className="space-y-4">
    <button
      type="button"
      onClick={onVolver}
      className="btn-pressable inline-flex min-h-[44px] items-center gap-2 rounded-xl px-3 text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 active:scale-[0.97] transition-colors"
    >
      <ArrowLeft aria-hidden="true" className="h-4 w-4 text-slate-500" /> Volver al directorio
    </button>
    <div role="region" aria-label={`Ficha de ${empleado.nombre}`} className="space-y-4">
    <section className="relative overflow-hidden space-y-5 rounded-3xl border border-slate-200/90 bg-white p-5 shadow-soft sm:p-6">
      <div aria-hidden="true" className="pointer-events-none absolute -top-12 inset-x-0 mx-auto h-24 w-11/12 rounded-full blur-3xl bg-fuchsia-400/30" />
      <div className="relative">
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3 min-w-0">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-fuchsia-200 bg-fuchsia-50 text-fuchsia-600 shadow-soft">
              <UserRound aria-hidden="true" className="h-6 w-6 stroke-[2.2]" />
            </span>
            <div className="min-w-0">
              <h2 className="text-lg font-bold tracking-tight text-slate-900 truncate">{empleado.nombre}</h2>
              <p className="text-xs sm:text-sm font-medium text-slate-500">Ficha del colaborador</p>
            </div>
          </div>
          <span
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
              empleado.activo
                ? 'border border-emerald-200/80 bg-emerald-50 text-emerald-800'
                : 'border border-slate-200 bg-slate-100 text-slate-600'
            }`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${empleado.activo ? 'bg-emerald-500' : 'bg-slate-400'}`} />
            {empleado.activo ? 'Activo' : 'Inactivo'}
          </span>
        </div>
        <div className="pt-4">
          <DatosEmpleado empleado={empleado} jefe={jefe} departamento={departamentoNombre(empleado, departamentos)} rol={rol} />
        </div>
        <div className="mt-5 space-y-3">
          {onEditarColaborador && (
            <button
              type="button"
              onClick={() => { setMensaje(''); setEditando(true); }}
              className="btn-pressable flex w-full min-h-[44px] items-center justify-center rounded-xl bg-[#57CCB7] px-4 text-sm font-bold text-slate-900 shadow-soft hover:bg-[#46bfa9] active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#57CCB7] transition-colors duration-150"
            >
              Editar ficha
            </button>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {empleado.activo && rol && onCambiarRol && (
              <button
                type="button"
                onClick={() => setEditandoRol(true)}
                className="btn-pressable flex min-h-[44px] items-center justify-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs sm:text-sm font-semibold text-slate-700 hover:border-[#57CCB7] hover:bg-slate-50/80 active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#57CCB7] transition-colors duration-150"
              >
                Cambiar rol
              </button>
            )}
            {onConsultarCorreo && onCambiarCorreo && (
              <button
                type="button"
                onClick={() => setEditandoCorreo(true)}
                className="btn-pressable flex min-h-[44px] items-center justify-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs sm:text-sm font-semibold text-slate-700 hover:border-[#57CCB7] hover:bg-slate-50/80 active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#57CCB7] transition-colors duration-150"
              >
                Cambiar correo
              </button>
            )}
            {empleado.activo && onConsultarCorreo && onVincularCuenta && (
              <button
                type="button"
                onClick={() => setVinculandoCuenta(true)}
                className="btn-pressable flex min-h-[44px] items-center justify-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs sm:text-sm font-semibold text-slate-700 hover:border-[#57CCB7] hover:bg-slate-50/80 active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#57CCB7] transition-colors duration-150"
              >
                Gestionar acceso
              </button>
            )}
          </div>
          {!empleado.activo && onReactivarColaborador && (
            <div className="border-t border-slate-100 pt-2">
              <button
                type="button"
                disabled={desactivando}
                onClick={() => void reactivar()}
                className="btn-pressable flex w-full min-h-[44px] items-center justify-center rounded-xl bg-[#57CCB7] px-4 text-sm font-bold text-slate-900 shadow-soft hover:bg-[#46bfa9] active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#57CCB7] disabled:opacity-60 transition-colors duration-150"
              >
                {desactivando ? 'Reactivando…' : 'Reactivar colaborador'}
              </button>
            </div>
          )}
          {empleado.activo && onDesactivarColaborador && !confirmar && (
            <div className="border-t border-slate-100 pt-2">
              <button
                type="button"
                onClick={() => { setMensaje(''); setConfirmar(true); }}
                className="btn-pressable flex w-full min-h-[44px] items-center justify-center rounded-xl border border-rose-200 bg-rose-50/50 px-4 text-xs sm:text-sm font-semibold text-rose-700 hover:bg-rose-100/70 active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600 transition-colors duration-150"
              >
                Desactivar colaborador
              </button>
            </div>
          )}
        </div>
        {confirmar && (
          <div role="group" aria-label="Confirmar desactivación" className="mt-5 rounded-2xl bg-rose-50/60 p-4 border border-rose-200/90">
            <p className="text-sm font-medium text-slate-800">
              El colaborador quedará inactivo y se conservará su historial. ¿Deseas continuar?
            </p>
            {error && (
              <p role="alert" className="mt-2 text-sm font-medium text-rose-700">
                No se pudo desactivar. Verifica la conexión y que la persona no sea administradora ni tenga colaboradores a cargo.
              </p>
            )}
            <div className="mt-3.5 flex flex-wrap gap-2.5">
              <button
                type="button"
                disabled={desactivando}
                onClick={() => void desactivar()}
                className="btn-pressable min-h-[44px] rounded-xl bg-rose-700 px-4 text-sm font-semibold text-white hover:bg-rose-800 active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600 disabled:opacity-60 transition-colors"
              >
                {desactivando ? 'Desactivando…' : 'Confirmar desactivación'}
              </button>
              <button
                type="button"
                disabled={desactivando}
                onClick={() => { setConfirmar(false); setError(false); }}
                className="btn-pressable min-h-[44px] rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400 disabled:opacity-60 transition-colors"
              >
                Cancelar desactivación
              </button>
            </div>
          </div>
        )}
        {errorReactivar && (
          <p role="alert" className="mt-3 text-sm font-medium text-rose-700">
            No se pudo reactivar. Verifica la conexión y que su jefe esté activo.
          </p>
        )}
      </div>
    </section>
    {mensaje && (
      <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50/80 px-4 py-2.5 text-sm font-semibold text-[#007055]">
        {mensaje}
      </p>
    )}
    {acreditando && saldo && onAcreditarSaldo ? <CreditoSaldoRRHH saldo={saldo} onCancelar={() => setAcreditando(false)} onGuardar={async (dias, motivo, operacion) => { const exito = await onAcreditarSaldo(saldo, dias, motivo, operacion); if (exito) { setAcreditando(false); setMensaje('Días acreditados correctamente.'); } return exito; }} /> :
      ajustando && saldo && onAjustarSaldo ? <AjusteSaldoRRHH saldo={saldo} onCancelar={() => setAjustando(false)} onGuardar={async (dias) => { const exito = await onAjustarSaldo(saldo, dias); if (exito) { setAjustando(false); setMensaje('Saldo actualizado correctamente.'); } return exito; }} /> :
      <SaldoEmpleado saldo={saldo} onAjustar={saldo && onAjustarSaldo ? () => { setMensaje(''); setAjustando(true); } : undefined} onAcreditar={saldo && onAcreditarSaldo ? () => { setMensaje(''); setAcreditando(true); } : undefined} />}
    </div>
  </div>;
}

export function DirectorioRRHH({ empleados, todosEmpleados = empleados, departamentos, saldos, usuarios = [], onLimpiarFiltros, onCambiarRol, onAjustarSaldo, onAcreditarSaldo, onCrearColaborador, onEditarColaborador, onDesactivarColaborador, onReactivarColaborador, onConsultarCorreo, onCambiarCorreo, onVincularCuenta }: Props) {
  const [seleccionado, setSeleccionado] = useState<string | null>(null);
  const [creando, setCreando] = useState(false);
  const empleado = todosEmpleados.find((item) => item.id === seleccionado);
  const rol = usuarios.find((item) => item.id === empleado?.usuario_id)?.rol as RolColaborador | undefined;
  if (creando && onCrearColaborador) return <FormularioColaboradorRRHH departamentos={departamentos} empleados={todosEmpleados} onGuardar={onCrearColaborador} onCancelar={() => setCreando(false)} />;
  if (empleado) return <FichaEmpleado empleado={empleado} todosEmpleados={todosEmpleados} departamentos={departamentos}
    saldo={saldos.find((item) => item.empleado_id === empleado.id)} rol={rol} onCambiarRol={onCambiarRol} onVolver={() => setSeleccionado(null)} onAjustarSaldo={onAjustarSaldo} onAcreditarSaldo={onAcreditarSaldo} onEditarColaborador={onEditarColaborador} onDesactivarColaborador={onDesactivarColaborador} onReactivarColaborador={onReactivarColaborador} onConsultarCorreo={onConsultarCorreo} onCambiarCorreo={onCambiarCorreo} onVincularCuenta={onVincularCuenta} />;
  return <section aria-label="Directorio de colaboradores" className="relative overflow-hidden rounded-3xl border border-slate-200/90 bg-white p-5 shadow-soft sm:p-6">
    <div aria-hidden="true" className="pointer-events-none absolute -top-12 inset-x-0 mx-auto h-24 w-11/12 rounded-full blur-3xl bg-fuchsia-400/30" />
    <div className="relative">
      <div className="flex items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3 min-w-0">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-fuchsia-200 bg-fuchsia-50 text-fuchsia-600">
            <Users aria-hidden="true" className="h-5 w-5 stroke-[2.2]" />
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold tracking-tight text-slate-900">Colaboradores</h2>
              <span aria-label={`${empleados.length} colaboradores`} className="shrink-0 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-700 tabular-nums">
                {empleados.length}
              </span>
            </div>
            <p className="mt-0.5 text-xs sm:text-sm text-slate-500 font-normal">Selecciona una persona para ver su ficha.</p>
          </div>
        </div>

        {onCrearColaborador && (
          <button
            type="button"
            onClick={() => setCreando(true)}
            aria-label="Nuevo colaborador"
            title="Nuevo colaborador"
            className="btn-pressable flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#57CCB7] text-slate-900 shadow-soft hover:bg-[#46bfa9] active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#57CCB7] transition-colors duration-150"
          >
            <UserPlus aria-hidden="true" className="h-5 w-5 stroke-[2.2]" />
          </button>
        )}
      </div>
      {!empleados.length ? <div className="py-8 text-center text-sm text-slate-600">
        <p>No se encontraron colaboradores con los filtros seleccionados.</p>
        {onLimpiarFiltros && <button type="button" onClick={onLimpiarFiltros} aria-label="Limpiar filtros del directorio"
          className="mt-2 min-h-11 rounded-xl px-4 font-semibold text-emerald-800 hover:bg-emerald-50 active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-700">Limpiar filtros</button>}
      </div> :
      <ul className="divide-y divide-slate-100">{empleados.map((item) => {
        const saldo = saldos.find((s) => s.empleado_id === item.id);
        return <li key={item.id}><button type="button" aria-label={`Ver ficha de ${item.nombre}`} onClick={() => setSeleccionado(item.id)}
          className="btn-pressable flex min-h-[60px] w-full items-center gap-3 rounded-xl py-4 text-left hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-800">{item.nombre.charAt(0)}</span>
          <span className="min-w-0 flex-1"><span className="block break-words text-sm font-bold text-slate-900">{item.nombre}</span>
            <span className="mt-1 block text-sm text-slate-600">{item.cargo} · {departamentoNombre(item, departamentos)}{!item.activo && ' · Inactivo'}</span></span>
          <span className="shrink-0 text-right text-xs font-semibold text-slate-700 tabular-nums">{saldo ? `${saldo.dias_pendientes} días` : 'Sin saldo'}</span>
          <ChevronRight aria-hidden="true" className="h-4 w-4 shrink-0 text-slate-500" />
        </button></li>;
      })}</ul>}
    </div>
  </section>;
}
