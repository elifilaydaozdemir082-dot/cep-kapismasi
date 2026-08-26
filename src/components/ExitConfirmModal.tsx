import React from 'react';
import { HelpCircle, Play, Home } from 'lucide-react';

interface ExitConfirmModalProps {
  isOpen: boolean;
  onResumeGame: () => void;
  onConfirmExit: () => void;
}

export const ExitConfirmModal: React.FC<ExitConfirmModalProps> = ({
  isOpen,
  onResumeGame,
  onConfirmExit,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in select-none">
      <div className="relative w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl text-center space-y-4 animate-scale-up">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-400/10 border border-amber-400/30 text-amber-400 flex items-center justify-center shadow-inner">
          <HelpCircle className="w-8 h-8 stroke-[2.5]" aria-hidden="true" />
        </div>

        <div className="space-y-1">
          <h2 className="text-xl font-black text-white">Oyundan çıkmak istiyor musun?</h2>
          <p className="text-xs text-slate-400 font-medium leading-relaxed">
            Bu turun mevcut ilerlemesi kaydedilmeyecek.
          </p>
        </div>

        <div className="flex flex-col gap-2.5 pt-2">
          <button
            onClick={onResumeGame}
            className="w-full py-3.5 rounded-2xl bg-cyan-500 text-slate-950 font-black text-sm shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-2"
          >
            <Play className="w-4 h-4 fill-current" aria-hidden="true" /> Oyuna Devam Et
          </button>

          <button
            onClick={onConfirmExit}
            className="w-full py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-750 text-slate-300 font-black text-sm border border-slate-700 active:scale-95 transition-transform flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" aria-hidden="true" /> Ana Sayfaya Dön
          </button>
        </div>
      </div>
    </div>
  );
};
