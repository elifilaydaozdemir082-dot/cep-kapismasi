import React from 'react';
import { Home } from 'lucide-react';

interface HomeButtonProps {
  onClick: () => void;
  className?: string;
}

export const HomeButton: React.FC<HomeButtonProps> = ({ onClick, className = '' }) => {
  return (
    <button
      onClick={onClick}
      aria-label="Ana Sayfaya Dön"
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-extrabold text-xs shadow-md transition-all active:scale-95 select-none ${className}`}
      style={{
        paddingTop: 'calc(0.375rem + env(safe-area-inset-top, 0px))',
      }}
    >
      <Home className="w-4 h-4 text-cyan-400 stroke-[2.5]" aria-hidden="true" />
      <span>Ana Sayfa</span>
    </button>
  );
};
