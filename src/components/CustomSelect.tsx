import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check, X } from 'lucide-react';

export interface CustomSelectOption {
  value: string;
  label: string;
  badge?: string;
  badgeColor?: 'emerald' | 'amber' | 'blue' | 'slate';
  description?: string;
}

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: CustomSelectOption[];
  placeholder?: string;
  className?: string;
  icon?: React.ReactNode;
  variant?: 'default' | 'compact';
  ariaLabel?: string;
  title?: string;
  triggerRef?: React.RefObject<HTMLButtonElement | null>;
  disabled?: boolean;
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
  value,
  onChange,
  options,
  placeholder = 'Selecciona una opción',
  className = '',
  icon,
  variant = 'default',
  ariaLabel = 'Selector de opciones',
  title,
  triggerRef: externalTriggerRef,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const internalTriggerRef = useRef<HTMLButtonElement>(null);
  const triggerRef = externalTriggerRef || internalTriggerRef;
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  // Cierre automático con la tecla Escape
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Cierre al hacer clic fuera en modo compacto
  useEffect(() => {
    if (variant !== 'compact' || !isOpen) return;

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('pointerdown', handleClickOutside);
    return () => {
      document.removeEventListener('pointerdown', handleClickOutside);
    };
  }, [isOpen, variant]);

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
  };

  const getBadgeClasses = (color?: string) => {
    switch (color) {
      case 'emerald':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'amber':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'blue':
        return 'bg-sky-50 text-sky-800 border-sky-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  if (variant === 'compact') {
    return (
      <div ref={containerRef} className={`relative inline-block ${className}`}>
        <button
          ref={triggerRef}
          type="button"
          disabled={disabled}
          onClick={() => setIsOpen(!isOpen)}
          aria-label={ariaLabel}
          aria-expanded={isOpen}
          className="btn-pressable flex items-center gap-1.5 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100/90 py-1.5 px-2.5 rounded-xl border border-slate-200/90 focus:outline-none focus:ring-2 focus:ring-[#57CCB7]/40 disabled:opacity-60 disabled:cursor-not-allowed disabled:pointer-events-none transition-colors duration-150 text-left"
        >
          {icon && <span className="flex-shrink-0 text-slate-500">{icon}</span>}
          <span className="truncate max-w-[70px] min-[420px]:max-w-[100px] sm:max-w-[200px]">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <ChevronDown
            className={`w-3.5 h-3.5 text-slate-400 flex-shrink-0 transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-slate-700' : ''
            }`}
          />
        </button>

        {isOpen && (
          <div className="absolute right-0 mt-1.5 w-64 bg-white rounded-2xl border border-slate-200 shadow-elevation z-50 p-1.5 animate-enter max-h-72 overflow-y-auto">
            {options.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleSelect(opt.value)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between gap-2 transition-colors duration-150 active:scale-[0.98] ${
                    isSelected
                      ? 'bg-slate-100 text-slate-900 font-bold'
                      : 'text-slate-700 hover:bg-slate-50 font-medium'
                  }`}
                >
                  <div className="truncate">
                    <p className="truncate">{opt.label}</p>
                    {opt.description && (
                      <p className="text-[10px] text-slate-400 font-normal truncate">
                        {opt.description}
                      </p>
                    )}
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-[#008262] flex-shrink-0" />}
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Botón Disparador del Select */}
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        aria-label={ariaLabel}
        aria-expanded={isOpen}
        className={`w-full min-h-[48px] text-xs font-semibold text-slate-800 bg-slate-50/80 hover:bg-slate-100/80 border rounded-xl p-3 flex items-center justify-between gap-2 transition-colors duration-150 text-left focus:outline-none focus:ring-2 focus:ring-[#57CCB7]/40 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed disabled:pointer-events-none ${
          isOpen ? 'bg-white border-[#57CCB7] shadow-sm' : 'border-slate-200'
        }`}
      >
        <div className="flex items-center gap-2.5 truncate flex-1">
          {icon && <span className="flex-shrink-0 text-cyan-600">{icon}</span>}
          <span className="font-bold text-slate-800 truncate block text-xs sm:text-sm">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {selectedOption?.badge && (
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getBadgeClasses(
                selectedOption.badgeColor
              )}`}
            >
              {selectedOption.badge}
            </span>
          )}
          <ChevronDown
            className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-slate-800' : ''
            }`}
          />
        </div>
      </button>

      {/* Menú Desplegable con Modal / Hoja Inferior (Overlay) para navegación libre sin recortes */}
      {isOpen && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/40 backdrop-blur-xs animate-enter"
          onClick={() => setIsOpen(false)}
          role="presentation"
        >
          <div
            className="w-full max-h-[85vh] sm:max-h-[80vh] sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col p-4 sm:p-6 space-y-3 overscroll-contain animate-enter border border-slate-100"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label={ariaLabel || placeholder}
          >
            {/* Indicador táctil en móvil */}
            <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-1 sm:hidden shrink-0" aria-hidden="true" />

            {/* Encabezado del diálogo selector */}
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5 min-w-0">
                {icon && <span className="flex-shrink-0 text-cyan-600">{icon}</span>}
                <h3 className="text-base font-bold text-slate-900 tracking-tight truncate">
                  {title || ariaLabel || placeholder}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Cerrar opciones"
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 active:scale-95 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Lista fluida de opciones con scroll completo y táctil */}
            <div className="overflow-y-auto max-h-[60vh] space-y-2 py-1 pr-1 overscroll-contain">
              {options.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleSelect(opt.value)}
                    className={`w-full min-h-[48px] text-left p-3.5 rounded-2xl transition-all duration-150 active:scale-[0.98] border flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-emerald-50/80 border-[#57CCB7] shadow-soft'
                        : 'bg-white hover:bg-slate-50 border-slate-100 hover:border-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 border-2 transition-colors ${
                          isSelected
                            ? 'border-[#008262] bg-[#008262] text-white'
                            : 'border-slate-300 bg-white'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={`text-xs sm:text-sm font-bold truncate ${isSelected ? 'text-[#005240]' : 'text-slate-800'}`}>
                          {opt.label}
                        </p>
                        {opt.description && (
                          <p className={`text-[11px] sm:text-xs mt-0.5 leading-snug font-normal ${isSelected ? 'text-[#00644d]' : 'text-slate-500'}`}>
                            {opt.description}
                          </p>
                        )}
                      </div>
                    </div>
                    {opt.badge && (
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border shrink-0 ${getBadgeClasses(opt.badgeColor)}`}>
                        {opt.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
