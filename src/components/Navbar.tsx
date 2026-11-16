import React from 'react';
import { 
  Building2, 
  RotateCcw, 
  UserCheck, 
  ShieldCheck, 
  Smartphone
  , LogOut, KeyRound
} from 'lucide-react';
import type { UserRole, DemoUserSession, Empresa } from '../types/models';
import { CustomSelect } from './CustomSelect';

interface NavbarProps {
  currentRole: UserRole;
  permitirCambioRol?: boolean;
  onRoleChange: (role: UserRole) => void;
  empresas: Empresa[];
  selectedEmpresaId: string;
  onEmpresaChange: (id: string) => void;
  activeSession?: DemoUserSession | null;
  onResetDemo: () => Promise<void>;
  isResetting: boolean;
  onCerrarSesion?: () => Promise<void>;
  onCambiarContrasena?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentRole,
  permitirCambioRol = true,
  onRoleChange,
  empresas,
  selectedEmpresaId,
  onEmpresaChange,
  onResetDemo,
  isResetting,
  onCerrarSesion,
  onCambiarContrasena,
}) => {
  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 pt-safe">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16 gap-1.5 sm:gap-3">
          
          {/* Logo & Marca con nuevo icono */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0 min-w-0">
            <img 
              src="/logo.png" 
              alt="PersonalHR Logo" 
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl shadow-soft object-contain flex-shrink-0" 
            />
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="font-bold text-slate-900 tracking-tight text-sm sm:text-lg truncate">PersonalHR</span>
              <span className="hidden min-[380px]:inline-block text-[10px] font-bold bg-[#00c290]/15 text-[#00644d] border border-[#00c290]/30 px-1.5 py-0.5 rounded-full shrink-0">
                Demo
              </span>
            </div>
          </div>

          {/* Selector de Tenant / Empresa (Multi-tenant) */}
          <div className="min-w-0 max-w-[130px] min-[390px]:max-w-[170px] sm:max-w-xs shrink-1">
            <CustomSelect
              value={selectedEmpresaId}
              onChange={onEmpresaChange}
              options={empresas.map((emp) => ({
                value: emp.id,
                label: `${emp.nombre} (${emp.ciudad})`,
              }))}
              variant="compact"
              icon={<Building2 className="w-3.5 h-3.5" />}
              ariaLabel="Seleccionar empresa multi-tenant"
            />
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {onCambiarContrasena && (
              <button 
                type="button" 
                onClick={onCambiarContrasena} 
                aria-label="Cambiar contraseña de mi cuenta" 
                title="Cambiar contraseña" 
                className="min-h-11 min-w-11 shrink-0 inline-flex items-center justify-center rounded-xl text-slate-700 hover:bg-slate-100 active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-700"
              >
                <KeyRound className="h-4 w-4" aria-hidden="true" />
              </button>
            )}
            {onCerrarSesion && (
              <button 
                type="button" 
                onClick={() => { void onCerrarSesion(); }} 
                aria-label="Cerrar sesión" 
                title="Cerrar sesión" 
                className="min-h-11 min-w-11 shrink-0 inline-flex items-center justify-center rounded-xl text-slate-700 hover:bg-slate-100 active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-700"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
              </button>
            )}
          </div>
          {/* Botón Restablecer Datos Demo (Visible solo para Administrador) */}
          {currentRole === 'admin' && (
            <button
              onClick={onResetDemo}
              disabled={isResetting}
              className="btn-pressable hidden min-h-11 md:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg shadow-sm disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-rose-700"
              title="Revisar el restablecimiento de la empresa seleccionada"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
              <span>{isResetting ? 'Restableciendo...' : 'Restablecer Demo'}</span>
            </button>
          )}

          {/* Botones de Demo Fast-Login en Escritorio (1 clic sin contraseñas) */}
          {permitirCambioRol && <div className="hidden sm:flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => onRoleChange('empleado')}
              className={`btn-pressable flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                currentRole === 'empleado'
                  ? 'bg-[#a8ffa1] text-[#003820] font-bold shadow-soft border border-[#8fe887]'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5 flex-shrink-0" />
              <span>Empleado</span>
            </button>

            <button
              onClick={() => onRoleChange('jefe')}
              className={`btn-pressable flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                currentRole === 'jefe'
                  ? 'bg-[#00c290] text-slate-950 font-bold shadow-soft'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5 flex-shrink-0" />
              <span>Jefe</span>
            </button>

            <button
              onClick={() => onRoleChange('admin')}
              className={`btn-pressable flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                currentRole === 'admin'
                  ? 'bg-[#00c290] text-slate-950 font-bold shadow-soft'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 flex-shrink-0" />
              <span>RRHH</span>
            </button>
          </div>}

        </div>
      </div>
    </header>

    {/* Barra Inferior Móvil Fija (Diseño Nativo / Mobile-First - Fuera del header) */}
    {permitirCambioRol && <nav 
      className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-slate-200 px-4 py-1.5 flex items-center justify-around shadow-elevation safe-area-bottom"
      aria-label="Selector de rol móvil"
    >
      <button
        onClick={() => onRoleChange('empleado')}
        className={`flex flex-col items-center py-1 px-4 rounded-xl transition-all active:scale-95 ${
          currentRole === 'empleado'
            ? 'text-[#004128] font-extrabold bg-[#a8ffa1]/40 border border-[#a8ffa1]'
            : 'text-slate-400 hover:text-slate-600'
        }`}
      >
        <Smartphone className="w-5 h-5" />
        <span className="text-[10px] mt-0.5">Empleado</span>
      </button>

      <button
        onClick={() => onRoleChange('jefe')}
        className={`flex flex-col items-center py-1 px-4 rounded-xl transition-all active:scale-95 ${
          currentRole === 'jefe'
            ? 'text-[#008262] font-bold bg-[#00c290]/10'
            : 'text-slate-400 hover:text-slate-600'
        }`}
      >
        <UserCheck className="w-5 h-5" />
        <span className="text-[10px] mt-0.5">Jefe</span>
      </button>

      <button
        onClick={() => onRoleChange('admin')}
        className={`flex flex-col items-center py-1 px-4 rounded-xl transition-all active:scale-95 ${
          currentRole === 'admin'
            ? 'text-[#008262] font-bold bg-[#00c290]/10'
            : 'text-slate-400 hover:text-slate-600'
        }`}
      >
        <ShieldCheck className="w-5 h-5" />
        <span className="text-[10px] mt-0.5">RRHH</span>
      </button>
    </nav>}
  </>
  );
};
