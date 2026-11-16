export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      accesos_empresa: {
        Row: { auth_user_id: string; empresa_id: string; rol: string; empleado_id: string | null }
        Insert: { auth_user_id: string; empresa_id: string; rol: string; empleado_id?: string | null }
        Update: { auth_user_id?: string; empresa_id?: string; rol?: string; empleado_id?: string | null }
        Relationships: []
      }
      periodos_evaluacion: {
        Row: { id: string; empresa_id: string; nombre: string; fecha_inicio: string | null; fecha_fin: string | null; estado: string; created_at: string }
        Insert: { id: string; empresa_id: string; nombre: string; fecha_inicio?: string | null; fecha_fin?: string | null; estado?: string; created_at?: string }
        Update: { id?: string; empresa_id?: string; nombre?: string; fecha_inicio?: string | null; fecha_fin?: string | null; estado?: string; created_at?: string }
        Relationships: []
      }
      criterios_evaluacion: {
        Row: {
          activo: boolean
          created_at: string
          empresa_id: string
          id: string
          nombre: string
          peso: number
        }
        Insert: {
          activo?: boolean
          created_at?: string
          empresa_id: string
          id: string
          nombre: string
          peso?: number
        }
        Update: {
          activo?: boolean
          created_at?: string
          empresa_id?: string
          id?: string
          nombre?: string
          peso?: number
        }
        Relationships: []
      }
      departamentos: {
        Row: {
          created_at: string
          empresa_id: string
          id: string
          jefe_id: string | null
          nombre: string
        }
        Insert: {
          created_at?: string
          empresa_id: string
          id: string
          jefe_id?: string | null
          nombre: string
        }
        Update: {
          created_at?: string
          empresa_id?: string
          id?: string
          jefe_id?: string | null
          nombre?: string
        }
        Relationships: []
      }
      empleados: {
        Row: {
          activo: boolean
          cargo: string
          created_at: string
          departamento_id: string | null
          empresa_id: string
          fecha_ingreso: string
          id: string
          jefe_id: string | null
          nombre: string
          tipo_contrato: string
          usuario_id: string
        }
        Insert: {
          activo?: boolean
          cargo: string
          created_at?: string
          departamento_id?: string | null
          empresa_id: string
          fecha_ingreso: string
          id: string
          jefe_id?: string | null
          nombre: string
          tipo_contrato?: string
          usuario_id: string
        }
        Update: {
          activo?: boolean
          cargo?: string
          created_at?: string
          departamento_id?: string | null
          empresa_id?: string
          fecha_ingreso?: string
          id?: string
          jefe_id?: string | null
          nombre?: string
          tipo_contrato?: string
          usuario_id?: string
        }
        Relationships: []
      }
      empresas: {
        Row: {
          ciudad: string
          created_at: string
          id: string
          nombre: string
        }
        Insert: {
          ciudad: string
          created_at?: string
          id: string
          nombre: string
        }
        Update: {
          ciudad?: string
          created_at?: string
          id?: string
          nombre?: string
        }
        Relationships: []
      }
      evaluaciones: {
        Row: {
          comentarios: string | null
          created_at: string
          empleado_id: string
          empresa_id: string
          estado: string
          evaluador_id: string | null
          id: string
          periodo: string
          puntaje_total: number | null
        }
        Insert: {
          comentarios?: string | null
          created_at?: string
          empleado_id: string
          empresa_id: string
          estado?: string
          evaluador_id?: string | null
          id: string
          periodo: string
          puntaje_total?: number | null
        }
        Update: {
          comentarios?: string | null
          created_at?: string
          empleado_id?: string
          empresa_id?: string
          estado?: string
          evaluador_id?: string | null
          id?: string
          periodo?: string
          puntaje_total?: number | null
        }
        Relationships: []
      }
      onboarding_tareas: {
        Row: {
          created_at: string
          empleado_id: string
          empresa_id: string
          estado: string
          fecha_limite: string
          id: string
          responsable: string
          tarea: string
        }
        Insert: {
          created_at?: string
          empleado_id: string
          empresa_id: string
          estado?: string
          fecha_limite: string
          id: string
          responsable: string
          tarea: string
        }
        Update: {
          created_at?: string
          empleado_id?: string
          empresa_id?: string
          estado?: string
          fecha_limite?: string
          id?: string
          responsable?: string
          tarea?: string
        }
        Relationships: []
      }
      registro_actividad: {
        Row: {
          accion: string
          actor_auth_id: string | null
          actor_email: string | null
          detalle: string
          empresa_id: string
          fecha: string
          id: string
          usuario_id: string | null
        }
        Insert: {
          accion: string
          actor_auth_id?: string | null
          actor_email?: string | null
          detalle: string
          empresa_id: string
          fecha?: string
          id: string
          usuario_id?: string | null
        }
        Update: {
          accion?: string
          actor_auth_id?: string | null
          actor_email?: string | null
          detalle?: string
          empresa_id?: string
          fecha?: string
          id?: string
          usuario_id?: string | null
        }
        Relationships: []
      }
      respuestas_evaluacion: {
        Row: {
          comentario: string | null
          created_at: string
          criterio_id: string
          evaluacion_id: string
          id: string
          puntaje: number
        }
        Insert: {
          comentario?: string | null
          created_at?: string
          criterio_id: string
          evaluacion_id: string
          id: string
          puntaje: number
        }
        Update: {
          comentario?: string | null
          created_at?: string
          criterio_id?: string
          evaluacion_id?: string
          id?: string
          puntaje?: number
        }
        Relationships: []
      }
      saldos_vacaciones: {
        Row: {
          anio: number
          created_at: string
          dias_derecho: number
          dias_pendientes: number
          dias_tomados: number
          empleado_id: string
          empresa_id: string
          id: string
        }
        Insert: {
          anio: number
          created_at?: string
          dias_derecho?: number
          dias_pendientes?: number
          dias_tomados?: number
          empleado_id: string
          empresa_id: string
          id: string
        }
        Update: {
          anio?: number
          created_at?: string
          dias_derecho?: number
          dias_pendientes?: number
          dias_tomados?: number
          empleado_id?: string
          empresa_id?: string
          id?: string
        }
        Relationships: []
      }
      solicitudes: {
        Row: {
          aprobador_id: string | null
          comentario: string | null
          created_at: string
          dias: number
          empleado_id: string
          empresa_id: string
          estado: string
          fecha_desde: string
          fecha_hasta: string
          fecha_resolucion: string | null
          id: string
          motivo: string
          tipo_id: string
        }
        Insert: {
          aprobador_id?: string | null
          comentario?: string | null
          created_at?: string
          dias: number
          empleado_id: string
          empresa_id: string
          estado?: string
          fecha_desde: string
          fecha_hasta: string
          fecha_resolucion?: string | null
          id: string
          motivo: string
          tipo_id: string
        }
        Update: {
          aprobador_id?: string | null
          comentario?: string | null
          created_at?: string
          dias?: number
          empleado_id?: string
          empresa_id?: string
          estado?: string
          fecha_desde?: string
          fecha_hasta?: string
          fecha_resolucion?: string | null
          id?: string
          motivo?: string
          tipo_id?: string
        }
        Relationships: []
      }
      tipos_solicitud: {
        Row: {
          activo: boolean
          created_at: string
          descuenta_saldo: boolean
          empresa_id: string
          id: string
          nombre: string
        }
        Insert: {
          activo?: boolean
          created_at?: string
          descuenta_saldo?: boolean
          empresa_id: string
          id: string
          nombre: string
        }
        Update: {
          activo?: boolean
          created_at?: string
          descuenta_saldo?: boolean
          empresa_id?: string
          id?: string
          nombre?: string
        }
        Relationships: []
      }
      usuarios: {
        Row: {
          activo: boolean
          correo: string
          created_at: string
          empresa_id: string
          id: string
          nombre: string
          rol: string
        }
        Insert: {
          activo?: boolean
          correo: string
          created_at?: string
          empresa_id: string
          id: string
          nombre: string
          rol: string
        }
        Update: {
          activo?: boolean
          correo?: string
          created_at?: string
          empresa_id?: string
          id?: string
          nombre?: string
          rol?: string
        }
        Relationships: []
      }
    }
    Views: {}
    Functions: {
      acreditar_saldo_vacaciones: {
        Args: { p_empresa_id: string; p_empleado_id: string; p_saldo_id: string; p_anio: number; p_dias: number; p_motivo: string; p_operacion: string }
        Returns: Database['public']['Tables']['saldos_vacaciones']['Row']
      }
      estado_acceso_colaborador: { Args: { p_empresa: string; p_empleado: string }; Returns: string }
      revocar_acceso_colaborador: { Args: { p_empresa: string; p_empleado: string }; Returns: boolean }
      vincular_cuenta_individual: { Args: { p_empresa: string; p_empleado: string; p_correo_esperado: string }; Returns: string }
      cambiar_estado_onboarding: {
        Args: { p_empresa: string; p_tarea: string; p_estado: string }
        Returns: Database['public']['Tables']['onboarding_tareas']['Row']
      }
      crear_solicitud_validada: {
        Args: { p_id: string; p_empresa_id: string; p_empleado_id: string; p_tipo_id: string; p_desde: string; p_hasta: string; p_motivo: string }
        Returns: Database['public']['Tables']['solicitudes']['Row']
      }
      resolver_solicitud_atomica: {
        Args: { p_solicitud_id: string; p_empresa_id: string; p_estado: string; p_aprobador_id: string; p_comentario: string }
        Returns: Database['public']['Tables']['solicitudes']['Row']
      }
      crear_periodo_evaluacion_rrhh: {
        Args: { p_empresa_id: string; p_nombre: string; p_fecha_inicio: string; p_fecha_fin: string }
        Returns: Database['public']['Tables']['periodos_evaluacion']['Row']
      }
      estado_periodo_evaluacion_rrhh: {
        Args: { p_empresa_id: string; p_id: string; p_estado: string }
        Returns: Database['public']['Tables']['periodos_evaluacion']['Row']
      }
      crear_evaluacion_rrhh: {
        Args: { p_id: string; p_empresa_id: string; p_empleado_id: string; p_evaluador_id: string; p_periodo: string; p_comentarios: string; p_respuestas: Json }
        Returns: Database['public']['Tables']['evaluaciones']['Row']
      }
      configurar_criterios_rrhh: {
        Args: { p_empresa_id: string; p_criterios: Json }
        Returns: Database['public']['Tables']['criterios_evaluacion']['Row'][]
      }
      guardar_tipo_solicitud_rrhh: {
        Args: { p_empresa_id: string; p_id: string; p_nombre: string; p_descuenta_saldo: boolean; p_activo: boolean }
        Returns: Database['public']['Tables']['tipos_solicitud']['Row']
      }
      estado_tipo_solicitud_rrhh: {
        Args: { p_empresa_id: string; p_id: string; p_activo: boolean }
        Returns: Database['public']['Tables']['tipos_solicitud']['Row']
      }
      reactivar_colaborador_rrhh: {
        Args: { p_empresa_id: string; p_empleado_id: string }
        Returns: Database['public']['Tables']['empleados']['Row']
      }
      cambiar_correo_colaborador_rrhh: {
        Args: { p_empresa_id: string; p_empleado_id: string; p_correo: string }
        Returns: Database['public']['Tables']['empleados']['Row']
      }
      editar_colaborador_rrhh: {
        Args: { p_empresa_id: string; p_empleado_id: string; p_nombre: string; p_cargo: string; p_departamento_id: string; p_jefe_id: string; p_fecha_ingreso: string }
        Returns: Database['public']['Tables']['empleados']['Row']
      }
      desactivar_colaborador_rrhh: {
        Args: { p_empresa_id: string; p_empleado_id: string }
        Returns: Database['public']['Tables']['empleados']['Row']
      }
      crear_colaborador_rrhh: {
        Args: { p_empresa_id: string; p_nombre: string; p_correo: string; p_cargo: string; p_departamento_id: string; p_jefe_id: string; p_fecha_ingreso: string }
        Returns: Database['public']['Tables']['empleados']['Row']
      }
      crear_colaborador_con_rol: {
        Args: { p_empresa_id: string; p_nombre: string; p_correo: string; p_cargo: string; p_departamento_id: string; p_jefe_id: string; p_fecha_ingreso: string; p_rol: string }
        Returns: Database['public']['Tables']['empleados']['Row']
      }
      cambiar_rol_colaborador: {
        Args: { p_empresa: string; p_empleado: string; p_rol: string }
        Returns: string
      }
      vincular_cuenta_con_rol: {
        Args: { p_empresa: string; p_empleado: string; p_correo_esperado: string; p_rol_esperado: string }
        Returns: string
      }
      ajustar_saldo_vacaciones: {
        Args: { p_empresa_id: string; p_empleado_id: string; p_saldo_id: string; p_anio: number; p_dias_derecho: number }
        Returns: Database['public']['Tables']['saldos_vacaciones']['Row']
      }
      vista_previa_restablecer_demo: {
        Args: { p_empresa_id: string }
        Returns: Json
      }
      restablecer_demo_seguro: {
        Args: { p_empresa_id: string; p_huella: string; p_confirmacion: string; p_operacion: string }
        Returns: Json
      }
      reset_demo_data: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }
  }
}

