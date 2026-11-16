import type { Database } from './database.types';

export type UserRole = 'admin' | 'jefe' | 'empleado';

export type Empresa = Database['public']['Tables']['empresas']['Row'];
export type Usuario = Database['public']['Tables']['usuarios']['Row'];
export type Departamento = Database['public']['Tables']['departamentos']['Row'];
export type Empleado = Database['public']['Tables']['empleados']['Row'];
export type TipoSolicitud = Database['public']['Tables']['tipos_solicitud']['Row'];
export type Solicitud = Database['public']['Tables']['solicitudes']['Row'];
export type SaldoVacaciones = Database['public']['Tables']['saldos_vacaciones']['Row'];
export type CriterioEvaluacion = Database['public']['Tables']['criterios_evaluacion']['Row'];
export type Evaluacion = Database['public']['Tables']['evaluaciones']['Row'];
export type RespuestaEvaluacion = Database['public']['Tables']['respuestas_evaluacion']['Row'];
export type OnboardingTarea = Database['public']['Tables']['onboarding_tareas']['Row'];
export type RegistroActividad = Database['public']['Tables']['registro_actividad']['Row'];
export type PeriodoEvaluacion = Database['public']['Tables']['periodos_evaluacion']['Row'];

export interface DatosTipoSolicitud { id?: string; nombre: string; descuentaSaldo: boolean }
export interface CriterioConfig { nombre: string; peso: number }
export interface DatosPeriodoEvaluacion { nombre: string; fechaInicio: string; fechaFin: string }

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  meta?: {
    total?: number;
    timestamp?: string;
  };
}

export interface DemoUserSession {
  usuarioId: string;
  empleadoId: string;
  nombre: string;
  correo: string;
  cargo: string;
  rol: UserRole;
  empresaId: string;
  departamentoId?: string | null;
}

export interface SolicitudValidationResult {
  isValid: boolean;
  diasCalculados: number;
  diasDisponibles: number;
  errorMessage?: string;
}

export interface EvaluacionScoreSummary {
  puntajeTotal: number;
  desempenoNivel: 'Excelente' | 'Bueno' | 'Regular' | 'Bajo';
}

