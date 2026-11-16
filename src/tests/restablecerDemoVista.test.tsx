import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RestablecerDemo } from '../components/RestablecerDemo';

const servicio = vi.hoisted(() => ({ consultar: vi.fn(), ejecutar: vi.fn(), actor: vi.fn() }));
vi.mock('../services/restablecerDemoRepository', () => ({ consultarRestablecimiento: servicio.consultar, ejecutarRestablecimiento: servicio.ejecutar, obtenerActorRestablecimiento: servicio.actor }));

describe('restablecimiento de la demo', () => {
  beforeEach(() => { sessionStorage.clear(); vi.clearAllMocks(); servicio.actor.mockResolvedValue('actor-1'); });
  it('muestra la empresa, el alcance y exige confirmación explícita', async () => {
    servicio.consultar.mockResolvedValue({ success: true, data: { empresa_id: 'andes', version: 1, huella: 'a'.repeat(32), totales: { empleados: 50, solicitudes: 4 }, bloqueos: [] } });
    servicio.ejecutar.mockResolvedValue('completado');
    const completado = vi.fn();
    render(<RestablecerDemo empresaId="andes" nombreEmpresa="Empresa Andes" onCerrar={vi.fn()} onCompletado={completado} />);
    expect(await screen.findByText('Empresa Andes')).toBeInTheDocument();
    expect(await screen.findByText('50')).toBeInTheDocument();
    const confirmar = screen.getByRole('button', { name: 'Confirmar restablecimiento' });
    expect(confirmar).toBeDisabled();
    fireEvent.change(screen.getByLabelText(/escribe RESTABLECER/i), { target: { value: 'RESTABLECER' } });
    fireEvent.click(confirmar);
    await waitFor(() => expect(completado).toHaveBeenCalledOnce());
    expect(servicio.ejecutar).toHaveBeenCalledOnce();
    expect(sessionStorage.length).toBe(0);
  });
  it('no permite confirmar si existe una cuenta que requiere revisión', async () => {
    servicio.consultar.mockResolvedValue({ success: true, data: { empresa_id: 'andes', version: 1, huella: 'a'.repeat(32), totales: {}, bloqueos: [{ codigo: 'IDENTIDAD_FUERA_REFERENCIA', empleado_id: 'emp_nuevo' }] } });
    render(<RestablecerDemo empresaId="andes" nombreEmpresa="Empresa Andes" onCerrar={vi.fn()} onCompletado={vi.fn()} />);
    expect(await screen.findByText(/hay cuentas vinculadas/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Confirmar restablecimiento' })).not.toBeInTheDocument();
  });
  it('explica el bloqueo temporal de fin de año', async () => {
    servicio.consultar.mockResolvedValue({ success: true, data: { empresa_id: 'andes', version: 1, huella: 'a'.repeat(32), totales: {}, bloqueos: [{ codigo: 'FIN_ANIO_SALDOS', empleado_id: null }] } });
    render(<RestablecerDemo empresaId="andes" nombreEmpresa="Empresa Andes" onCerrar={vi.fn()} onCompletado={vi.fn()} />);
    expect(await screen.findByText(/restablecimiento está pausado por el cambio de año/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Confirmar restablecimiento' })).not.toBeInTheDocument();
  });
  it('conserva la operación y reutiliza su identificador si la conexión se interrumpe', async () => {
    servicio.consultar.mockResolvedValue({ success: true, data: { empresa_id: 'andes', version: 1, huella: 'a'.repeat(32), totales: {}, bloqueos: [] } });
    servicio.ejecutar.mockResolvedValueOnce('sin_confirmar').mockResolvedValueOnce('completado');
    render(<RestablecerDemo empresaId="andes" nombreEmpresa="Empresa Andes" onCerrar={vi.fn()} onCompletado={vi.fn()} />);
    fireEvent.change(await screen.findByLabelText(/escribe RESTABLECER/i), { target: { value: 'RESTABLECER' } });
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar restablecimiento' }));
    const verificar = await screen.findByRole('button', { name: /verificar resultado/i });
    fireEvent.click(verificar);
    await waitFor(() => expect(servicio.ejecutar).toHaveBeenCalledTimes(2));
    expect(servicio.ejecutar.mock.calls[0][0]).toEqual(servicio.ejecutar.mock.calls[1][0]);
  });
  it('no ofrece a otra cuenta una operación pendiente ajena', async () => {
    sessionStorage.setItem('personalhr:restablecimiento:andes:actor-1', JSON.stringify({ empresa: 'andes', huella: 'a'.repeat(32), operacion: '00000000-0000-4000-8000-000000000001' }));
    servicio.actor.mockResolvedValue('actor-2');
    servicio.consultar.mockResolvedValue({ success: true, data: { empresa_id: 'andes', version: 1, huella: 'b'.repeat(32), totales: {}, bloqueos: [] } });
    render(<RestablecerDemo empresaId="andes" nombreEmpresa="Empresa Andes" onCerrar={vi.fn()} onCompletado={vi.fn()} />);
    expect(await screen.findByLabelText(/escribe RESTABLECER/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /verificar resultado/i })).not.toBeInTheDocument();
  });
});
