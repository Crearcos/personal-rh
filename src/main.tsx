import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AccesoProtegido } from './components/AccesoProtegido';
import './index.css';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('No se encontró el elemento raíz con id "root".');
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <AccesoProtegido>{({ empresas, accesos, salir }) => <App empresasAutorizadas={empresas} accesos={accesos} onCerrarSesion={salir} />}</AccesoProtegido>
  </React.StrictMode>
);

