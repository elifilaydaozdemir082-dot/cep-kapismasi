import React, { useState } from 'react';
import { User, Users, Check, Play } from 'lucide-react';
import { Button } from '../components/Button';
import { Header } from '../components/Header';
import type { GameMode, Player } from '../types/game';
import { PLAYER_COLORS, type PlayerColorOption, getDefaultColorForPlayer } from '../utils/colors';

interface PlayerSetupScreenProps {
  mode: GameMode;
  onBack: () => void;
  onConfirmSetup: (players: Player[]) => void;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
}

export const PlayerSetupScreen: React.FC<PlayerSetupScreenProps> = ({
  mode,
  onBack,
  onConfirmSetup,
  soundEnabled,
  vibrationEnabled,
}) => {
  // Multiplayer count state (2, 3, or 4)
  const [playerCount, setPlayerCount] = useState<number>(2);

  // Single player setup state
  const [singleName, setSingleName] = useState<string>('Oyuncu 1');
  const [singleColor, setSingleColor] = useState<PlayerColorOption>(PLAYER_COLORS[0]);

  // Multi player setup state (up to 4 players)
  const [multiPlayers, setMultiPlayers] = useState<{ name: string; color: PlayerColorOption }[]>([
    { name: '1. Oyuncu', color: getDefaultColorForPlayer(0) },
    { name: '2. Oyuncu', color: getDefaultColorForPlayer(1) },
    { name: '3. Oyuncu', color: getDefaultColorForPlayer(2) },
    { name: '4. Oyuncu', color: getDefaultColorForPlayer(3) },
  ]);

  const handleMultiNameChange = (index: number, name: string) => {
    const updated = [...multiPlayers];
    updated[index].name = name;
    setMultiPlayers(updated);
  };

  const handleMultiColorSelect = (playerIndex: number, color: PlayerColorOption) => {
    const updated = [...multiPlayers];
    const existingIndex = updated.findIndex(
      (p, idx) => idx !== playerIndex && p.color.id === color.id
    );

    // If another player already has this color, swap their colors so duplicates never occur!
    if (existingIndex !== -1) {
      const prevColor = updated[playerIndex].color;
      updated[existingIndex].color = prevColor;
    }

    updated[playerIndex].color = color;
    setMultiPlayers(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'single') {
      const player: Player = {
        id: 'p1',
        name: singleName.trim() || 'Oyuncu 1',
        color: singleColor.hex,
        score: 0,
      };
      onConfirmSetup([player]);
    } else {
      const selected = multiPlayers.slice(0, playerCount).map((p, idx) => ({
        id: `p${idx + 1}`,
        name: p.name.trim() || `${idx + 1}. Oyuncu`,
        color: p.color.hex,
        score: 0,
      }));
      onConfirmSetup(selected);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 text-white select-none animate-fade-in">
      <Header
        title={mode === 'single' ? 'Tek Oyuncu Ayarı' : 'Oyuncu Ayarları'}
        onBack={onBack}
      />

      <form onSubmit={handleSubmit} className="flex-1 flex flex-col justify-between p-4 max-w-md mx-auto w-full space-y-6 overflow-y-auto">
        {mode === 'single' ? (
          /* Single Player Form */
          <div className="space-y-6 pt-2">
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-lg">
              <div className="flex items-center gap-3 text-cyan-400">
                <User className="w-6 h-6" />
                <h2 className="text-lg font-bold text-white">Oyuncu Bilgisi</h2>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Adınız
                </label>
                <input
                  type="text"
                  maxLength={16}
                  value={singleName}
                  onChange={(e) => setSingleName(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-700 text-white font-bold placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
                  placeholder="Adınızı yazın"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Renginiz
                </label>
                <div className="grid grid-cols-3 gap-3 pt-1">
                  {PLAYER_COLORS.map((c) => {
                    const isSelected = singleColor.id === c.id;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setSingleColor(c)}
                        style={{ backgroundColor: c.hex }}
                        className={`h-12 rounded-2xl flex items-center justify-center font-bold text-white shadow-md transition-all active:scale-95 ${
                          isSelected ? 'ring-4 ring-white shadow-xl scale-105' : 'opacity-80 hover:opacity-100'
                        }`}
                      >
                        {isSelected && <Check className="w-6 h-6 drop-shadow-md" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Multi Player Form */
          <div className="space-y-6 pt-1">
            {/* Player count selector */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-4 space-y-3">
              <div className="flex items-center gap-2 text-cyan-400">
                <Users className="w-5 h-5" />
                <label className="text-sm font-extrabold text-white uppercase tracking-wider">
                  Oyuncu Sayısı
                </label>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[2, 3, 4].map((count) => (
                  <button
                    key={count}
                    type="button"
                    onClick={() => setPlayerCount(count)}
                    className={`py-3 rounded-2xl font-black text-lg transition-all active:scale-95 border ${
                      playerCount === count
                        ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-lg shadow-cyan-500/25'
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                    }`}
                  >
                    {count} Kişi
                  </button>
                ))}
              </div>
            </div>

            {/* Players list */}
            <div className="space-y-4">
              {multiPlayers.slice(0, playerCount).map((player, idx) => (
                <div
                  key={idx}
                  className="bg-slate-900/80 border border-slate-800 rounded-3xl p-4 space-y-3 shadow-md"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: player.color.hex }}
                      />
                      <span className="text-xs font-black uppercase text-slate-400">
                        {idx + 1}. Oyuncu
                      </span>
                    </div>
                    <span className="text-xs text-slate-400 font-semibold">
                      {player.color.name}
                    </span>
                  </div>

                  <input
                    type="text"
                    maxLength={12}
                    value={player.name}
                    onChange={(e) => handleMultiNameChange(idx, e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl bg-slate-950 border border-slate-700 text-white font-bold text-sm focus:outline-none focus:border-cyan-500"
                    placeholder={`${idx + 1}. Oyuncu Adı`}
                  />

                  {/* Color selector per player */}
                  <div className="flex gap-2 pt-1 overflow-x-auto pb-1">
                    {PLAYER_COLORS.map((c) => {
                      const isSelected = player.color.id === c.id;
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => handleMultiColorSelect(idx, c)}
                          style={{ backgroundColor: c.hex }}
                          className={`w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center transition-all ${
                            isSelected ? 'ring-2 ring-white scale-110 shadow-md' : 'opacity-60 hover:opacity-90'
                          }`}
                        >
                          {isSelected && <Check className="w-5 h-5 text-white drop-shadow" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Submit button */}
        <div className="pt-4 pb-2">
          <Button
            type="submit"
            variant="primary"
            size="xl"
            fullWidth
            soundEnabled={soundEnabled}
            vibrationEnabled={vibrationEnabled}
          >
            {mode === 'single' ? (
              <>
                <Play className="w-6 h-6 fill-current" />
                Oyuna Başla
              </>
            ) : (
              'Devam Et'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};
