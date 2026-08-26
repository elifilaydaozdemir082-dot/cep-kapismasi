import React, { useState, useEffect } from 'react';
import { Swords, Bot } from 'lucide-react';
import type { Player } from '../types/game';
import { playBeepSound, playFanfareSound, playTapSound, triggerVibration } from '../utils/audio';

interface TugOfWarGameProps {
  mode: 'single' | 'multi';
  players: Player[];
  onFinishGame: (results: { playerId: string; score: number; stats?: Record<string, number | string> }[]) => void;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
}

export const TugOfWarGame: React.FC<TugOfWarGameProps> = ({
  mode,
  players,
  onFinishGame,
  soundEnabled,
  vibrationEnabled,
}) => {
  const [ropePosition, setRopePosition] = useState<number>(50); // 0..100%, 50 is center
  const [isFinished, setIsFinished] = useState<boolean>(false);

  const player1 = players[0];
  const player2 = players[1] || { id: 'bot', name: 'Bot Rakip', color: '#EF4444', score: 0 };

  // Single player AI pull loop
  useEffect(() => {
    if (mode !== 'single' || isFinished) return;

    const interval = setInterval(() => {
      setRopePosition((prev) => {
        const next = prev + 1.2; // AI pulls right
        if (next >= 90) {
          clearInterval(interval);
          handleGameEnd(player2);
          return 100;
        }
        return next;
      });
    }, 150);

    return () => clearInterval(interval);
  }, [mode, isFinished]);

  const handlePullLeft = () => {
    if (isFinished) return;
    playTapSound(soundEnabled);
    triggerVibration(10, vibrationEnabled);

    setRopePosition((prev) => {
      const next = prev - 3.5;
      if (next <= 10) {
        handleGameEnd(player1);
        return 0;
      }
      return next;
    });
  };

  const handlePullRight = () => {
    if (isFinished || mode === 'single') return;
    playTapSound(soundEnabled);
    triggerVibration(10, vibrationEnabled);

    setRopePosition((prev) => {
      const next = prev + 3.5;
      if (next >= 90) {
        handleGameEnd(player2);
        return 100;
      }
      return next;
    });
  };

  const handleGameEnd = (winner: Player) => {
    if (isFinished) return;
    setIsFinished(true);

    if (winner.id === player1.id) {
      playFanfareSound(soundEnabled);
      triggerVibration([20, 30], vibrationEnabled);
    } else {
      playBeepSound(200, 0.3, soundEnabled);
      triggerVibration(50, vibrationEnabled);
    }

    const results = [
      {
        playerId: player1.id,
        score: winner.id === player1.id ? 100 : 30,
        stats: {
          'Sonuç': winner.id === player1.id ? 'KAZANDI' : 'KAYBETTİ',
        },
      },
    ];

    if (mode === 'multi' && players[1]) {
      results.push({
        playerId: players[1].id,
        score: winner.id === players[1].id ? 100 : 30,
        stats: {
          'Sonuç': winner.id === players[1].id ? 'KAZANDI' : 'KAYBETTİ',
        },
      });
    }

    setTimeout(() => onFinishGame(results), 1200);
  };

  return (
    <div className="relative flex-1 flex flex-col h-full w-full bg-slate-950 text-white select-none overflow-hidden touch-none p-3 space-y-2">
      {/* Header Bar */}
      <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3 shadow-md">
        <div className="flex items-center gap-2">
          <Swords className="w-5 h-5 text-purple-400" aria-hidden="true" />
          <span className="font-extrabold text-sm text-white">Halat Çekme</span>
        </div>

        <span className="text-xs font-black text-amber-400 bg-amber-400/10 border border-amber-400/20 px-3 py-1 rounded-full">
          Hızlı Dokun!
        </span>
      </div>

      {/* Main Rope Pitch Track */}
      <div className="flex-1 relative bg-slate-900 border-2 border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col justify-between p-4 my-auto">
        {/* Left Team Indicator */}
        <div className="flex justify-between items-center text-xs font-black">
          <span style={{ color: player1.color }}>{player1.name} (SOL)</span>
          <span style={{ color: player2.color }}>
            {mode === 'single' ? 'BOT RAKİP' : `${player2.name} (SAĞ)`}
          </span>
        </div>

        {/* Rope Track Visual */}
        <div className="relative w-full h-12 bg-slate-950 border border-slate-800 rounded-2xl my-auto flex items-center px-2">
          {/* Center Red Line */}
          <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-rose-500 z-10 -translate-x-1/2" />

          {/* Rope */}
          <div className="w-full h-3 bg-amber-600 rounded-full relative overflow-hidden">
            {/* Knot / Flag Indicator */}
            <div
              style={{ left: `${ropePosition}%` }}
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-cyan-400 border-2 border-white shadow-xl z-20"
            />
          </div>
        </div>

        {/* Action Touch Buttons */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            onClick={handlePullLeft}
            disabled={isFinished}
            style={{ backgroundColor: player1.color }}
            className="py-8 rounded-2xl font-black text-xl text-slate-950 shadow-xl border-2 border-white/30 active:scale-95 transition-transform"
          >
            {player1.name} ÇEK!
          </button>

          <button
            onClick={handlePullRight}
            disabled={isFinished || mode === 'single'}
            style={{ backgroundColor: player2.color }}
            className={`py-8 rounded-2xl font-black text-xl shadow-xl border-2 transition-transform ${
              mode === 'single'
                ? 'bg-slate-800 border-slate-700 text-slate-500 opacity-50'
                : 'text-slate-950 border-white/30 active:scale-95'
            }`}
          >
            {mode === 'single' ? (
              <span className="flex items-center justify-center gap-1">
                <Bot className="w-5 h-5" aria-hidden="true" /> BOT ÇEKİYOR...
              </span>
            ) : (
              `${player2.name} ÇEK!`
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
