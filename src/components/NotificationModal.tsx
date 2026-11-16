import React from 'react';
import { MessageSquare, Mail, X, CheckCircle2, ArrowRight } from 'lucide-react';

export interface NotificationPayload {
  tipo: 'whatsapp' | 'email';
  destinatario: string;
  telefonoOCorreo: string;
  titulo: string;
  mensaje: string;
  detalleTecnico: string;
}

interface NotificationModalProps {
  notification: NotificationPayload | null;
  onClose: () => void;
}

export const NotificationModal: React.FC<NotificationModalProps> = ({ notification, onClose }) => {
  if (!notification) return null;

  const isWhatsapp = notification.tipo === 'whatsapp';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-enter">
      <div 
        className="w-full max-w-md bg-white rounded-2xl shadow-elevation border border-slate-200 overflow-hidden transform transition-all"
        style={{ transformOrigin: 'center' }}
      >
        {/* Header con estilo del canal simulado */}
        <div className={`p-4 flex items-center justify-between ${isWhatsapp ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-white'}`}>
          <div className="flex items-center space-x-2.5">
            {isWhatsapp ? (
              <MessageSquare className="w-5 h-5 flex-shrink-0" />
            ) : (
              <Mail className="w-5 h-5 flex-shrink-0" />
            )}
            <div>
              <p className="text-xs uppercase tracking-wider font-semibold opacity-80">
                Notificación Simulada ({isWhatsapp ? 'WhatsApp Business' : 'Email Transaccional'})
              </p>
              <h4 className="text-sm font-bold truncate">{notification.titulo}</h4>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-black/10 active:scale-95 transition-transform"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cuerpo de la Notificación */}
        <div className="p-5 space-y-4">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-medium text-slate-700">Para: {notification.destinatario}</span>
              <span className="tabular-nums font-mono">{notification.telefonoOCorreo}</span>
            </div>
            <p className="text-sm text-slate-800 whitespace-pre-line leading-relaxed">
              {notification.mensaje}
            </p>
          </div>

          {/* Nota de Arquitectura e Integración de Producción requerida por el Brief */}
          <div className="bg-[#00c290]/10 border border-[#00c290]/25 rounded-xl p-3 text-xs text-[#005266] space-y-1">
            <p className="font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#008262] flex-shrink-0" />
              Integración de Producción Necesaria:
            </p>
            <p className="text-slate-600 leading-normal pl-4">
              {notification.detalleTecnico}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="btn-pressable inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-sm"
          >
            Entendido <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

