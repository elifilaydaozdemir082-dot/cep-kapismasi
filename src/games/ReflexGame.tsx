import React, { useState, useEffect, useRef } from 'react';
import { Activity, Zap } from 'lucide-react';
import type { Player } from '../types/game';
import { playBeepSound, playFanfareSound, triggerVibration } from '../utils/audio';

interface ReflexGameProps {
  mode: 'single' | 'multi';
  players: Player[];
  onFinishGame: (results: { playerId: string; score: number; stats?: Record<string, number | string> }[]) => void;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
}

export const ReflexGame: React.FC<ReflexGameProps> = ({
  mode,
  players,
  onFinishGame,
  soundEnabled,
  vibrationEnabled,
}) => {
  const [roundState, setRoundState] = useState<'waiting' | 'ready' | 'go' | 'foul' | 'round-end'>('waiting');
  const [statusMessage, setStatusMessage] = useState<string>('HAZIRLANIN...');
  const [currentRound, setCurrentRound] = useState<number>(1);
  const totalRounds = 5;

  const [playerScores, setPlayerScores] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    players.forEach((p) => (initial[p.id] = 0));
    return initial;
  });

  const [bestReactionMs, setBestReactionMs] = useState<number | null>(null);

  const goTimeoutRef = useRef<any>(null);
  const goStartTimeRef = useRef<number>(0);
  const isFinishedRef = useRef<boolean>(false);

  useEffect(() => {
    startNewRound();
    return () => {
      if (goTimeoutRef.current) clearTimeout(goTimeoutRef.current);
    };
  }, [currentRound]);

  const startNewRound = () => {
    setRoundState('ready');
    setStatusMessage('BEKLEYİN...');

    const randomDelay = 2000 + Math.random() * 3500;
    goTimeoutRef.current = setTimeout(() => {
      setRoundState('go');
      setStatusMessage('DOKUN!');
      goStartTimeRef.current = performance.now();
      playBeepSound(880, 0.15, soundEnabled);
      triggerVibration(20, vibrationEnabled);
    }, randomDelay);
  };

  const handleTap = (playerId: string) => {
    if (roundState === 'ready') {
      if (goTimeoutRef.current) clearTimeout(goTimeoutRef.current);
      setRoundState('foul');
      playBeepSound(150, 0.3, soundEnabled);
      triggerVibration(50, vibrationEnabled);
      setStatusMessage('ERKEN DOKUNUŞ! FAUL!');

      setTimeout(() => advanceRound(), 1500);
      return;
    }

    if (roundState === 'go') {
      const reactionMs = Math.round(performance.now() - goStartTimeRef.current);
      setRoundState('round-end');

      playFanfareSound(soundEnabled);
      triggerVibration(15, vibrationEnabled);

      setPlayerScores((prev) => ({
        ...prev,
        [playerId]: prev[playerId] + 1,
      }));

      if (bestReactionMs === null || reactionMs < bestReactionMs) {
        setBestReactionMs(reactionMs);
      }

      setStatusMessage(`${reactionMs} ms!`);

      setTimeout(() => advanceRound(), 1800);
    }
  };

  const advanceRound = () => {
    if (currentRound < totalRounds) {
      setCurrentRound((prev) => prev + 1);
    } else {
      finishGame();
    }
  };

  const finishGame = () => {
    if (isFinishedRef.current) return;
    isFinishedRef.current = true;

    if (mode === 'single') {
      const finalMs = bestReactionMs || 500;
      onFinishGame([
        {
          playerId: players[0].id,
          score: finalMs,
          stats: {
            'En Hızlı Tepki': `${finalMs} ms`,
          },
        },
      ]);
    } else {
      const sorted = [...players].sort((a, b) => (playerScores[b.id] || 0) - (playerScores[a.id] || 0));
      const winner = sorted[0];
      setStatusMessage(`${winner?.name || 'Oyuncu'} KAZANDI!`);

      const results = players.map((p) => ({
        playerId: p.id,
        score: playerScores[p.id] || 0,
        stats: {
          'Kazanılan Raund': playerScores[p.id] || 0,
        },
      }));

      onFinishGame(results);
    }
  };

  return (
    <div className="relative flex-1 flex flex-col h-full w-full bg-slate-950 text-white select-none overflow-hidden touch-none p-4">
      {/* Header Bar */}
      <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3 shadow-md mb-2">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-rose-500" aria-hidden="true" />
          <span className="font-extrabold text-sm text-white">Refleks Düellosu</span>
        </div>

        <span className="text-xs font-black text-amber-400 bg-amber-400/10 border border-amber-400/20 px-3 py-1 rounded-full">
          Raund {currentRound} / {totalRounds}
        </span>
      </div>

      {/* Main Interactive Arena */}
      <div
        className={`flex-1 rounded-3xl border-4 flex flex-col items-center justify-center text-center p-6 space-y-4 shadow-2xl transition-colors duration-300 ${
          roundState === 'go'
            ? 'bg-emerald-600 border-emerald-400 text-slate-950 animate-pulse'
            : roundState === 'foul'
            ? 'bg-rose-950 border-rose-500 text-rose-300'
            : 'bg-slate-900 border-slate-800 text-white'
        }`}
      >
        <Zap className="w-16 h-16 fill-current animate-bounce" aria-hidden="true" />
        <h2 className="text-3xl font-black tracking-wider uppercase drop-shadow-md">
          {statusMessage}
        </h2>
      </div>

      {/* Tap Buttons */}
      <div className={`grid gap-3 pt-3 ${players.length > 2 ? 'grid-cols-2' : 'grid-cols-1'}`}>
        {players.map((p) => (
          <button
            key={p.id}
            onClick={() => handleTap(p.id)}
            style={{ backgroundColor: p.color }}
            className="py-5 rounded-2xl font-black text-xl text-slate-950 shadow-xl border-2 border-white/30 active:scale-95 transition-transform"
          >
            {p.name} - DOKUN!
          </button>
        ))}
      </div>
    </div>
  );
};
