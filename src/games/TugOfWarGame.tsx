import React, { useState, useEffect, useRef } from 'react';
import { Swords, Bot, Zap } from 'lucide-react';
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
  const [lastPullTeam, setLastPullTeam] = useState<'left' | 'right' | null>(null);

  const isFinishedRef = useRef<boolean>(false);

  const player1 = players[0];
  const player2 = players[1] || { id: 'bot', name: 'Bot Rakip', color: '#EF4444', score: 0 };

  // Single player AI pull loop
  useEffect(() => {
    if (mode !== 'single' || isFinishedRef.current) return;

    const interval = setInterval(() => {
      setRopePosition((prev) => {
        const next = prev + 1.4; // AI pulls right
        setLastPullTeam('right');
        if (next >= 88) {
          clearInterval(interval);
          handleGameEnd(player2);
          return 100;
        }
        return next;
      });
    }, 140);

    return () => clearInterval(interval);
  }, [mode, isFinished]);

  const handlePullLeft = () => {
    if (isFinishedRef.current) return;
    playTapSound(soundEnabled);
    triggerVibration(10, vibrationEnabled);
    setLastPullTeam('left');

    setRopePosition((prev) => {
      const next = prev - 3.8;
      if (next <= 12) {
        handleGameEnd(player1);
        return 0;
      }
      return next;
    });
  };

  const handlePullRight = () => {
    if (isFinishedRef.current || mode === 'single') return;
    playTapSound(soundEnabled);
    triggerVibration(10, vibrationEnabled);
    setLastPullTeam('right');

    setRopePosition((prev) => {
      const next = prev + 3.8;
      if (next >= 88) {
        handleGameEnd(player2);
        return 100;
      }
      return next;
    });
  };

  const handleGameEnd = (winner: Player) => {
    if (isFinishedRef.current) return;
    isFinishedRef.current = true;
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
          <span className="font-extrabold text-sm text-white">Halat Çekme Düellosu</span>
        </div>

        <span className="text-xs font-black text-amber-400 bg-amber-400/10 border border-amber-400/20 px-3 py-1 rounded-full">
          En Hızlı Dokunan Çeker!
        </span>
      </div>

      {/* Main Rope Field & Animation Arena */}
      <div className="flex-1 relative bg-gradient-to-b from-slate-950 via-slate-900 to-indigo-950/30 border-2 border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col justify-between p-4 my-auto">
        {/* Team Status Headers */}
        <div className="flex justify-between items-center text-xs font-black bg-slate-950/80 border border-slate-800 rounded-2xl px-4 py-2.5 shadow-inner">
          <div className="flex items-center gap-2">
            <span style={{ backgroundColor: player1.color }} className="w-3.5 h-3.5 rounded-full animate-pulse" />
            <span style={{ color: player1.color }} className="text-sm font-black">
              {player1.name} (SOL)
            </span>
          </div>

          <Zap className="w-4 h-4 text-amber-400 animate-bounce" />

          <div className="flex items-center gap-2">
            <span style={{ color: player2.color }} className="text-sm font-black">
              {mode === 'single' ? 'BOT RAKİP' : `${player2.name} (SAĞ)`}
            </span>
            <span style={{ backgroundColor: player2.color }} className="w-3.5 h-3.5 rounded-full animate-pulse" />
          </div>
        </div>

        {/* Rope Stadium Arena Track */}
        <div className="relative w-full h-40 bg-slate-950 border-2 border-slate-800 rounded-3xl my-auto flex flex-col justify-center px-4 shadow-inner overflow-hidden">
          {/* Ground Markings */}
          <div className="absolute inset-0 flex justify-between pointer-events-none opacity-20">
            <div className="w-1/4 bg-blue-500/20 border-r border-blue-400" />
            <div className="w-1/2 bg-amber-500/10" />
            <div className="w-1/4 bg-rose-500/20 border-l border-rose-400" />
          </div>

          {/* Central Win Boundary Markers */}
          <div className="absolute left-1/4 top-0 bottom-0 w-1 bg-cyan-400/40 border-r border-dashed border-cyan-400" />
          <div className="absolute left-1/2 top-0 bottom-0 w-1.5 bg-rose-500 z-10 -translate-x-1/2 shadow-lg shadow-rose-500/50" />
          <div className="absolute right-1/4 top-0 bottom-0 w-1 bg-cyan-400/40 border-l border-dashed border-cyan-400" />

          {/* Dynamic Textured Rope SVG */}
          <div className="relative w-full h-12 flex items-center">
            <svg width="100%" height="40" className="w-full h-10 overflow-visible">
              <defs>
                <linearGradient id="ropeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#D97706" />
                  <stop offset="50%" stopColor="#F59E0B" />
                  <stop offset="100%" stopColor="#B45309" />
                </linearGradient>
              </defs>

              {/* Rope Main Strand */}
              <line x1="0" y1="20" x2="100%" y2="20" stroke="url(#ropeGrad)" strokeWidth="12" strokeLinecap="round" />
              <line x1="0" y1="20" x2="100%" y2="20" stroke="#78350F" strokeWidth="10" strokeDasharray="8 6" strokeLinecap="round" />
            </svg>

            {/* Central Red Knot & Flag Indicator */}
            <div
              style={{ left: `${ropePosition}%` }}
              className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 transition-all duration-150 z-30 flex flex-col items-center ${
                lastPullTeam ? 'scale-110' : ''
              }`}
            >
              <div className="w-8 h-8 rounded-full bg-rose-600 border-2 border-white shadow-2xl flex items-center justify-center text-white font-black text-xs">
                🚩
              </div>
              <div className="w-1 h-8 bg-rose-500 shadow-md" />
            </div>
          </div>
        </div>

        {/* Action Touch Buttons */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            onClick={handlePullLeft}
            disabled={isFinished}
            style={{ backgroundColor: player1.color }}
            className="py-7 rounded-2xl font-black text-xl text-slate-950 shadow-xl border-2 border-white/30 active:scale-95 transition-all hover:brightness-110 flex items-center justify-center gap-2"
          >
            <span>{player1.name} ÇEK!</span>
          </button>

          <button
            onClick={handlePullRight}
            disabled={isFinished || mode === 'single'}
            style={{ backgroundColor: player2.color }}
            className={`py-7 rounded-2xl font-black text-xl shadow-xl border-2 transition-all flex items-center justify-center gap-2 ${
              mode === 'single'
                ? 'bg-slate-800 border-slate-700 text-slate-500 opacity-50'
                : 'text-slate-950 border-white/30 active:scale-95 hover:brightness-110'
            }`}
          >
            {mode === 'single' ? (
              <span className="flex items-center justify-center gap-2">
                <Bot className="w-6 h-6 animate-spin" aria-hidden="true" /> BOT ÇEKİYOR...
              </span>
            ) : (
              <span>{player2.name} ÇEK!</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
