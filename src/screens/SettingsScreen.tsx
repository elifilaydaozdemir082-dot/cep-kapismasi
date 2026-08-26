import React, { useState } from 'react';
import { Volume2, VolumeX, Smartphone, Trash2 } from 'lucide-react';
import { Header } from '../components/Header';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import type { GameSettings } from '../types/game';
import { storageService } from '../services/storage';

interface SettingsScreenProps {
  settings: GameSettings;
  onUpdateSettings: (newSettings: GameSettings) => void;
  onBack: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  settings,
  onUpdateSettings,
  onBack,
}) => {
  const [isConfirmOpen, setIsConfirmOpen] = useState<boolean>(false);

  const handleToggleSound = () => {
    const updated = { ...settings, soundEnabled: !settings.soundEnabled };
    onUpdateSettings(updated);
  };

  const handleToggleVibration = () => {
    const updated = { ...settings, vibrationEnabled: !settings.vibrationEnabled };
    onUpdateSettings(updated);
  };

  const handleClearData = () => {
    storageService.clearAllData();
    setIsConfirmOpen(false);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 text-white select-none animate-fade-in">
      <Header title="Ayarlar" onBack={onBack} />

      <div className="flex-1 flex flex-col justify-between p-4 max-w-md mx-auto w-full space-y-6 overflow-y-auto">
        <div className="space-y-4 pt-2">
          {/* Sound Toggle */}
          <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-md">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
                {settings.soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5 text-slate-500" />}
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-white">Ses Efektleri</h3>
                <p className="text-xs text-slate-400">Dokunma ve oyun sesleri</p>
              </div>
            </div>

            <button
              onClick={handleToggleSound}
              className={`w-14 h-8 rounded-full p-1 transition-colors flex items-center ${
                settings.soundEnabled ? 'bg-cyan-500 justify-end' : 'bg-slate-800 justify-start'
              }`}
            >
              <span className="w-6 h-6 rounded-full bg-white shadow-md transform transition-transform" />
            </button>
          </div>

          {/* Vibration Toggle */}
          <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-md">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-white">Titreşim (Haptic)</h3>
                <p className="text-xs text-slate-400">Dokunmatik geri bildirim</p>
              </div>
            </div>

            <button
              onClick={handleToggleVibration}
              className={`w-14 h-8 rounded-full p-1 transition-colors flex items-center ${
                settings.vibrationEnabled ? 'bg-cyan-500 justify-end' : 'bg-slate-800 justify-start'
              }`}
            >
              <span className="w-6 h-6 rounded-full bg-white shadow-md transform transition-transform" />
            </button>
          </div>
        </div>

        {/* Danger zone: Clear data */}
        <div className="pt-4 border-t border-slate-900">
          <Button
            variant="danger"
            size="lg"
            fullWidth
            soundEnabled={settings.soundEnabled}
            vibrationEnabled={settings.vibrationEnabled}
            onClick={() => setIsConfirmOpen(true)}
          >
            <Trash2 className="w-5 h-5" />
            Tüm Rekorları Sıfırla
          </Button>
        </div>
      </div>

      <Modal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        title="Rekorları Sıfırla"
        description="Tüm tek oyunculu rekorlarınız ve maç geçmişiniz silinecektir. Bu işlem geri alınamaz."
        actionText="Evet, Sıfırla"
        onAction={handleClearData}
      />
    </div>
  );
};
