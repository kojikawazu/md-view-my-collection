
import React from 'react';
import { DesignSystem } from '../types';

interface ConfirmationModalProps {
  theme: DesignSystem;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel: string;
  confirmVariant?: 'primary' | 'danger';
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  theme,
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel,
  confirmVariant = 'primary'
}) => {
  if (!isOpen) return null;

  const { colors, fontHeader, borderRadius } = theme;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className={`${colors.surface} ${colors.border} border p-8 max-w-md w-full shadow-2xl ${borderRadius} animate-in zoom-in-95 duration-200`}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className={`${fontHeader} text-2xl font-bold ${colors.text} mb-4`}>{title}</h3>
        <p className={`text-sm ${colors.muted} leading-relaxed mb-8`}>{message}</p>
        
        <div className="flex justify-end gap-4">
          <button 
            onClick={onClose}
            className={`px-6 py-2 text-sm font-bold ${colors.muted} hover:text-black transition-colors`}
          >
            キャンセル
          </button>
          <button 
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`px-8 py-2 text-sm font-bold text-white transition-all hover:brightness-125 ${borderRadius} ${
              confirmVariant === 'danger' ? 'bg-red-800' : colors.accent
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
