import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { ComponentProps } from 'react';
import { AdminView } from '../views/AdminView';
import type { DemoUserSession, Departamento, Empleado } from '../types/models';

describe('filtros del directorio de RR. HH.', () => {
  it('recupera la lista y los filtros iniciales cuando no hay coincidencias', () => {
    const si = vi.fn().mockResolvedValue(true);
    const props: ComponentProps<typeof AdminView> = {
      session: { empresaId: 'empresa', rol: 'admin' } as DemoUserSession,
      empleados: [{ id: 'e1', nombre: 'Ana Torres', cargo: 'Analista', departamento_id: 'd1', activo: true } as Empleado],
      departamentos: [{ id: 'd1', nombre: 'Ventas' } as Departamento],
      solicitudes: [], saldos: [], evaluaciones: [], onboardingTareas: [], actividades: [], tiposSolicitud: [], criterios: [], periodos: [],
      errorPanel: false, errorDirectorio: false, errorOnboarding: false, errorAuditoria: false, nombreEmpresa: 'Empresa',
      onReintentarPanel: vi.fn(), onResetDemo: vi.fn().mockResolvedValue(undefined), isResetting: false,
      onToggleTarea: si, onGuardarTarea: si, onEliminarTarea: si, onAjustarSaldo: si,
      onCrearColaborador: si, onEditarColaborador: si, onDesactivarColaborador: si, onReactivarColaborador: si,
      onConsultarCorreo: vi.fn().mockResolvedValue(null), onCambiarCorreo: si,
      onGuardarTipo: si, onCambiarEstadoTipo: si, onGuardarCriterios: si, onCrearPeriodo: si, onCambiarEstadoPeriodo: si,
    };
    render(<AdminView {...props} />);
    fireEvent.click(screen.getByRole('button', { name: /directorio/i }));
    const buscar = screen.getByRole('textbox', { name: 'Buscar colaboradores' });
    fireEvent.change(buscar, { target: { value: 'sin coincidencias' } });
    expect(screen.queryByRole('button', { name: /ver ficha de Ana Torres/i })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Limpiar filtros del directorio' }));
    expect(buscar).toHaveValue('');
    expect(screen.getByRole('button', { name: /ver ficha de Ana Torres/i })).toBeInTheDocument();
  });
});
