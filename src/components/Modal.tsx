import React, { useEffect } from 'react';
import { X, Info } from 'lucide-react';
import { Button } from './Button';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: React.ReactNode;
  actionText?: string;
  onAction?: () => void;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  actionText,
  onAction,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl text-center space-y-4 animate-scale-up">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-full bg-slate-800/50 hover:bg-slate-800 transition-colors"
          aria-label="Kapat"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-12 h-12 mx-auto rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
          <Info className="w-6 h-6" />
        </div>

        <div className="space-y-1">
          <h3 className="text-xl font-extrabold text-white tracking-wide">{title}</h3>
          {description && <p className="text-sm text-slate-300 leading-relaxed">{description}</p>}
        </div>

        {children && <div className="py-2">{children}</div>}

        <div className="flex gap-3 pt-2">
          {actionText && onAction ? (
            <>
              <Button variant="secondary" size="md" fullWidth onClick={onClose}>
                İptal
              </Button>
              <Button variant="primary" size="md" fullWidth onClick={onAction}>
                {actionText}
              </Button>
            </>
          ) : (
            <Button variant="primary" size="md" fullWidth onClick={onClose}>
              Anladım
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
