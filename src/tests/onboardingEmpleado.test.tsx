import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { EmployeeMobileView } from '../views/EmployeeMobileView';
import type { DemoUserSession, OnboardingTarea } from '../types/models';

describe('tareas del empleado', () => {
  afterEach(() => window.history.replaceState({}, '', '/'));

  it('informa cuando no se puede actualizar una tarea', async () => {
    window.history.replaceState({}, '', '/?tab=onboarding');
    const session = { usuarioId: 'u1', empleadoId: 'e1', nombre: 'Ana', rol: 'empleado', empresaId: 'a' } as DemoUserSession;
    const tarea = { id: 't1', tarea: 'Firmar documentos', estado: 'pendiente', responsable: 'RRHH', fecha_limite: '2027-01-01' } as OnboardingTarea;
    const cambiar = vi.fn().mockResolvedValue(false);
    render(<EmployeeMobileView session={session} saldo={null} solicitudes={[]} tiposSolicitud={[]} onboardingTareas={[tarea]} onSubmitSolicitud={vi.fn()} onToggleTarea={cambiar} />);
    fireEvent.click(screen.getByRole('button', { name: 'Completar tarea: Firmar documentos' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('No se pudo actualizar la tarea');
    expect(cambiar).toHaveBeenCalledWith('t1', 'completada');
  });
});
