import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Navbar } from '../components/Navbar';

describe('restablecimiento de la demo', () => {
  it('abre la revisión sin ejecutar directamente el restablecimiento', () => {
    const restablecer = vi.fn();
    render(<Navbar currentRole="admin" onRoleChange={vi.fn()} empresas={[]} selectedEmpresaId="empresa"
      onEmpresaChange={vi.fn()} onResetDemo={restablecer} isResetting={false} />);
    const boton = screen.getByRole('button', { name: /restablecer demo/i });
    expect(boton).toBeEnabled();
    fireEvent.click(boton);
    expect(restablecer).toHaveBeenCalledOnce();
  });
});
