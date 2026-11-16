import React from 'react';

export interface SolicitudModalAction {
  solicitudId: string;
  tipo: 'aprobar' | 'rechazar';
}

interface SolicitudDecisionModalProps {
  modalAction: SolicitudModalAction | null;
  comentario: string;
  isResolving: boolean;
  error?: string | null;
  onComentarioChange: (value: string) => void;
  onConfirm: () => void;
  onClose: () => void;
}

export const SolicitudDecisionModal: React.FC<SolicitudDecisionModalProps> = ({
  modalAction,
  comentario,
  isResolving,
  error,
  onComentarioChange,
  onConfirm,
  onClose,
}) => {
  if (!modalAction) return null;

  const isAprobar = modalAction.tipo === 'aprobar';
  const isRechazoInvalido = !isAprobar && !comentario.trim();

  const textareaBorderClass = isAprobar
    ? 'border-slate-300 focus:ring-emerald-400/40 focus:border-emerald-500'
    : isRechazoInvalido
    ? 'border-rose-300 focus:ring-rose-400/40 focus:border-rose-500'
    : 'border-slate-300 focus:ring-rose-400/40 focus:border-rose-500';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-enter"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="solicitud-decision-title"
    >
      <div
        className="relative overflow-hidden bg-white rounded-3xl border border-slate-200/90 shadow-2xl p-5 sm:p-6 w-full max-w-sm space-y-4 overscroll-contain"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Halo superior según el tipo de acción */}
        <div
          className={`absolute -top-10 inset-x-0 mx-auto w-4/5 h-16 rounded-full blur-2xl pointer-events-none ${
            isAprobar ? 'bg-[#7bf02d]/25' : 'bg-rose-400/25'
          }`}
          aria-hidden="true"
        />

        <h3
          id="solicitud-decision-title"
          className="relative text-lg font-bold text-slate-900 tracking-tight"
        >
          {isAprobar ? 'Aprobar solicitud' : 'Rechazar solicitud'}
        </h3>

        <div className="relative space-y-1">
          <textarea
            rows={3}
            value={comentario}
            onChange={(e) => onComentarioChange(e.target.value)}
            placeholder={
              isAprobar
                ? '*Agregue un comentario (Opcional)'
                : '*Agregue un motivo de rechazo (Obligatorio)'
            }
            aria-label={isAprobar ? 'Comentario opcional de aprobación' : 'Motivo obligatorio de rechazo'}
            enterKeyHint="done"
            className={`w-full text-base sm:text-xs font-medium text-slate-800 bg-white border rounded-2xl p-3.5 focus:outline-none focus:ring-2 placeholder:text-slate-400 resize-none transition-all ${textareaBorderClass}`}
            autoFocus
          />
          {isRechazoInvalido && (
            <p className="text-[10px] text-rose-500 font-semibold px-1">
              * El motivo de rechazo es obligatorio.
            </p>
          )}
        </div>

        {error && <p role="alert" className="relative text-sm text-rose-700">{error}</p>}
        <div className="relative flex items-center gap-2.5 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="btn-pressable flex-1 min-h-[44px] py-2.5 px-4 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-bold text-xs rounded-2xl transition-all cursor-pointer"
          >
            Cancelar
          </button>

          {isAprobar ? (
            <button
              type="button"
              onClick={onConfirm}
              disabled={isResolving}
              className="btn-pressable flex-1 min-h-[44px] py-2.5 px-4 bg-gradient-to-r from-[#7bf02d] to-[#4ce675] hover:brightness-105 active:scale-95 text-[#004e1e] font-bold text-xs rounded-2xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1 disabled:opacity-50"
            >
              {isResolving ? 'Aprobando...' : 'Confirmar Solicitud'}
            </button>
          ) : (
            <button
              type="button"
              onClick={onConfirm}
              disabled={isResolving || isRechazoInvalido}
              className="btn-pressable flex-1 min-h-[44px] py-2.5 px-4 bg-gradient-to-r from-rose-200 via-rose-300 to-rose-400 hover:brightness-105 active:scale-95 text-rose-800 font-bold text-xs rounded-2xl shadow-xs transition-all flex items-center justify-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:brightness-100"
            >
              {isResolving ? 'Rechazando...' : 'Rechazar Solicitud'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
