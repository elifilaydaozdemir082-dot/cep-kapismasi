import React, { useState, useEffect, useRef } from 'react';
import { Zap, Target, Flame, ShieldAlert, Star } from 'lucide-react';
import type { DifficultyLevel, MedalType, Player, SinglePlayerRecord } from '../types/game';
import { playBeepSound, playFanfareSound, playTapSound, triggerVibration } from '../utils/audio';

interface SinglePlayerTapGameProps {
  player: Player;
  difficulty: DifficultyLevel;
  onFinishGame: (
    finalScore: number,
    isNewRecord: boolean,
    record: SinglePlayerRecord,
    medal: MedalType,
    stats?: Record<string, number | string>
  ) => void;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
}

interface TargetItem {
  id: number;
  x: number;
  y: number;
  type: 'normal' | 'golden' | 'trap';
  durationMs: number;
  createdAt: number;
}

export const SinglePlayerTapGame: React.FC<SinglePlayerTapGameProps> = ({
  player,
  difficulty,
  onFinishGame,
  soundEnabled,
  vibrationEnabled,
}) => {
  const [score, setScore] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(20);
  const [targets, setTargets] = useState<TargetItem[]>([]);
  const [streak, setStreak] = useState<number>(0);
  const [maxStreak, setMaxStreak] = useState<number>(0);
  const [feedback, setFeedback] = useState<{ text: string; color: string } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const isFinishedRef = useRef<boolean>(false);

  const spawnIntervalMs = difficulty === 'easy' ? 700 : difficulty === 'normal' ? 500 : 350;
  const targetDurationMs = difficulty === 'easy' ? 1400 : difficulty === 'normal' ? 1000 : 750;

  // Main Game Countdown Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          finishGame();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Target Spawner Loop
  useEffect(() => {
    const spawner = setInterval(() => {
      spawnTarget();
    }, spawnIntervalMs);

    return () => clearInterval(spawner);
  }, [difficulty]);

  // Target Expiration Loop
  useEffect(() => {
    const cleaner = setInterval(() => {
      const now = Date.now();
      setTargets((prev) => prev.filter((t) => now - t.createdAt < t.durationMs));
    }, 100);

    return () => clearInterval(cleaner);
  }, []);

  const spawnTarget = () => {
    const rand = Math.random();
    let type: 'normal' | 'golden' | 'trap' = 'normal';
    if (rand < 0.15) type = 'golden';
    else if (rand < 0.3) type = 'trap';

    const newTarget: TargetItem = {
      id: Math.random(),
      x: 10 + Math.random() * 80,
      y: 15 + Math.random() * 70,
      type,
      durationMs: targetDurationMs,
      createdAt: Date.now(),
    };

    setTargets((prev) => [...prev.slice(-6), newTarget]);
  };

  const handleTapTarget = (target: TargetItem, e: React.MouseEvent) => {
    e.stopPropagation();

    if (target.type === 'trap') {
      playBeepSound(150, 0.3, soundEnabled);
      triggerVibration(40, vibrationEnabled);
      setScore((s) => Math.max(0, s - 2));
      setStreak(0);
      setFeedback({ text: '-2 TUZAK!', color: 'text-rose-500' });
    } else if (target.type === 'golden') {
      playFanfareSound(soundEnabled);
      triggerVibration([20, 30], vibrationEnabled);
      const earned = 3 + (streak >= 5 ? 2 : 0);
      setScore((s) => s + earned);
      const nextStreak = streak + 1;
      setStreak(nextStreak);
      setMaxStreak((m) => Math.max(m, nextStreak));
      setFeedback({ text: `+${earned} ALTIN ISABET!`, color: 'text-amber-400' });
    } else {
      playTapSound(soundEnabled);
      triggerVibration(10, vibrationEnabled);
      const earned = 1 + (streak >= 5 ? 1 : 0);
      setScore((s) => s + earned);
      const nextStreak = streak + 1;
      setStreak(nextStreak);
      setMaxStreak((m) => Math.max(m, nextStreak));
    }

    setTargets((prev) => prev.filter((t) => t.id !== target.id));
    setTimeout(() => setFeedback(null), 800);
  };

  const finishGame = () => {
    if (isFinishedRef.current) return;
    isFinishedRef.current = true;

    onFinishGame(score, false, {
      score,
      date: new Date().toISOString(),
      playerName: player.name,
      gameType: 'tap-rush',
      unit: 'puan',
      difficulty,
      medal: 'none',
    }, 'none', {
      'İsabet Skoru': score,
      'En Uzun Seri': maxStreak,
    });
  };

  return (
    <div className="relative flex-1 flex flex-col h-full w-full bg-slate-950 text-white select-none overflow-hidden touch-none p-3 space-y-2">
      {/* Header Bar */}
      <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3 shadow-md">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-cyan-400" aria-hidden="true" />
          <span className="font-extrabold text-sm text-white">Hedef Avı</span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-black text-amber-400 bg-amber-400/10 border border-amber-400/20 px-3 py-1 rounded-full">
            Süre: {timeLeft}s
          </span>
          <span className="text-xs font-black text-cyan-400">Skor: {score}</span>
        </div>
      </div>

      {/* Streak Badge */}
      {streak >= 5 && (
        <div className="flex items-center justify-center gap-1.5 bg-amber-400 text-slate-950 font-black text-xs px-4 py-1 rounded-full mx-auto shadow-lg animate-bounce">
          <Flame className="w-4 h-4 fill-current" aria-hidden="true" />
          <span>SERİ BONUSU KATLANDI! (x2)</span>
        </div>
      )}

      {/* Main Target Arena */}
      <div
        ref={containerRef}
        className="flex-1 relative bg-slate-900 border-2 border-slate-800 rounded-3xl overflow-hidden shadow-2xl p-4"
      >
        {/* Feedback Banner */}
        {feedback && (
          <div className={`absolute top-4 left-1/2 -translate-x-1/2 z-40 bg-slate-950/95 border border-cyan-500 px-5 py-2 rounded-full font-black text-xs shadow-2xl animate-scale-up ${feedback.color}`}>
            {feedback.text}
          </div>
        )}

        {/* Dynamic Spawned Targets */}
        {targets.map((target) => (
          <button
            key={target.id}
            onClick={(e) => handleTapTarget(target, e)}
            style={{
              left: `${target.x}%`,
              top: `${target.y}%`,
            }}
            className={`absolute -translate-x-1/2 -translate-y-1/2 w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl border-2 transition-all active:scale-90 animate-scale-up ${
              target.type === 'golden'
                ? 'bg-amber-400 border-white text-slate-950 ring-4 ring-amber-400/30'
                : target.type === 'trap'
                ? 'bg-rose-600 border-white text-white ring-4 ring-rose-600/30'
                : 'bg-cyan-500 border-white text-slate-950 ring-4 ring-cyan-500/30'
            }`}
          >
            {target.type === 'golden' ? (
              <Star className="w-7 h-7 fill-current" aria-hidden="true" />
            ) : target.type === 'trap' ? (
              <ShieldAlert className="w-7 h-7 stroke-[2.5]" aria-hidden="true" />
            ) : (
              <Target className="w-7 h-7 stroke-[2.5]" aria-hidden="true" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
};
