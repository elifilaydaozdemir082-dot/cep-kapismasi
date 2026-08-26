import React from 'react';
import { User, Users, Trophy, Settings, Zap } from 'lucide-react';
import { Button } from '../components/Button';

interface MainMenuScreenProps {
  onSelectSinglePlayer: () => void;
  onSelectMultiPlayer: () => void;
  onOpenRecords: () => void;
  onOpenSettings: () => void;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
}

export const MainMenuScreen: React.FC<MainMenuScreenProps> = ({
  onSelectSinglePlayer,
  onSelectMultiPlayer,
  onOpenRecords,
  onOpenSettings,
  soundEnabled,
  vibrationEnabled,
}) => {
  return (
    <div className="flex-1 flex flex-col items-center justify-between p-6 max-w-md mx-auto w-full text-center select-none animate-fade-in">
      {/* Brand Hero */}
      <div className="pt-8 pb-4 flex flex-col items-center space-y-3">
        <div className="relative">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/30 transform rotate-3 animate-pulse">
            <Zap className="w-10 h-10 text-white stroke-[2.5]" />
          </div>
          <div className="absolute -top-1 -right-1 px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black text-xs tracking-wider shadow-md">
            MINI
          </div>
        </div>

        <div className="space-y-1">
          <h1 className="text-4xl font-black tracking-tight text-white drop-shadow-md">
            Cep Kapışması
          </h1>
          <p className="text-sm font-semibold text-cyan-400/90 tracking-wide uppercase">
            Mobil Parti Oyunları
          </p>
        </div>
      </div>

      {/* Main Actions */}
      <div className="w-full space-y-4 my-auto py-4">
        <Button
          variant="primary"
          size="xl"
          fullWidth
          soundEnabled={soundEnabled}
          vibrationEnabled={vibrationEnabled}
          onClick={onSelectSinglePlayer}
        >
          <User className="w-6 h-6" />
          Tek Oyunculu
        </Button>

        <Button
          variant="accent"
          size="xl"
          fullWidth
          soundEnabled={soundEnabled}
          vibrationEnabled={vibrationEnabled}
          onClick={onSelectMultiPlayer}
        >
          <Users className="w-6 h-6" />
          Arkadaşlarla Oyna
        </Button>

        <div className="grid grid-cols-2 gap-3 pt-2">
          <Button
            variant="secondary"
            size="lg"
            fullWidth
            soundEnabled={soundEnabled}
            vibrationEnabled={vibrationEnabled}
            onClick={onOpenRecords}
          >
            <Trophy className="w-5 h-5 text-amber-400" />
            Rekorlar
          </Button>

          <Button
            variant="secondary"
            size="lg"
            fullWidth
            soundEnabled={soundEnabled}
            vibrationEnabled={vibrationEnabled}
            onClick={onOpenSettings}
          >
            <Settings className="w-5 h-5 text-slate-300" />
            Ayarlar
          </Button>
        </div>
      </div>

      {/* Footer info */}
      <div className="pb-4 text-xs font-medium text-slate-300">
        Tek Telefon &bull; 1 - 4 Oyuncu &bull; Çevrim Dışı
      </div>
    </div>
  );
};
