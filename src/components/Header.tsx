import React from 'react';
import { ArrowLeft, Volume2, VolumeX, Settings } from 'lucide-react';
import type { GameSettings } from '../types/game';
import { HomeButton } from './HomeButton';

interface HeaderProps {
  title: string;
  onBack?: () => void;
  onHome?: () => void;
  settings?: GameSettings;
  onToggleSound?: () => void;
  onOpenSettings?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  onBack,
  onHome,
  settings,
  onToggleSound,
  onOpenSettings,
}) => {
  return (
    <header className="w-full flex items-center justify-between px-4 py-3 bg-slate-900/60 backdrop-blur-md border-b border-slate-800/80 sticky top-0 z-30">
      <div className="flex items-center gap-2">
        {onBack && (
          <button
            onClick={onBack}
            className="p-2 rounded-xl bg-slate-800/80 text-slate-200 hover:text-white hover:bg-slate-700 active:scale-95 transition-all"
            aria-label="Geri Dön"
          >
            <ArrowLeft className="w-5 h-5" aria-hidden="true" />
          </button>
        )}
        {onHome && <HomeButton onClick={onHome} />}
      </div>

      <h1 className="text-base sm:text-lg font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400 truncate max-w-[160px] sm:max-w-[200px] text-center">
        {title}
      </h1>

      <div className="flex items-center gap-2">
        {settings && onToggleSound && (
          <button
            onClick={onToggleSound}
            className="p-2 rounded-xl bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700 active:scale-95 transition-all"
            aria-label={settings.soundEnabled ? 'Sesi Kapat' : 'Sesi Aç'}
          >
            {settings.soundEnabled ? (
              <Volume2 className="w-5 h-5 text-cyan-400" aria-hidden="true" />
            ) : (
              <VolumeX className="w-5 h-5 text-slate-500" aria-hidden="true" />
            )}
          </button>
        )}

        {onOpenSettings && (
          <button
            onClick={onOpenSettings}
            className="p-2 rounded-xl bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700 active:scale-95 transition-all"
            aria-label="Ayarlar"
          >
            <Settings className="w-5 h-5" aria-hidden="true" />
          </button>
        )}
      </div>
    </header>
  );
};
