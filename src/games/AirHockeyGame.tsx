import React, { useState, useEffect, useRef } from 'react';
import { Disc } from 'lucide-react';
import type { Player } from '../types/game';
import { playBeepSound, playFanfareSound, triggerVibration } from '../utils/audio';

interface AirHockeyGameProps {
  mode: 'single' | 'multi';
  players: Player[];
  onFinishGame: (results: { playerId: string; score: number }[]) => void;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
}

export const AirHockeyGame: React.FC<AirHockeyGameProps> = ({
  mode,
  players,
  onFinishGame,
  soundEnabled,
  vibrationEnabled,
}) => {
  const [p1Score, setP1Score] = useState<number>(0);
  const [p2Score, setP2Score] = useState<number>(0);

  // Paddles & Puck position state (% coords)
  const [p1Paddle, setP1Paddle] = useState<{ x: number; y: number }>({ x: 50, y: 80 });
  const [p2Paddle, setP2Paddle] = useState<{ x: number; y: number }>({ x: 50, y: 20 });
  const [puck, setPuck] = useState<{ x: number; y: number; vx: number; vy: number }>({
    x: 50,
    y: 50,
    vx: 0.2,
    vy: 0.3,
  });

  const isFinishedRef = useRef<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Single player AI Paddle Loop
  useEffect(() => {
    if (mode !== 'single' || isFinishedRef.current) return;
    const interval = setInterval(() => {
      setP2Paddle((prev) => {
        const dx = puck.x - prev.x;
        const speed = 0.15;
        const newX = Math.min(Math.max(prev.x + dx * speed, 20), 80);
        return { x: newX, y: 20 };
      });
    }, 30);
    return () => clearInterval(interval);
  }, [mode, puck]);

  // Puck Motion & Physics Loop
  useEffect(() => {
    if (isFinishedRef.current) return;

    let animId: number;
    let lastTime = performance.now();

    const loop = (time: number) => {
      const delta = (time - lastTime) / 1000;
      lastTime = time;

      setPuck((prev) => {
        let newX = prev.x + prev.vx * delta * 50;
        let newY = prev.y + prev.vy * delta * 50;
        let vx = prev.vx;
        let vy = prev.vy;

        // Bounce off left/right side walls
        if (newX <= 5 || newX >= 95) {
          vx = -vx;
          newX = Math.min(Math.max(newX, 5), 95);
          playBeepSound(300, 0.05, soundEnabled);
        }

        // Check Goals (Top & Bottom goal mouth width 30% to 70%)
        if (newY <= 4) {
          if (newX >= 30 && newX <= 70) {
            // Player 1 Goal!
            handleGoal('P1');
            return { x: 50, y: 50, vx: (Math.random() - 0.5) * 0.4, vy: 0.3 };
          } else {
            vy = -vy;
            newY = 4;
            playBeepSound(300, 0.05, soundEnabled);
          }
        } else if (newY >= 96) {
          if (newX >= 30 && newX <= 70) {
            // Player 2 Goal!
            handleGoal('P2');
            return { x: 50, y: 50, vx: (Math.random() - 0.5) * 0.4, vy: -0.3 };
          } else {
            vy = -vy;
            newY = 96;
            playBeepSound(300, 0.05, soundEnabled);
          }
        }

        // Paddle Collision - P1 Paddle (Bottom)
        const distP1 = Math.hypot(newX - p1Paddle.x, newY - p1Paddle.y);
        if (distP1 < 10) {
          vy = -Math.abs(vy) - 0.05;
          vx = (newX - p1Paddle.x) * 0.08;
          playBeepSound(600, 0.08, soundEnabled);
          triggerVibration(15, vibrationEnabled);
        }

        // Paddle Collision - P2 Paddle (Top)
        const distP2 = Math.hypot(newX - p2Paddle.x, newY - p2Paddle.y);
        if (distP2 < 10) {
          vy = Math.abs(vy) + 0.05;
          vx = (newX - p2Paddle.x) * 0.08;
          playBeepSound(600, 0.08, soundEnabled);
          triggerVibration(15, vibrationEnabled);
        }

        return { x: newX, y: newY, vx, vy };
      });

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [p1Paddle, p2Paddle, soundEnabled, vibrationEnabled]);

  const handleGoal = (scorer: 'P1' | 'P2') => {
    playFanfareSound(soundEnabled);
    triggerVibration([20, 30, 20], vibrationEnabled);

    if (scorer === 'P1') {
      setP1Score((s) => {
        const next = s + 1;
        if (next >= 5 && !isFinishedRef.current) finishGame(next, p2Score);
        return next;
      });
    } else {
      setP2Score((s) => {
        const next = s + 1;
        if (next >= 5 && !isFinishedRef.current) finishGame(p1Score, next);
        return next;
      });
    }
  };

  const finishGame = (finalP1: number, finalP2: number) => {
    isFinishedRef.current = true;
    const results = [
      { playerId: players[0].id, score: finalP1 },
      { playerId: players[1]?.id || 'p2', score: finalP2 },
    ];
    onFinishGame(results);
  };

  // Pointer drag for P1 paddle (Bottom half)
  const handleP1Pointer = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.min(Math.max(((e.clientX - rect.left) / rect.width) * 100, 10), 90);
    const y = Math.min(Math.max(((e.clientY - rect.top) / rect.height) * 100, 52), 92);
    setP1Paddle({ x, y });
  };

  // Pointer drag for P2 paddle (Top half - Multiplayer)
  const handleP2Pointer = (e: React.PointerEvent<HTMLDivElement>) => {
    if (mode !== 'multi' || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.min(Math.max(((e.clientX - rect.left) / rect.width) * 100, 10), 90);
    const y = Math.min(Math.max(((e.clientY - rect.top) / rect.height) * 100, 8), 48);
    setP2Paddle({ x, y });
  };

  return (
    <div className="relative flex-1 flex flex-col h-full w-full bg-slate-950 text-white select-none overflow-hidden touch-none p-4">
      {/* Header */}
      <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3 shadow-md mb-2">
        <div className="flex items-center gap-2">
          <Disc className="w-5 h-5 text-cyan-400" />
          <span className="font-extrabold text-sm text-white">Hava Hokeyi</span>
        </div>

        <div className="flex items-center gap-4 text-sm font-black">
          <span style={{ color: players[0]?.color }}>{players[0]?.name}: {p1Score}</span>
          <span>vs</span>
          <span style={{ color: players[1]?.color || '#FF9F43' }}>
            {mode === 'single' ? 'BOT' : players[1]?.name}: {p2Score}
          </span>
        </div>
      </div>

      {/* Air Hockey Table Arena */}
      <div
        ref={containerRef}
        onPointerMove={(e) => {
          handleP1Pointer(e);
          handleP2Pointer(e);
        }}
        className="flex-1 bg-slate-900 border-4 border-cyan-500 rounded-3xl relative overflow-hidden shadow-2xl select-none touch-none"
      >
        {/* Center Line & Ring */}
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-1 bg-cyan-500/40" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 rounded-full border-2 border-cyan-500/40 pointer-events-none" />

        {/* Goals (Top & Bottom mouth) */}
        <div className="absolute top-0 left-[30%] right-[30%] h-4 bg-rose-600/80 rounded-b-xl border-b-2 border-white shadow-inner flex items-center justify-center text-[9px] font-black text-white">
          KALE 2
        </div>
        <div className="absolute bottom-0 left-[30%] right-[30%] h-4 bg-rose-600/80 rounded-t-xl border-t-2 border-white shadow-inner flex items-center justify-center text-[9px] font-black text-white">
          KALE 1
        </div>

        {/* Top Paddle (P2 / AI) */}
        <div
          style={{ left: `${p2Paddle.x}%`, top: `${p2Paddle.y}%` }}
          className="absolute -ml-6 -mt-6 w-12 h-12 rounded-full bg-amber-400 border-4 border-white shadow-xl flex items-center justify-center pointer-events-none z-10"
        >
          <div className="w-4 h-4 rounded-full bg-slate-950" />
        </div>

        {/* Bottom Paddle (P1) */}
        <div
          style={{ left: `${p1Paddle.x}%`, top: `${p1Paddle.y}%` }}
          className="absolute -ml-6 -mt-6 w-12 h-12 rounded-full bg-cyan-400 border-4 border-white shadow-xl flex items-center justify-center pointer-events-none z-10"
        >
          <div className="w-4 h-4 rounded-full bg-slate-950" />
        </div>

        {/* Puck */}
        <div
          style={{ left: `${puck.x}%`, top: `${puck.y}%` }}
          className="absolute -ml-4 -mt-4 w-8 h-8 rounded-full bg-slate-950 border-4 border-rose-500 shadow-2xl flex items-center justify-center pointer-events-none z-20"
        >
          <div className="w-2 h-2 rounded-full bg-rose-500" />
        </div>
      </div>
    </div>
  );
};
