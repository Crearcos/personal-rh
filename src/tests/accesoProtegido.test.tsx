import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AccesoProtegido } from '../components/AccesoProtegido';

const api = vi.hoisted(() => ({ getUser: vi.fn(), signIn: vi.fn(), signOut: vi.fn(), from: vi.fn(), select: vi.fn(), eq: vi.fn(), onChange: vi.fn(), unsubscribe: vi.fn() }));
vi.mock('../lib/supabase', () => ({ supabase: { auth: { getUser: api.getUser, signInWithPassword: api.signIn, signOut: api.signOut, onAuthStateChange: api.onChange }, from: api.from } }));

describe('acceso protegido de demostración', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    localStorage.clear();
    api.getUser.mockResolvedValue({ data: { user: null }, error: null });
    api.signOut.mockResolvedValue({ error: null });
    api.from.mockReturnValue({ select: api.select });
    api.select.mockReturnValue({ eq: api.eq });
    api.onChange.mockReturnValue({ data: { subscription: { unsubscribe: api.unsubscribe } } });
  });
  it('pide credenciales antes de mostrar la aplicación', async () => {
    render(<AccesoProtegido>{() => <p>Aplicación protegida</p>}</AccesoProtegido>);
    expect(await screen.findByRole('button', { name: 'Ingresar' })).toBeInTheDocument();
    expect(screen.queryByText('Aplicación protegida')).not.toBeInTheDocument();
  });
  it('permite entrar solo cuando la cuenta tiene al menos una empresa autorizada', async () => {
    api.signIn.mockResolvedValue({ data: { session: {} }, error: null });
    api.getUser.mockResolvedValueOnce({ data: { user: null }, error: null }).mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null });
    api.eq.mockResolvedValue({ data: [{ empresa_id: 'empresa-1', rol: 'admin' }], error: null });
    render(<AccesoProtegido>{({ empresas }) => <p>Acceso: {empresas.join(',')}</p>}</AccesoProtegido>);
    fireEvent.change(await screen.findByLabelText('Correo'), { target: { value: 'demo@example.com' } });
    fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'contraseña' } });
    fireEvent.click(screen.getByRole('button', { name: 'Ingresar' }));
    expect(await screen.findByText('Acceso: empresa-1')).toBeInTheDocument();
    expect(api.eq).toHaveBeenCalledWith('auth_user_id', 'user-1');
  });
  it('permite entrar a una cuenta individual vinculada', async () => {
    api.signIn.mockResolvedValue({ data: { session: {} }, error: null });
    api.getUser.mockResolvedValueOnce({ data: { user: null }, error: null }).mockResolvedValue({ data: { user: { id: 'user-2' } }, error: null });
    api.eq.mockResolvedValue({ data: [{ empresa_id: 'empresa-1', rol: 'empleado', empleado_id: 'e2' }], error: null });
    render(<AccesoProtegido>{({ accesos }) => <p>Identidad: {accesos[0].empleado_id}</p>}</AccesoProtegido>);
    fireEvent.change(await screen.findByLabelText('Correo'), { target: { value: 'demo@example.com' } });
    fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'contraseña' } });
    fireEvent.click(screen.getByRole('button', { name: 'Ingresar' }));
    expect(await screen.findByText('Identidad: e2')).toBeInTheDocument();
    expect(api.signOut).not.toHaveBeenCalled();
  });
  it('rechaza una cuenta individual sin empleado vinculado', async () => {
    api.signIn.mockResolvedValue({ data: { session: {} }, error: null });
    api.getUser.mockResolvedValueOnce({ data: { user: null }, error: null }).mockResolvedValue({ data: { user: { id: 'user-2' } }, error: null });
    api.eq.mockResolvedValue({ data: [{ empresa_id: 'empresa-1', rol: 'empleado', empleado_id: null }], error: null });
    render(<AccesoProtegido>{() => <p>Aplicación protegida</p>}</AccesoProtegido>);
    fireEvent.change(await screen.findByLabelText('Correo'), { target: { value: 'demo@example.com' } });
    fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'contraseña' } });
    fireEvent.click(screen.getByRole('button', { name: 'Ingresar' }));
    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
    expect(api.signOut).toHaveBeenCalled();
  });
  it('actualiza los permisos al regresar a la aplicación', async () => {
    api.getUser.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null });
    api.eq.mockResolvedValueOnce({ data: [{ empresa_id: 'empresa-1', rol: 'admin' }], error: null })
      .mockResolvedValue({ data: [{ empresa_id: 'empresa-1', rol: 'empleado', empleado_id: 'e1' }], error: null });
    render(<AccesoProtegido>{({ accesos }) => <p>Rol: {accesos[0].rol}</p>}</AccesoProtegido>);
    expect(await screen.findByText('Rol: admin')).toBeInTheDocument();
    fireEvent.focus(window);
    expect(await screen.findByText('Rol: empleado')).toBeInTheDocument();
    expect(screen.queryByText('Rol: admin')).not.toBeInTheDocument();
  });
  it('descarta el estado anterior cuando cambia el rol', async () => {
    api.getUser.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null });
    api.eq.mockResolvedValueOnce({ data: [{ empresa_id: 'empresa-1', rol: 'admin' }], error: null })
      .mockResolvedValue({ data: [{ empresa_id: 'empresa-1', rol: 'empleado', empleado_id: 'e1' }], error: null });
    function Pantalla() {
      const [valor, setValor] = React.useState('');
      return <input aria-label="Estado anterior" value={valor} onChange={(event) => setValor(event.target.value)} />;
    }
    render(<AccesoProtegido>{() => <Pantalla />}</AccesoProtegido>);
    fireEvent.change(await screen.findByLabelText('Estado anterior'), { target: { value: 'dato privado' } });
    fireEvent.focus(window);
    await waitFor(() => expect(screen.getByLabelText('Estado anterior')).toHaveValue(''));
  });
  it('retira la pantalla protegida si ya no existen accesos autorizados', async () => {
    api.getUser.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null });
    api.eq.mockResolvedValueOnce({ data: [{ empresa_id: 'empresa-1', rol: 'admin' }], error: null })
      .mockResolvedValue({ data: [], error: null });
    render(<AccesoProtegido>{() => <p>Aplicación protegida</p>}</AccesoProtegido>);
    expect(await screen.findByText('Aplicación protegida')).toBeInTheDocument();
    fireEvent.focus(window);
    expect(await screen.findByRole('button', { name: 'Ingresar' })).toBeInTheDocument();
    expect(screen.queryByText('Aplicación protegida')).not.toBeInTheDocument();
  });
  it('no restaura una sesión cerrada por una comprobación anterior', async () => {
    api.getUser.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null });
    let resolver: (value: unknown) => void = () => {};
    api.eq.mockResolvedValueOnce({ data: [{ empresa_id: 'empresa-1', rol: 'admin' }], error: null })
      .mockImplementationOnce(() => new Promise((resolve) => { resolver = resolve; }));
    render(<AccesoProtegido>{() => <p>Aplicación protegida</p>}</AccesoProtegido>);
    expect(await screen.findByText('Aplicación protegida')).toBeInTheDocument();
    fireEvent.focus(window);
    await waitFor(() => expect(api.eq).toHaveBeenCalledTimes(2));
    api.onChange.mock.calls[0][0]('SIGNED_OUT');
    resolver({ data: [{ empresa_id: 'empresa-1', rol: 'admin' }], error: null });
    expect(await screen.findByRole('button', { name: 'Ingresar' })).toBeInTheDocument();
    expect(screen.queryByText('Aplicación protegida')).not.toBeInTheDocument();
  });
  it('avisa y permite reintentar si no se pudo confirmar el cierre de sesión', async () => {
    api.getUser.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null });
    api.eq.mockResolvedValue({ data: [{ empresa_id: 'empresa-1', rol: 'admin' }], error: null });
    api.signOut.mockResolvedValueOnce({ error: { message: 'fallo de red' } }).mockResolvedValue({ error: null });
    render(<AccesoProtegido>{({ salir }) => <button onClick={() => void salir()}>Salir</button>}</AccesoProtegido>);
    fireEvent.click(await screen.findByRole('button', { name: 'Salir' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('No pudimos confirmar el cierre de sesión');
    expect(screen.queryByRole('button', { name: 'Ingresar' })).not.toBeInTheDocument();
    fireEvent.focus(window);
    expect(api.eq).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
    expect(await screen.findByRole('button', { name: 'Ingresar' })).toBeInTheDocument();
    expect(api.signOut).toHaveBeenCalledTimes(2);
  });
  it('mantiene bloqueada la pantalla si se recarga después de un cierre fallido', async () => {
    api.getUser.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null });
    api.eq.mockResolvedValue({ data: [{ empresa_id: 'empresa-1', rol: 'admin' }], error: null });
    api.signOut.mockResolvedValue({ error: { message: 'fallo de red' } });
    const vista = render(<AccesoProtegido>{({ salir }) => <button onClick={() => void salir()}>Salir</button>}</AccesoProtegido>);
    fireEvent.click(await screen.findByRole('button', { name: 'Salir' }));
    expect(await screen.findByRole('alert')).toBeInTheDocument();
    vista.unmount();
    render(<AccesoProtegido>{() => <p>Aplicación protegida</p>}</AccesoProtegido>);
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.queryByText('Aplicación protegida')).not.toBeInTheDocument();
  });
  it('no restaura los datos mientras el servidor confirma el cierre', async () => {
    api.getUser.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null });
    api.eq.mockResolvedValue({ data: [{ empresa_id: 'empresa-1', rol: 'admin' }], error: null });
    let confirmar: (value: unknown) => void = () => {};
    api.signOut.mockImplementationOnce(() => new Promise((resolve) => { confirmar = resolve; }));
    render(<AccesoProtegido>{({ salir }) => <button onClick={() => void salir()}>Salir</button>}</AccesoProtegido>);
    fireEvent.click(await screen.findByRole('button', { name: 'Salir' }));
    expect(screen.getByRole('status')).toHaveTextContent('Cerrando sesión');
    fireEvent.focus(window);
    expect(api.eq).toHaveBeenCalledTimes(1);
    confirmar({ error: null });
    expect(await screen.findByRole('button', { name: 'Ingresar' })).toBeInTheDocument();
  });
});
