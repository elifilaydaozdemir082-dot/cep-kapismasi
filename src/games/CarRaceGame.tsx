import React, { useState, useEffect, useRef } from 'react';
import { Car, Shield, Zap, Heart } from 'lucide-react';
import type { DifficultyLevel, Player } from '../types/game';
import { playBeepSound, playFanfareSound, playTapSound, triggerVibration } from '../utils/audio';

interface CarRaceGameProps {
  mode: 'single' | 'multi';
  players: Player[];
  difficulty: DifficultyLevel;
  onFinishGame: (results: { playerId: string; score: number; stats?: Record<string, number | string> }[]) => void;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
}

interface Obstacle {
  id: number;
  lane: number;
  y: number; // 0..100%
  type: 'car' | 'cone' | 'oil';
  color: string;
}

interface Powerup {
  id: number;
  lane: number;
  y: number;
  type: 'shield' | 'nitro';
}

export const CarRaceGame: React.FC<CarRaceGameProps> = ({
  mode,
  players,
  difficulty,
  onFinishGame,
  soundEnabled,
  vibrationEnabled,
}) => {
  const [playerLane, setPlayerLane] = useState<number>(1);
  const [distance, setDistance] = useState<number>(0);
  const [lives, setLives] = useState<number>(3);
  const [hasShield, setHasShield] = useState<boolean>(false);
  const [isNitro, setIsNitro] = useState<boolean>(false);
  const [streakMultiplier, setStreakMultiplier] = useState<number>(1);
  const [feedbackText, setFeedbackText] = useState<string | null>(null);

  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [powerups, setPowerups] = useState<Powerup[]>([]);

  const [multiTapScores, setMultiTapScores] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    players.forEach((p) => (initial[p.id] = 0));
    return initial;
  });
  const [multiTimeLeft, setMultiTimeLeft] = useState<number>(15);

  const animFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(performance.now());
  const isFinishedRef = useRef<boolean>(false);

  const baseSpeed = difficulty === 'easy' ? 0.35 : difficulty === 'normal' ? 0.5 : 0.7;

  useEffect(() => {
    if (mode !== 'single') return;

    const gameLoop = (now: number) => {
      const dt = Math.min(100, now - lastTimeRef.current);
      lastTimeRef.current = now;

      const speedFactor = isNitro ? 2.0 : 1.0;
      const currentSpeed = baseSpeed * speedFactor;

      setDistance((prev) => Math.round(prev + currentSpeed * (dt / 16)));

      setObstacles((prev) => {
        const updated = prev
          .map((obs) => ({ ...obs, y: obs.y + currentSpeed * (dt / 16) }))
          .filter((obs) => obs.y < 110);

        updated.forEach((obs) => {
          if (obs.y > 75 && obs.y < 92 && obs.lane === playerLane) {
            handleCollision(obs);
          }
        });

        return updated;
      });

      setPowerups((prev) => {
        const updated = prev
          .map((p) => ({ ...p, y: p.y + currentSpeed * (dt / 16) }))
          .filter((p) => p.y < 110);

        updated.forEach((p) => {
          if (p.y > 75 && p.y < 92 && p.lane === playerLane) {
            handlePowerupCollect(p);
          }
        });

        return updated;
      });

      if (Math.random() < 0.03) {
        spawnObstacle();
      }
      if (Math.random() < 0.008) {
        spawnPowerup();
      }

      if (!isFinishedRef.current) {
        animFrameRef.current = requestAnimationFrame(gameLoop);
      }
    };

    animFrameRef.current = requestAnimationFrame(gameLoop);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [mode, playerLane, hasShield, isNitro, baseSpeed]);

  useEffect(() => {
    if (mode !== 'multi') return;

    const interval = setInterval(() => {
      setMultiTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          finishMultiGame();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [mode]);

  const spawnObstacle = () => {
    const lane = Math.floor(Math.random() * 3);
    const types: ('car' | 'cone' | 'oil')[] = ['car', 'cone', 'oil'];
    const type = types[Math.floor(Math.random() * types.length)];
    const colors = ['#EF4444', '#F59E0B', '#3B82F6', '#8B5CF6'];
    const color = colors[Math.floor(Math.random() * colors.length)];

    setObstacles((prev) => {
      if (prev.some((obs) => obs.y < 25 && obs.lane === lane)) return prev;
      return [...prev, { id: Math.random(), lane, y: -10, type, color }];
    });
  };

  const spawnPowerup = () => {
    const lane = Math.floor(Math.random() * 3);
    const type = Math.random() > 0.5 ? 'shield' : 'nitro';
    setPowerups((prev) => [...prev, { id: Math.random(), lane, y: -10, type }]);
  };

  const handlePowerupCollect = (p: Powerup) => {
    playFanfareSound(soundEnabled);
    triggerVibration([20, 30], vibrationEnabled);

    if (p.type === 'shield') {
      setHasShield(true);
      setFeedbackText('KALKAN AKTİF!');
    } else {
      setIsNitro(true);
      setFeedbackText('NİTRO HIZLANMASI!');
      setTimeout(() => setIsNitro(false), 2500);
    }

    setPowerups((prev) => prev.filter((item) => item.id !== p.id));
    setTimeout(() => setFeedbackText(null), 1200);
  };

  const handleCollision = (obs: Obstacle) => {
    if (hasShield) {
      setHasShield(false);
      setFeedbackText('KALKAN KORUDU!');
      setObstacles((prev) => prev.filter((item) => item.id !== obs.id));
      playFanfareSound(soundEnabled);
      setTimeout(() => setFeedbackText(null), 1200);
      return;
    }

    playBeepSound(150, 0.3, soundEnabled);
    triggerVibration(60, vibrationEnabled);
    setObstacles((prev) => prev.filter((item) => item.id !== obs.id));

    setLives((prev) => {
      const nextLives = prev - 1;
      if (nextLives <= 0) {
        finishSingleGame();
      }
      return Math.max(0, nextLives);
    });

    setStreakMultiplier(1);
    setFeedbackText('ÇARPIŞMA! (-1 CAN)');
    setTimeout(() => setFeedbackText(null), 1200);
  };

  const handleMultiTap = (playerId: string) => {
    playTapSound(soundEnabled);
    triggerVibration(10, vibrationEnabled);
    setMultiTapScores((prev) => ({
      ...prev,
      [playerId]: (prev[playerId] || 0) + 15,
    }));
  };

  const finishSingleGame = () => {
    if (isFinishedRef.current) return;
    isFinishedRef.current = true;

    onFinishGame([
      {
        playerId: players[0].id,
        score: distance,
        stats: {
          'Mesafe': `${distance} m`,
          'En Yüksek Seri': `x${streakMultiplier}`,
        },
      },
    ]);
  };

  const finishMultiGame = () => {
    if (isFinishedRef.current) return;
    isFinishedRef.current = true;

    const results = players.map((p) => ({
      playerId: p.id,
      score: multiTapScores[p.id] || 0,
      stats: {
        'Mesafe': `${multiTapScores[p.id] || 0} m`,
      },
    }));

    onFinishGame(results);
  };

  return (
    <div className="relative flex-1 flex flex-col h-full w-full bg-slate-950 text-white select-none overflow-hidden touch-none p-3 space-y-2">
      {/* Header Info */}
      <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3 shadow-md">
        <div className="flex items-center gap-2">
          <Car className="w-5 h-5 text-cyan-400" aria-hidden="true" />
          <span className="font-extrabold text-sm text-white">Mini Araba Yarışı</span>
        </div>

        {mode === 'single' ? (
          <div className="flex items-center gap-3 text-xs font-black">
            <div className="flex text-rose-500 gap-1">
              {Array.from({ length: 3 }).map((_, i) => (
                <Heart key={i} className={`w-4 h-4 ${i < lives ? 'fill-current' : 'opacity-20'}`} aria-hidden="true" />
              ))}
            </div>
            <span className="text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-3 py-1 rounded-full">
              {distance} m
            </span>
          </div>
        ) : (
          <span className="text-xs font-black text-amber-400 bg-amber-400/10 border border-amber-400/20 px-3 py-1 rounded-full">
            Süre: {multiTimeLeft}s
          </span>
        )}
      </div>

      {/* SINGLE PLAYER RACING TRACK ARENA */}
      {mode === 'single' ? (
        <div className="flex-1 relative bg-slate-900 border-2 border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col justify-between">
          <div className="absolute inset-0 grid grid-cols-3 pointer-events-none">
            <div className="border-r-2 border-dashed border-slate-700/60" />
            <div className="border-r-2 border-dashed border-slate-700/60" />
            <div />
          </div>

          {feedbackText && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 bg-slate-950/90 border border-cyan-500 px-4 py-1.5 rounded-full font-black text-xs text-amber-400 shadow-2xl animate-scale-up">
              {feedbackText}
            </div>
          )}

          {obstacles.map((obs) => (
            <div
              key={obs.id}
              style={{
                top: `${obs.y}%`,
                left: `${obs.lane * 33.33 + 4}%`,
                width: '25%',
              }}
              className="absolute h-10 flex items-center justify-center transition-all"
            >
              <Car className="w-7 h-7 text-rose-500 stroke-[2.5]" aria-hidden="true" />
            </div>
          ))}

          {powerups.map((p) => (
            <div
              key={p.id}
              style={{
                top: `${p.y}%`,
                left: `${p.lane * 33.33 + 6}%`,
              }}
              className="absolute w-8 h-8 rounded-full bg-cyan-500/20 border border-cyan-400 flex items-center justify-center animate-bounce shadow-lg"
            >
              {p.type === 'shield' ? <Shield className="w-5 h-5 text-cyan-400" aria-hidden="true" /> : <Zap className="w-5 h-5 text-amber-400" aria-hidden="true" />}
            </div>
          ))}

          <div
            style={{
              left: `${playerLane * 33.33 + 4}%`,
              bottom: '8%',
              width: '25%',
            }}
            className="absolute h-12 flex items-center justify-center transition-all duration-150 z-20"
          >
            <div className={`p-2 rounded-2xl bg-cyan-500 text-slate-950 border-2 border-white shadow-xl ${hasShield ? 'ring-4 ring-cyan-400' : ''}`}>
              <Car className="w-7 h-7 fill-current stroke-[2.5]" aria-hidden="true" />
            </div>
          </div>

          <div className="absolute bottom-3 inset-x-3 z-30 grid grid-cols-2 gap-3">
            <button
              onClick={() => setPlayerLane((l) => Math.max(0, l - 1))}
              className="py-4 rounded-2xl bg-slate-950/80 border border-slate-700 text-white font-black text-sm active:scale-95 transition-all shadow-xl"
            >
              SOL
            </button>
            <button
              onClick={() => setPlayerLane((l) => Math.min(2, l + 1))}
              className="py-4 rounded-2xl bg-slate-950/80 border border-slate-700 text-white font-black text-sm active:scale-95 transition-all shadow-xl"
            >
              SAĞ
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-1 grid grid-cols-2 gap-3">
          {players.map((p) => (
            <div
              key={p.id}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-4 flex flex-col justify-between shadow-xl text-center"
            >
              <div className="space-y-1">
                <span className="text-xs font-black uppercase" style={{ color: p.color }}>
                  {p.name}
                </span>
                <span className="text-2xl font-black text-white block">
                  {multiTapScores[p.id] || 0} m
                </span>
              </div>

              <button
                onClick={() => handleMultiTap(p.id)}
                style={{ backgroundColor: p.color }}
                className="py-8 rounded-2xl font-black text-xl text-slate-950 shadow-xl border-2 border-white/30 active:scale-95 transition-transform flex items-center justify-center gap-2"
              >
                <Car className="w-6 h-6 stroke-[3]" aria-hidden="true" /> GAZLA!
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
