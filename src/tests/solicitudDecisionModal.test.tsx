import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SolicitudDecisionModal } from '../components/SolicitudDecisionModal';

describe('SolicitudDecisionModal (Doble Confirmación y Motivo Obligatorio)', () => {
  it('no renderiza nada cuando modalAction es null', () => {
    const { container } = render(
      <SolicitudDecisionModal
        modalAction={null}
        comentario=""
        isResolving={false}
        onComentarioChange={vi.fn()}
        onConfirm={vi.fn()}
        onClose={vi.fn()}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('permite confirmar aprobación incluso sin comentario opcional', () => {
    const onConfirm = vi.fn();
    render(
      <SolicitudDecisionModal
        modalAction={{ solicitudId: 'sol_1', tipo: 'aprobar' }}
        comentario=""
        isResolving={false}
        onComentarioChange={vi.fn()}
        onConfirm={onConfirm}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByText('Aprobar solicitud')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('*Agregue un comentario (Opcional)')).toBeInTheDocument();

    const confirmBtn = screen.getByRole('button', { name: 'Confirmar Solicitud' });
    expect(confirmBtn).toBeEnabled();
    fireEvent.click(confirmBtn);
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('exige un motivo obligatorio para rechazar y deshabilita el envío con texto vacío o espacios', () => {
    const onConfirm = vi.fn();
    render(
      <SolicitudDecisionModal
        modalAction={{ solicitudId: 'sol_2', tipo: 'rechazar' }}
        comentario="   "
        isResolving={false}
        onComentarioChange={vi.fn()}
        onConfirm={onConfirm}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByText('Rechazar solicitud')).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText('*Agregue un motivo de rechazo (Obligatorio)')
    ).toBeInTheDocument();
    expect(screen.getByText('* El motivo de rechazo es obligatorio.')).toBeInTheDocument();

    const rejectBtn = screen.getByRole('button', { name: 'Rechazar Solicitud' });
    expect(rejectBtn).toBeDisabled();
    fireEvent.click(rejectBtn);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('habilita el botón de rechazo y ejecuta onConfirm cuando se ingresa un motivo válido', () => {
    const onConfirm = vi.fn();
    render(
      <SolicitudDecisionModal
        modalAction={{ solicitudId: 'sol_2', tipo: 'rechazar' }}
        comentario="Cruce con cierre mensual de ventas"
        isResolving={false}
        onComentarioChange={vi.fn()}
        onConfirm={onConfirm}
        onClose={vi.fn()}
      />
    );

    expect(screen.queryByText('* El motivo de rechazo es obligatorio.')).not.toBeInTheDocument();
    const rejectBtn = screen.getByRole('button', { name: 'Rechazar Solicitud' });
    expect(rejectBtn).toBeEnabled();
    fireEvent.click(rejectBtn);
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});
