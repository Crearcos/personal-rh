import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Navbar } from './components/Navbar';
import { CambiarContrasena } from './components/CambiarContrasena';
import { RestablecerDemo } from './components/RestablecerDemo';
import { cambiarContrasenaCuenta } from './services/cambiarContrasenaCuenta';
import { NotificationModal, type NotificationPayload } from './components/NotificationModal';
import { EmployeeMobileView } from './views/EmployeeMobileView';
import { ManagerView } from './views/ManagerView';
import { AdminView } from './views/AdminView';
import { resolveEvaluationNivel } from './components/evaluationTheme';
import { guardarTareaOnboarding, eliminarTareaOnboarding } from './services/onboardingRepository';
import type { DatosTarea } from './services/onboardingValidacion';
import { ajustarSaldoRRHH, acreditarSaldoRRHH } from './services/saldoRRHHRepository';
import { guardarTipoSolicitud, cambiarEstadoTipoSolicitud } from './services/tiposSolicitudRepository';
import { guardarCriteriosRRHH } from './services/criteriosRRHHRepository';
import { fetchPeriodosRRHH, crearPeriodoRRHH, cambiarEstadoPeriodoRRHH } from './services/periodosRRHHRepository';
import { resolverSesionDemo, resolverSesionIndividual } from './services/sesionDemo';
import type { AccesoAutorizado } from './services/accesoDemo';
import { crearColaboradorRRHH, editarColaboradorRRHH, desactivarColaboradorRRHH } from './services/colaboradorRRHHRepository';
import { cambiarCorreoColaboradorRRHH, consultarCorreoColaboradorRRHH, reactivarColaboradorRRHH } from './services/correoYReactivacionRepository';
import { vincularCuentaRRHH } from './services/vincularCuentaRRHH';
import { cambiarRolColaborador } from './services/rolesColaboradorRRHH';
import type { DatosEmpleadoRRHH, DatosEdicionColaborador, RolColaborador } from './services/gestionRRHHValidation';
import {
  fetchEmpresas,
  fetchUsuariosPorEmpresa,
  fetchDepartamentos,
  fetchEmpleados,
  fetchTiposSolicitud,
  fetchSaldos,
  fetchSolicitudes,
  fetchCriterios,
  fetchEvaluaciones,
  fetchOnboardingTareas,
  fetchRegistroActividad,
  insertSolicitud,
  resolveSolicitud,
  insertEvaluacion,
  toggleOnboardingEstado,
} from './services/repository';
import type {
  Empresa,
  Usuario,
  Departamento,
  Empleado,
  TipoSolicitud,
  SaldoVacaciones,
  Solicitud,
  CriterioEvaluacion,
  Evaluacion,
  OnboardingTarea,
  RegistroActividad,
  UserRole,
  DemoUserSession,
  DatosTipoSolicitud,
  CriterioConfig,
  PeriodoEvaluacion,
  DatosPeriodoEvaluacion,
} from './types/models';

interface AppProps { empresasAutorizadas?: string[]; accesos?: AccesoAutorizado[]; onCerrarSesion?: () => Promise<void> }

export const App: React.FC<AppProps> = ({ empresasAutorizadas, accesos, onCerrarSesion }) => {
  const [selectedEmpresaId, setSelectedEmpresaId] = useState<string>(() => empresasAutorizadas?.includes('emp_andes') ? 'emp_andes' : empresasAutorizadas?.[0] || 'emp_andes');
  const [rolDemo, setCurrentRole] = useState<UserRole>('jefe');
  const accesoActual = accesos?.find((a) => a.empresa_id === selectedEmpresaId && a.rol === 'admin')
    ?? accesos?.find((a) => a.empresa_id === selectedEmpresaId);
  const permitirCambioRol = !accesos || accesoActual?.rol === 'admin';
  const currentRole: UserRole = permitirCambioRol ? rolDemo : accesoActual?.rol ?? 'empleado';
  const [notification, setNotification] = useState<NotificationPayload | null>(null);
  const [cambiandoContrasena, setCambiandoContrasena] = useState(false);
  const [restablecimientoAbierto, setRestablecimientoAbierto] = useState(false);

  // Estados de datos
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [empresaCargada, setEmpresaCargada] = useState('');
  const [errorIdentidad, setErrorIdentidad] = useState(false);
  const [empleadosRRHH, setEmpleadosRRHH] = useState<Empleado[]>([]);
  const [tiposSolicitud, setTiposSolicitud] = useState<TipoSolicitud[]>([]);
  const [saldos, setSaldos] = useState<SaldoVacaciones[]>([]);
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [criterios, setCriterios] = useState<CriterioEvaluacion[]>([]);
  const [evaluaciones, setEvaluaciones] = useState<Evaluacion[]>([]);
  const [periodos, setPeriodos] = useState<PeriodoEvaluacion[]>([]);
  const [onboardingTareas, setOnboardingTareas] = useState<OnboardingTarea[]>([]);
  const [actividades, setActividades] = useState<RegistroActividad[]>([]);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorPanelRRHH, setErrorPanelRRHH] = useState(false);
  const [errorDirectorioRRHH, setErrorDirectorioRRHH] = useState(false);
  const [errorOnboardingRRHH, setErrorOnboardingRRHH] = useState(false);
  const [errorAuditoriaRRHH, setErrorAuditoriaRRHH] = useState(false);
  const [errorPeriodos, setErrorPeriodos] = useState(false);
  const cargaActual = useRef(0);
  const empresaActual = useRef(selectedEmpresaId);
  empresaActual.current = selectedEmpresaId;

  // Sesión activa según el rol seleccionado
  const sesionDemo = empresaCargada !== selectedEmpresaId ? null : permitirCambioRol
    ? resolverSesionDemo(selectedEmpresaId, currentRole, usuarios, empleados)
    : accesoActual?.empleado_id ? resolverSesionIndividual(selectedEmpresaId, currentRole, accesoActual.empleado_id, usuarios, empleados) : null;
  const activeSession: DemoUserSession = sesionDemo ?? { usuarioId: '', empleadoId: '', nombre: '', correo: '', cargo: '', rol: currentRole, empresaId: selectedEmpresaId };

  // Carga reactiva de datos por empresa
  const loadAppData = useCallback(async (empresaId: string) => {
    const cargaId = ++cargaActual.current;
    setIsLoading(true);
    setErrorPanelRRHH(false);
    setErrorDirectorioRRHH(false);
    setErrorOnboardingRRHH(false);
    setErrorAuditoriaRRHH(false);
    setErrorPeriodos(false);
    setErrorIdentidad(false);
    try {
      const [
        resEmpresas,
        resUsuarios,
        resDeptos,
        resEmpleados,
        resTipos,
        resSaldos,
        resSolicitudes,
        resCriterios,
        resEvaluaciones,
        resPeriodos,
        resOnboarding,
        resActividades,
      ] = await Promise.all([
        fetchEmpresas(),
        fetchUsuariosPorEmpresa(empresaId),
        fetchDepartamentos(empresaId),
        fetchEmpleados(empresaId, currentRole === 'admin'),
        fetchTiposSolicitud(empresaId),
        fetchSaldos(empresaId),
        fetchSolicitudes(empresaId),
        fetchCriterios(empresaId),
        fetchEvaluaciones(empresaId),
        fetchPeriodosRRHH(empresaId),
        fetchOnboardingTareas(empresaId),
        fetchRegistroActividad(empresaId),
      ]);

      if (cargaId !== cargaActual.current) return;

      setErrorPanelRRHH([resDeptos, resEmpleados, resTipos, resSolicitudes, resCriterios, resEvaluaciones].some((res) => !res.success));
      setErrorDirectorioRRHH([resDeptos, resEmpleados, resSaldos].some((res) => !res.success));
      setErrorOnboardingRRHH([resDeptos, resEmpleados, resOnboarding].some((res) => !res.success));
      setErrorAuditoriaRRHH([resEmpleados, resActividades].some((res) => !res.success));
      setErrorPeriodos(!resPeriodos.success);
      setErrorIdentidad(!resUsuarios.success || !resEmpleados.success);
      setUsuarios(resUsuarios.data || []);
      setEmpresaCargada(empresaId);

      if (resEmpresas.data) setEmpresas(empresasAutorizadas ? resEmpresas.data.filter((empresa) => empresasAutorizadas.includes(empresa.id)) : resEmpresas.data);
      if (resDeptos.data) setDepartamentos(resDeptos.data);
      if (resEmpleados.data) {
        setEmpleados(resEmpleados.data.filter((empleado) => empleado.activo));
        setEmpleadosRRHH(currentRole === 'admin' ? resEmpleados.data : []);
      }
      if (resTipos.data) setTiposSolicitud(resTipos.data);
      if (resSaldos.data) setSaldos(resSaldos.data);
      if (resSolicitudes.data) setSolicitudes(resSolicitudes.data);
      if (resCriterios.data) setCriterios(resCriterios.data);
      if (resEvaluaciones.data) setEvaluaciones(resEvaluaciones.data);
      if (resPeriodos.data) setPeriodos(resPeriodos.data);
      if (resOnboarding.data) setOnboardingTareas(resOnboarding.data);
      if (resActividades.data) setActividades(resActividades.data);
    } catch (err) {
      if (cargaId !== cargaActual.current) return;
      setErrorPanelRRHH(true);
      setErrorDirectorioRRHH(true);
      setErrorOnboardingRRHH(true);
      setErrorAuditoriaRRHH(true);
      setErrorPeriodos(true);
      setErrorIdentidad(true);
      console.error('Error al cargar datos de PersonalHR:', err);
    } finally {
      if (cargaId === cargaActual.current) setIsLoading(false);
    }
  }, [currentRole, empresasAutorizadas]);

  useEffect(() => {
    loadAppData(selectedEmpresaId);
  }, [selectedEmpresaId, loadAppData]);

  // Saldo del usuario en sesión
  const currentSaldo =
    saldos.find((s) => s.empleado_id === activeSession.empleadoId) || null;

  // Manejo de envío de solicitud (Empleado)
  const handleSubmitSolicitud = async (
    tipoId: string,
    desde: string,
    hasta: string,
    motivo: string
  ): Promise<boolean | string> => {
    const fDesde = new Date(desde);
    const fHasta = new Date(hasta);
    const diffDays = Math.ceil((fHasta.getTime() - fDesde.getTime()) / (1000 * 3600 * 24)) + 1;

    const nuevaSol = {
      id: `sol_${Date.now()}`,
      empresa_id: selectedEmpresaId,
      empleado_id: activeSession.empleadoId,
      tipo_id: tipoId,
      fecha_desde: desde,
      fecha_hasta: hasta,
      dias: diffDays,
      motivo,
      estado: 'pendiente' as const,
      aprobador_id: null,
      fecha_resolucion: null,
      comentario: null,
    };

    const res = await insertSolicitud(nuevaSol);
    if (res.success && res.data) {
      // Disparar Notificación Simulada por WhatsApp
      setNotification({
        tipo: 'whatsapp',
        destinatario: activeSession.nombre,
        telefonoOCorreo: '+593 99 876 5432',
        titulo: 'Solicitud Registrada Exitosamente',
        mensaje: `Hola ${activeSession.nombre}, hemos recibido tu solicitud por ${diffDays} días (${desde} al ${hasta}). Se ha registrado para su revisión.`,
        detalleTecnico: `ID: ${nuevaSol.id} | Empresa: ${selectedEmpresaId}`,
      });

      // Recargar solicitudes y actividades
      const [updSol, updAct] = await Promise.all([
        fetchSolicitudes(selectedEmpresaId),
        fetchRegistroActividad(selectedEmpresaId),
      ]);
      if (updSol.data) setSolicitudes(updSol.data);
      if (updAct.data) setActividades(updAct.data);
      return true;
    }
    return res.error || 'No se pudo registrar la solicitud. Inténtalo nuevamente.';
  };

  // Manejo de resolución de solicitud (Jefe / Manager)
  const handleResolveSolicitud = async (
    solicitudId: string,
    accion: 'aprobada' | 'rechazada',
    comentario: string
  ): Promise<string | null> => {
    const sol = solicitudes.find((s) => s.id === solicitudId);

    const res = await resolveSolicitud(
      solicitudId,
      selectedEmpresaId,
      accion,
      activeSession.empleadoId,
      comentario
    );

    if (res.success) {
      // Notificación al colaborador vía WhatsApp
      const empleadoDestino = empleados.find((e) => e.id === sol?.empleado_id);
      setNotification({
        tipo: 'whatsapp',
        destinatario: empleadoDestino?.nombre || 'Colaborador',
        telefonoOCorreo: '+593 99 123 4567',
        titulo: `Solicitud de Vacaciones ${accion === 'aprobada' ? 'Aprobada ✅' : 'Rechazada ❌'}`,
        mensaje: `Estimado(a) ${empleadoDestino?.nombre || ''}, tu solicitud #${solicitudId} ha sido ${accion.toUpperCase()} por ${activeSession.nombre}.\n\nComentarios: "${comentario}".\nTus días han sido actualizados en el sistema.`,
        detalleTecnico: `Audit: ${res.data?.id} | Estado: ${accion} | Resolutor: ${activeSession.usuarioId}`,
      });

      // Recargar solicitudes, saldos y actividad
      const [updSol, updSaldos, updAct] = await Promise.all([
        fetchSolicitudes(selectedEmpresaId),
        fetchSaldos(selectedEmpresaId),
        fetchRegistroActividad(selectedEmpresaId),
      ]);
      if (updSol.data) setSolicitudes(updSol.data);
      if (updSaldos.data) setSaldos(updSaldos.data);
      if (updAct.data) setActividades(updAct.data);
      return null;
    }
    return res.error || 'No se pudo resolver la solicitud. Inténtalo nuevamente.';
  };

  // Manejo de envío de evaluación de desempeño
  const handleSubmitEvaluacion = async (
    empleadoId: string,
    periodo: string,
    puntajeTotal: number,
    respuestas: { criterio_id: string; puntaje: number; comentario: string }[]
  ): Promise<boolean> => {
    const evalId = `eval_${Date.now()}`;
    const nivel = resolveEvaluationNivel(puntajeTotal);

    const nuevaEval = {
      id: evalId,
      empresa_id: selectedEmpresaId,
      empleado_id: empleadoId,
      evaluador_id: activeSession.empleadoId,
      periodo,
      puntaje_total: puntajeTotal,
      estado: 'cerrada',
      comentarios: `Evaluación de desempeño completada. Desempeño clasificado como ${nivel}.`,
    };

    const res = await insertEvaluacion(nuevaEval, respuestas);
    if (res.success) {
      void actualizarActividad(selectedEmpresaId);
      const evalResp = await fetchEvaluaciones(selectedEmpresaId);
      if (evalResp.data) setEvaluaciones(evalResp.data);

      const emp = empleados.find((e) => e.id === empleadoId);
      const emailSimulado = emp
        ? `${emp.nombre.toLowerCase().replace(/\s+/g, '.')}@andes.ec`
        : 'colaborador@andes.ec';

      setNotification({
        tipo: 'email',
        destinatario: emp?.nombre || 'Colaborador',
        telefonoOCorreo: emailSimulado,
        titulo: 'Nueva Evaluación de Desempeño Registrada',
        mensaje: `Hola ${emp?.nombre},\nTu evaluación de desempeño para el ciclo ${periodo} ha sido completada con un puntaje de ${puntajeTotal}/100 (${nivel}).`,
        detalleTecnico: `Evaluación ID: ${evalId} | Evaluador: ${activeSession.usuarioId}`,
      });
      return true;
    }
    return false;
  };

  const actualizarActividad = async (empresaId: string): Promise<void> => {
    const resultado = await fetchRegistroActividad(empresaId);
    if (empresaActual.current !== empresaId) return;
    setErrorAuditoriaRRHH(!resultado.success);
    if (resultado.data) setActividades(resultado.data);
  };

  // Manejo de cambio de estado de tareas de onboarding
  const handleToggleTarea = async (
    tareaId: string,
    nuevoEstado: 'pendiente' | 'en_progreso' | 'completada'
  ): Promise<boolean> => {
    const empresaId = selectedEmpresaId;
    const res = await toggleOnboardingEstado(tareaId, empresaId, nuevoEstado);
    if (res.success) {
      void actualizarActividad(empresaId);
      const upd = await fetchOnboardingTareas(empresaId);
      if (upd.data && empresaActual.current === empresaId) setOnboardingTareas(upd.data);
      return upd.success;
    }
    return false;
  };

  const handleGuardarTarea = async (datos: DatosTarea): Promise<boolean> => {
    const empresaId = selectedEmpresaId;
    const resultado = await guardarTareaOnboarding(empresaId, datos);
    if (!resultado.success || !resultado.data) return false;
    void actualizarActividad(empresaId);
    const tarea = resultado.data;
    if (empresaActual.current === empresaId) {
      setOnboardingTareas((actuales) => [...actuales.filter((actual) => actual.id !== tarea.id), tarea].sort((a, b) => a.fecha_limite.localeCompare(b.fecha_limite)));
    }
    return true;
  };

  const handleEliminarTarea = async (tareaId: string, empleadoId: string): Promise<boolean> => {
    const empresaId = selectedEmpresaId;
    const resultado = await eliminarTareaOnboarding(empresaId, empleadoId, tareaId);
    if (!resultado.success) return false;
    void actualizarActividad(empresaId);
    if (empresaActual.current === empresaId) setOnboardingTareas((actuales) => actuales.filter((tarea) => tarea.id !== tareaId));
    return true;
  };

  const handleAjustarSaldo = async (saldo: SaldoVacaciones, dias: number): Promise<boolean> => {
    const empresaId = selectedEmpresaId;
    const resultado = await ajustarSaldoRRHH(empresaId, saldo, dias);
    if (!resultado.success || !resultado.data) return false;
    const actualizado = resultado.data;
    if (empresaActual.current === empresaId) setSaldos((actuales) => actuales.map((item) => item.id === actualizado.id ? actualizado : item));
    void actualizarActividad(empresaId);
    return true;
  };

  const handleAcreditarSaldo = async (saldo: SaldoVacaciones, dias: number, motivo: string, operacion: string): Promise<boolean> => {
    const empresaId = selectedEmpresaId;
    const resultado = await acreditarSaldoRRHH(empresaId, saldo, dias, motivo, operacion);
    if (!resultado.success || !resultado.data) return false;
    const actualizado = resultado.data;
    if (empresaActual.current === empresaId) setSaldos((actuales) => actuales.map((item) => item.id === actualizado.id ? actualizado : item));
    void actualizarActividad(empresaId);
    return true;
  };

  const handleCrearColaborador = async (datos: DatosEmpleadoRRHH): Promise<boolean> => {
    const empresaId = selectedEmpresaId;
    const resultado = await crearColaboradorRRHH(empresaId, datos);
    if (!resultado.success || !resultado.data) return false;
    const creado = resultado.data;
    if (empresaActual.current === empresaId) {
      setEmpleadosRRHH((actuales) => [...actuales, creado]);
      setEmpleados((actuales) => [...actuales, creado]);
      const usuariosActualizados = await fetchUsuariosPorEmpresa(empresaId);
      if (empresaActual.current === empresaId && usuariosActualizados.data) setUsuarios(usuariosActualizados.data);
      const saldosActualizados = await fetchSaldos(empresaId, new Date().getFullYear());
      if (empresaActual.current === empresaId && saldosActualizados.data) setSaldos(saldosActualizados.data);
    }
    void actualizarActividad(empresaId);
    return true;
  };

  const handleCambiarRol = async (empleadoId: string, rol: RolColaborador): Promise<boolean> => {
    const empresaId = selectedEmpresaId;
    if (!await cambiarRolColaborador(empresaId, empleadoId, rol)) return false;
    if (empresaActual.current === empresaId) {
      const colaborador = empleadosRRHH.find((item) => item.id === empleadoId);
      if (colaborador) setUsuarios((actuales) => actuales.map((item) => item.id === colaborador.usuario_id ? { ...item, rol } : item));
    }
    void actualizarActividad(empresaId);
    return true;
  };

  const actualizarColaboradorLocal = (empresaId: string, empleado: Empleado) => {
    if (empresaActual.current !== empresaId) return;
    setEmpleadosRRHH((actuales) => actuales.map((item) => item.id === empleado.id ? empleado : item));
    setEmpleados((actuales) => {
      const restantes = actuales.filter((item) => item.id !== empleado.id);
      return empleado.activo ? [...restantes, empleado] : restantes;
    });
  };

  const handleEditarColaborador = async (datos: DatosEdicionColaborador): Promise<boolean> => {
    const empresaId = selectedEmpresaId;
    const resultado = await editarColaboradorRRHH(empresaId, datos);
    if (!resultado.success || !resultado.data) return false;
    actualizarColaboradorLocal(empresaId, resultado.data);
    void actualizarActividad(empresaId);
    return true;
  };

  const handleDesactivarColaborador = async (id: string): Promise<boolean> => {
    const empresaId = selectedEmpresaId;
    const resultado = await desactivarColaboradorRRHH(empresaId, id);
    if (!resultado.success || !resultado.data) return false;
    actualizarColaboradorLocal(empresaId, resultado.data);
    void actualizarActividad(empresaId);
    return true;
  };

  const handleReactivarColaborador = async (id: string): Promise<boolean> => {
    const empresaId = selectedEmpresaId;
    const resultado = await reactivarColaboradorRRHH(empresaId, id);
    if (!resultado.success || !resultado.data) return false;
    actualizarColaboradorLocal(empresaId, resultado.data);
    const usuariosActualizados = await fetchUsuariosPorEmpresa(empresaId);
    if (empresaActual.current === empresaId && usuariosActualizados.data) setUsuarios(usuariosActualizados.data);
    void actualizarActividad(empresaId);
    return true;
  };

  const handleCambiarCorreo = async (id: string, correo: string): Promise<boolean> => {
    const empresaId = selectedEmpresaId;
    const resultado = await cambiarCorreoColaboradorRRHH(empresaId, id, correo);
    if (!resultado.success) return false;
    void actualizarActividad(empresaId);
    return true;
  };

  const actualizarTipoLocal = (empresaId: string, tipo: TipoSolicitud) => {
    if (empresaActual.current !== empresaId) return;
    setTiposSolicitud((actuales) => [...actuales.filter((item) => item.id !== tipo.id), tipo].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es')));
    void actualizarActividad(empresaId);
  };

  const handleGuardarTipo = async (datos: DatosTipoSolicitud): Promise<boolean> => {
    const empresaId = selectedEmpresaId;
    const resultado = await guardarTipoSolicitud(empresaId, datos);
    if (!resultado.success || !resultado.data) return false;
    actualizarTipoLocal(empresaId, resultado.data);
    return true;
  };

  const handleCambiarEstadoTipo = async (id: string, activo: boolean): Promise<boolean> => {
    const empresaId = selectedEmpresaId;
    const resultado = await cambiarEstadoTipoSolicitud(empresaId, id, activo);
    if (!resultado.success || !resultado.data) return false;
    actualizarTipoLocal(empresaId, resultado.data);
    return true;
  };

  const handleGuardarCriterios = async (datos: CriterioConfig[]): Promise<boolean> => {
    const empresaId = selectedEmpresaId;
    const resultado = await guardarCriteriosRRHH(empresaId, datos);
    if (!resultado.success || !resultado.data) return false;
    if (empresaActual.current === empresaId) {
      const recarga = await fetchCriterios(empresaId);
      if (empresaActual.current === empresaId && recarga.data) setCriterios(recarga.data);
      if (empresaActual.current === empresaId && !recarga.success) setErrorPanelRRHH(true);
    }
    void actualizarActividad(empresaId);
    return true;
  };

  const actualizarPeriodoLocal = (empresaId: string, periodo: PeriodoEvaluacion) => {
    if (empresaActual.current !== empresaId) return;
    setPeriodos((actuales) => [...actuales.filter((item) => item.id !== periodo.id), periodo].sort((a, b) => b.nombre.localeCompare(a.nombre, 'es')));
    void actualizarActividad(empresaId);
  };

  const handleCrearPeriodo = async (datos: DatosPeriodoEvaluacion): Promise<boolean> => {
    const empresaId = selectedEmpresaId;
    const resultado = await crearPeriodoRRHH(empresaId, datos);
    if (!resultado.success || !resultado.data) return false;
    actualizarPeriodoLocal(empresaId, resultado.data);
    return true;
  };

  const handleCambiarEstadoPeriodo = async (id: string, estado: 'abierto' | 'cerrado'): Promise<boolean> => {
    const empresaId = selectedEmpresaId;
    const resultado = await cambiarEstadoPeriodoRRHH(empresaId, id, estado);
    if (!resultado.success || !resultado.data) return false;
    actualizarPeriodoLocal(empresaId, resultado.data);
    return true;
  };

  const handleResetDemo = async (): Promise<void> => { setRestablecimientoAbierto(true); };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col antialiased overflow-x-clip">
      {/* Barra de Navegación Principal */}
      <Navbar
        currentRole={currentRole}
        permitirCambioRol={permitirCambioRol}
        onRoleChange={setCurrentRole}
        empresas={empresas}
        selectedEmpresaId={selectedEmpresaId}
        onEmpresaChange={setSelectedEmpresaId}
        activeSession={activeSession}
        onCerrarSesion={onCerrarSesion}
        onCambiarContrasena={onCerrarSesion ? () => setCambiandoContrasena(true) : undefined}
        onResetDemo={handleResetDemo}
        isResetting={false}
      />
      {restablecimientoAbierto && currentRole === 'admin' && <RestablecerDemo
        key={selectedEmpresaId}
        empresaId={selectedEmpresaId}
        nombreEmpresa={empresas.find((empresa) => empresa.id === selectedEmpresaId)?.nombre || 'PersonalHR'}
        onCerrar={() => setRestablecimientoAbierto(false)}
        onCompletado={() => { if (empresaActual.current === selectedEmpresaId) void loadAppData(selectedEmpresaId); }}
      />}

      {/* Contenido Principal */}
      <main className="flex-1 pb-24 sm:pb-16">
        {cambiandoContrasena ? <CambiarContrasena onGuardar={cambiarContrasenaCuenta} onVolver={() => setCambiandoContrasena(false)} /> : isLoading ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-3">
            <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-medium text-slate-500">
              Conectando con Supabase y cargando datos...
            </p>
          </div>
        ) : !sesionDemo ? (
          <section className="mx-auto mt-8 max-w-xl rounded-2xl border border-slate-200 bg-white p-6 text-slate-800 shadow-soft" role={errorIdentidad ? 'alert' : undefined}>
            <h1 className="text-lg font-bold tracking-tight">{errorIdentidad ? 'No pudimos cargar tu identidad' : permitirCambioRol ? 'Vista de demostración no disponible' : 'Cuenta no disponible'}</h1>
            <p className="mt-2 text-sm text-slate-600">{errorIdentidad ? 'Comprueba tu conexión e inténtalo nuevamente.' : permitirCambioRol ? `Esta empresa no tiene una persona activa asignada al rol ${currentRole === 'jefe' ? 'de jefe' : currentRole === 'empleado' ? 'de empleado' : 'de RR. HH.'}.` : 'Tu perfil no está activo o no coincide con tu acceso. Contacta con RR. HH.'}</p>
            {errorIdentidad && <button type="button" onClick={() => { void loadAppData(selectedEmpresaId); }} className="mt-4 min-h-11 rounded-xl border border-slate-300 px-4 text-sm font-semibold">Reintentar</button>}
          </section>
        ) : (
          <>
            {currentRole === 'empleado' && (
              <EmployeeMobileView
                session={activeSession}
                nombreDepartamento={departamentos.find((item) => item.id === activeSession.departamentoId)?.nombre}
                saldo={currentSaldo}
                solicitudes={solicitudes}
                tiposSolicitud={tiposSolicitud}
                onboardingTareas={onboardingTareas.filter(
                  (t) => t.empleado_id === activeSession.empleadoId
                )}
                evaluaciones={evaluaciones}
                criterios={criterios}
                onSubmitSolicitud={handleSubmitSolicitud}
                onToggleTarea={handleToggleTarea}
              />
            )}

            {currentRole === 'jefe' && (
              <ManagerView
                session={activeSession}
                solicitudes={solicitudes}
                empleados={empleados}
                departamentos={departamentos}
                tiposSolicitud={tiposSolicitud}
                criterios={criterios.filter((criterio) => criterio.activo !== false)}
                periodos={periodos}
                errorPeriodos={errorPeriodos}
                onReintentarPeriodos={() => { void loadAppData(selectedEmpresaId); }}
                evaluaciones={evaluaciones}
                onResolveSolicitud={handleResolveSolicitud}
                onSubmitEvaluacion={handleSubmitEvaluacion}
              />
            )}

            {currentRole === 'admin' && (
              <AdminView
                session={activeSession}
                usuarios={usuarios}
                onCambiarRol={handleCambiarRol}
                empleados={empleadosRRHH}
                departamentos={departamentos}
                solicitudes={solicitudes}
                saldos={saldos}
                evaluaciones={evaluaciones}
                onboardingTareas={onboardingTareas}
                actividades={actividades}
                tiposSolicitud={tiposSolicitud}
                criterios={criterios}
                periodos={periodos}
                errorPanel={errorPanelRRHH}
                errorPeriodos={errorPeriodos}
                errorDirectorio={errorDirectorioRRHH}
                errorOnboarding={errorOnboardingRRHH}
                errorAuditoria={errorAuditoriaRRHH}
                nombreEmpresa={empresas.find((empresa) => empresa.id === selectedEmpresaId)?.nombre || 'PersonalHR'}
                onReintentarPanel={() => { void loadAppData(selectedEmpresaId); }}
                onResetDemo={handleResetDemo}
                isResetting={false}
                onToggleTarea={handleToggleTarea}
                onGuardarTarea={handleGuardarTarea}
                onEliminarTarea={handleEliminarTarea}
                onAjustarSaldo={handleAjustarSaldo}
                onAcreditarSaldo={handleAcreditarSaldo}
                onCrearColaborador={handleCrearColaborador}
                onEditarColaborador={handleEditarColaborador}
                onDesactivarColaborador={handleDesactivarColaborador}
                onReactivarColaborador={handleReactivarColaborador}
                onConsultarCorreo={(usuarioId) => consultarCorreoColaboradorRRHH(selectedEmpresaId, usuarioId)}
                onVincularCuenta={async (id, correo, rol) => {
                  const empresaId = selectedEmpresaId;
                  const resultado = await vincularCuentaRRHH(empresaId, id, correo, rol);
                  if (resultado === 'vinculada') void actualizarActividad(empresaId);
                  return resultado;
                }}
                onCambiarCorreo={handleCambiarCorreo}
                onGuardarTipo={handleGuardarTipo}
                onCambiarEstadoTipo={handleCambiarEstadoTipo}
                onGuardarCriterios={handleGuardarCriterios}
                onCrearPeriodo={handleCrearPeriodo}
                onCambiarEstadoPeriodo={handleCambiarEstadoPeriodo}
              />
            )}
          </>
        )}
      </main>

      {/* Modal de Notificación Simulada (WhatsApp / Email) */}
      <NotificationModal
        notification={notification}
        onClose={() => setNotification(null)}
      />
    </div>
  );
};
export default App;
