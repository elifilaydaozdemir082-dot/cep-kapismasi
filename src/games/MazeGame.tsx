import React, { useState, useEffect, useRef } from 'react';
import { Compass, Key, Navigation } from 'lucide-react';
import type { Player } from '../types/game';
import { playBeepSound, playFanfareSound, triggerVibration } from '../utils/audio';

interface MazeGameProps {
  mode: 'single' | 'multi';
  players: Player[];
  onFinishGame: (results: { playerId: string; score: number; stats?: Record<string, number | string> }[]) => void;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
}

export const MazeGame: React.FC<MazeGameProps> = ({
  players,
  onFinishGame,
  soundEnabled,
  vibrationEnabled,
}) => {
  const [playerPos, setPlayerPos] = useState<{ x: number; y: number }>({ x: 10, y: 10 });
  const [hasKey, setHasKey] = useState<boolean>(false);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [feedback, setFeedback] = useState<string | null>(null);

  const elapsedTimeRef = useRef<number>(0);
  const isFinishedRef = useRef<boolean>(false);

  useEffect(() => {
    const timer = setInterval(() => {
      if (isFinishedRef.current) return;
      setElapsedTime((prev) => {
        const next = +(prev + 0.1).toFixed(1);
        elapsedTimeRef.current = next;
        return next;
      });
    }, 100);

    return () => clearInterval(timer);
  }, []);

  const handleMove = (dx: number, dy: number) => {
    if (isFinishedRef.current) return;

    setPlayerPos((prev) => {
      const nextX = Math.min(85, Math.max(10, prev.x + dx));
      const nextY = Math.min(85, Math.max(10, prev.y + dy));

      // Wall collision check demo
      if (nextX > 35 && nextX < 45 && nextY < 60) {
        playBeepSound(150, 0.2, soundEnabled);
        triggerVibration(40, vibrationEnabled);
        setFeedback('DUVARA ÇARPTIN! (+0.2s CEZA)');
        setElapsedTime((t) => {
          const next = +(t + 0.2).toFixed(1);
          elapsedTimeRef.current = next;
          return next;
        });
        setTimeout(() => setFeedback(null), 1000);
        return prev;
      }

      // Key pickup
      if (!hasKey && Math.hypot(nextX - 50, nextY - 50) < 8) {
        setHasKey(true);
        playFanfareSound(soundEnabled);
        triggerVibration([20, 30], vibrationEnabled);
        setFeedback('ANAHTAR ALINDI!');
        setTimeout(() => setFeedback(null), 1000);
      }

      // Exit check
      if (hasKey && nextX > 75 && nextY > 75) {
        finishGame();
      }

      return { x: nextX, y: nextY };
    });
  };

  const finishGame = () => {
    if (isFinishedRef.current) return;
    isFinishedRef.current = true;

    const finalTime = elapsedTimeRef.current;
    playFanfareSound(soundEnabled);
    onFinishGame([
      {
        playerId: players[0].id,
        score: finalTime,
        stats: {
          'Tamamlama Süresi': `${finalTime}s`,
        },
      },
    ]);
  };

  return (
    <div className="relative flex-1 flex flex-col h-full w-full bg-slate-950 text-white select-none overflow-hidden touch-none p-3 space-y-2">
      {/* Header Bar */}
      <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3 shadow-md">
        <div className="flex items-center gap-2">
          <Compass className="w-5 h-5 text-indigo-400" aria-hidden="true" />
          <span className="font-extrabold text-sm text-white">Labirent Kaçışı</span>
        </div>

        <span className="text-xs font-black text-amber-400 bg-amber-400/10 border border-amber-400/20 px-3 py-1 rounded-full">
          Süre: {elapsedTime}s
        </span>
      </div>

      {/* Main Maze Arena */}
      <div className="flex-1 relative bg-slate-900 border-2 border-slate-800 rounded-3xl overflow-hidden shadow-2xl p-4">
        {/* Feedback Banner */}
        {feedback && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 bg-slate-950/95 border border-indigo-500 px-5 py-2 rounded-full font-black text-xs text-amber-400 shadow-2xl animate-scale-up">
            {feedback}
          </div>
        )}

        {/* Maze Walls Visual */}
        <div className="absolute left-[40%] top-0 bottom-[40%] w-3 bg-slate-800 border border-slate-700 rounded-full" />

        {/* Key Item */}
        {!hasKey && (
          <div className="absolute left-[50%] top-[50%] -translate-x-1/2 -translate-y-1/2 p-2 rounded-xl bg-amber-400 text-slate-950 shadow-lg animate-pulse">
            <Key className="w-6 h-6 stroke-[2.5]" aria-hidden="true" />
          </div>
        )}

        {/* Exit Goal */}
        <div className="absolute right-4 bottom-4 w-12 h-12 rounded-2xl bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center font-black text-xs text-emerald-400">
          ÇIKIŞ
        </div>

        {/* Player Character */}
        <div
          style={{ left: `${playerPos.x}%`, top: `${playerPos.y}%` }}
          className="absolute -translate-x-1/2 -translate-y-1/2 p-2.5 rounded-2xl bg-cyan-500 border-2 border-white shadow-xl transition-all duration-100 z-30"
        >
          <Navigation className="w-6 h-6 text-slate-950 stroke-[2.5]" aria-hidden="true" />
        </div>
      </div>

      {/* D-Pad Controls */}
      <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto pt-2">
        <div />
        <button
          onClick={() => handleMove(0, -10)}
          className="py-3 rounded-2xl bg-slate-900 border border-slate-800 text-white font-black text-sm active:scale-95"
        >
          YUKARI
        </button>
        <div />
        <button
          onClick={() => handleMove(-10, 0)}
          className="py-3 rounded-2xl bg-slate-900 border border-slate-800 text-white font-black text-sm active:scale-95"
        >
          SOL
        </button>
        <button
          onClick={() => handleMove(0, 10)}
          className="py-3 rounded-2xl bg-slate-900 border border-slate-800 text-white font-black text-sm active:scale-95"
        >
          AŞAĞI
        </button>
        <button
          onClick={() => handleMove(10, 0)}
          className="py-3 rounded-2xl bg-slate-900 border border-slate-800 text-white font-black text-sm active:scale-95"
        >
          SAĞ
        </button>
      </div>
    </div>
  );
};
