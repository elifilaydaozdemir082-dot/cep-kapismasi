import React, { useState, useEffect, useRef } from 'react';
import { Disc, Zap } from 'lucide-react';
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

  const p1ScoreRef = useRef<number>(0);
  const p2ScoreRef = useRef<number>(0);

  // Paddles & Puck position state (% coords)
  const [p1Paddle, setP1Paddle] = useState<{ x: number; y: number }>({ x: 50, y: 82 });
  const [p2Paddle, setP2Paddle] = useState<{ x: number; y: number }>({ x: 50, y: 18 });
  const [puck, setPuck] = useState<{ x: number; y: number; vx: number; vy: number }>({
    x: 50,
    y: 50,
    vx: 0.3,
    vy: 0.5,
  });

  const [impactSpark, setImpactSpark] = useState<{ x: number; y: number } | null>(null);
  const [goalAnnouncement, setGoalAnnouncement] = useState<string | null>(null);

  const isFinishedRef = useRef<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const p1PaddleRef = useRef<{ x: number; y: number }>({ x: 50, y: 82 });

  useEffect(() => {
    p1PaddleRef.current = p1Paddle;
  }, [p1Paddle]);

  // 60FPS Game Physics Loop with Balanced Slower Bot & Rocket Player Hits
  useEffect(() => {
    if (isFinishedRef.current) return;

    let animId: number;
    let lastTime = performance.now();

    const loop = (time: number) => {
      const delta = Math.min(0.04, (time - lastTime) / 1000);
      lastTime = time;

      const rect = containerRef.current?.getBoundingClientRect();
      const arenaW = rect ? rect.width : 360;
      const arenaH = rect ? rect.height : 520;

      // 1. Gentle & Easy Yellow AI Bot Logic (Single Player Mode)
      if (mode === 'single') {
        setP2Paddle((prev) => {
          // Yellow Bot tracks puck smoothly at a slower, relaxed pace
          const targetX = puck.x;
          const targetY = puck.y < 50 ? Math.min(32, Math.max(14, puck.y - 4)) : 18;

          const dx = targetX - prev.x;
          const dy = targetY - prev.y;

          // Slower Bot Speed for Easy Player Mastery
          const speedX = 0.10;
          const speedY = 0.08;

          const newX = Math.min(Math.max(prev.x + dx * speedX, 15), 85);
          const newY = Math.min(Math.max(prev.y + dy * speedY, 10), 38);

          return { x: newX, y: newY };
        });
      }

      // 2. Puck Motion & Positional Correction Physics
      setPuck((prev) => {
        let newX = prev.x + prev.vx * delta * 75;
        let newY = prev.y + prev.vy * delta * 75;
        let vx = prev.vx;
        let vy = prev.vy;

        // Bounce off Left / Right Side Walls
        if (newX <= 5) {
          vx = Math.abs(vx) * 0.95;
          newX = 5;
          playBeepSound(300, 0.05, soundEnabled);
        } else if (newX >= 95) {
          vx = -Math.abs(vx) * 0.95;
          newX = 95;
          playBeepSound(300, 0.05, soundEnabled);
        }

        // Check Goal Mouths (Top & Bottom goal mouth width 28% to 72%)
        if (newY <= 3) {
          if (newX >= 28 && newX <= 72) {
            // Player 1 Goal! (Ball entered Top Goal)
            handleGoal('P1');
            return { x: 50, y: 50, vx: (Math.random() - 0.5) * 0.4, vy: 0.5 };
          } else {
            vy = Math.abs(vy) * 0.95;
            newY = 3;
            playBeepSound(300, 0.05, soundEnabled);
          }
        } else if (newY >= 97) {
          if (newX >= 28 && newX <= 72) {
            // Player 2 Goal! (Ball entered Bottom Goal)
            handleGoal('P2');
            return { x: 50, y: 50, vx: (Math.random() - 0.5) * 0.4, vy: -0.5 };
          } else {
            vy = -Math.abs(vy) * 0.95;
            newY = 97;
            playBeepSound(300, 0.05, soundEnabled);
          }
        }

        // Convert percentage positions to pixel units for exact circle collision
        const puckPxX = (newX / 100) * arenaW;
        const puckPxY = (newY / 100) * arenaH;

        const paddleRadiusPx = 28;
        const puckRadiusPx = 16;
        const combinedRadius = paddleRadiusPx + puckRadiusPx;

        // Paddle Collision - P1 Player Paddle (Cyan / Bottom)
        const p1PxX = (p1PaddleRef.current.x / 100) * arenaW;
        const p1PxY = (p1PaddleRef.current.y / 100) * arenaH;
        const distP1Px = Math.hypot(puckPxX - p1PxX, puckPxY - p1PxY);

        if (distP1Px <= combinedRadius && distP1Px > 0) {
          const normalX = (puckPxX - p1PxX) / distP1Px;
          const normalY = (puckPxY - p1PxY) / distP1Px;

          // Positional Correction
          const overlap = combinedRadius - distP1Px + 2;
          newX += (normalX * overlap / arenaW) * 100;
          newY += (normalY * overlap / arenaH) * 100;

          // ROCKET UPWARD PROPULSION: Drives puck forcefully all the way into P2's top half!
          vy = -1.1 - Math.abs(vy) * 0.2;
          vx = normalX * 0.9;

          setImpactSpark({ x: newX, y: newY });
          setTimeout(() => setImpactSpark(null), 250);

          playBeepSound(650, 0.08, soundEnabled);
          triggerVibration(20, vibrationEnabled);
        }

        // Paddle Collision - P2 Yellow Bot Paddle (Top)
        const p2PxX = (p2Paddle.x / 100) * arenaW;
        const p2PxY = (p2Paddle.y / 100) * arenaH;
        const distP2Px = Math.hypot(puckPxX - p2PxX, puckPxY - p2PxY);

        if (distP2Px <= combinedRadius && distP2Px > 0) {
          const normalX = (puckPxX - p2PxX) / distP2Px;
          const normalY = (puckPxY - p2PxY) / distP2Px;

          // Positional Correction
          const overlap = combinedRadius - distP2Px + 2;
          newX += (normalX * overlap / arenaW) * 100;
          newY += (normalY * overlap / arenaH) * 100;

          // Moderate downward bounce
          vy = 0.7 + Math.abs(vy) * 0.15;
          vx = normalX * 0.7;

          setImpactSpark({ x: newX, y: newY });
          setTimeout(() => setImpactSpark(null), 250);

          playBeepSound(650, 0.08, soundEnabled);
          triggerVibration(20, vibrationEnabled);
        }

        return { x: newX, y: newY, vx, vy };
      });

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [p2Paddle, puck, mode, soundEnabled, vibrationEnabled]);

  const handleGoal = (scorer: 'P1' | 'P2') => {
    if (isFinishedRef.current) return;
    playFanfareSound(soundEnabled);
    triggerVibration([25, 35, 25], vibrationEnabled);

    const scorerName = scorer === 'P1' ? players[0]?.name : (mode === 'single' ? 'BOT RAKİP' : players[1]?.name);
    setGoalAnnouncement(`⚽ GOOOL! ${scorerName.toUpperCase()}`);
    setTimeout(() => setGoalAnnouncement(null), 1400);

    if (scorer === 'P1') {
      const next = p1ScoreRef.current + 1;
      p1ScoreRef.current = next;
      setP1Score(next);
      if (next >= 5) finishGame();
    } else {
      const next = p2ScoreRef.current + 1;
      p2ScoreRef.current = next;
      setP2Score(next);
      if (next >= 5) finishGame();
    }
  };

  const finishGame = () => {
    if (isFinishedRef.current) return;
    isFinishedRef.current = true;
    const results = [
      { playerId: players[0].id, score: p1ScoreRef.current },
      { playerId: players[1]?.id || 'p2', score: p2ScoreRef.current },
    ];
    onFinishGame(results);
  };

  // High-Precision Pointer drag for P1 paddle (Full bottom half control)
  const handleP1Pointer = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!containerRef.current || isFinishedRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.min(Math.max(((e.clientX - rect.left) / rect.width) * 100, 5), 95);
    const y = Math.min(Math.max(((e.clientY - rect.top) / rect.height) * 100, 48), 95);
    setP1Paddle({ x, y });
  };

  // Pointer drag for P2 paddle (Top half - Multiplayer)
  const handleP2Pointer = (e: React.PointerEvent<HTMLDivElement>) => {
    if (mode !== 'multi' || !containerRef.current || isFinishedRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.min(Math.max(((e.clientX - rect.left) / rect.width) * 100, 5), 95);
    const y = Math.min(Math.max(((e.clientY - rect.top) / rect.height) * 100, 5), 48);
    setP2Paddle({ x, y });
  };

  return (
    <div className="relative flex-1 flex flex-col h-full w-full bg-slate-950 text-white select-none overflow-hidden touch-none p-4">
      {/* Header Bar */}
      <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3 shadow-md mb-2">
        <div className="flex items-center gap-2">
          <Disc className="w-5 h-5 text-cyan-400" />
          <span className="font-extrabold text-sm text-white">Hava Hokeyi Arena</span>
        </div>

        <div className="flex items-center gap-4 text-sm font-black">
          <span style={{ color: players[0]?.color }}>{players[0]?.name}: {p1Score}</span>
          <span className="text-xs text-slate-500">VS</span>
          <span style={{ color: players[1]?.color || '#F59E0B' }}>
            {mode === 'single' ? 'BOT' : players[1]?.name}: {p2Score}
          </span>
        </div>
      </div>

      {/* Air Hockey Table Arena */}
      <div
        ref={containerRef}
        onPointerMove={handleP1Pointer}
        onPointerDown={handleP1Pointer}
        className="flex-1 relative bg-slate-900 border-4 border-cyan-500/50 rounded-3xl overflow-hidden shadow-[0_0_40px_rgba(6,182,212,0.25)] flex flex-col justify-between cursor-crosshair"
      >
        {/* Goal Announcement Banner */}
        {goalAnnouncement && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-40 bg-slate-950/95 border-2 border-amber-400 px-6 py-3 rounded-full font-black text-sm text-amber-300 shadow-2xl animate-scale-up backdrop-blur">
            {goalAnnouncement}
          </div>
        )}

        {/* Top Goal Mouth (P2 / Bot Goal) */}
        <div className="absolute top-0 inset-x-[28%] h-3.5 bg-emerald-500/80 border-b-2 border-emerald-400 rounded-b-lg flex items-center justify-center z-10">
          <span className="text-[9px] font-black text-white tracking-widest uppercase">BOT KALESİ</span>
        </div>

        {/* Bottom Goal Mouth (P1 Goal) */}
        <div className="absolute bottom-0 inset-x-[28%] h-3.5 bg-cyan-500/80 border-t-2 border-cyan-400 rounded-t-lg flex items-center justify-center z-10">
          <span className="text-[9px] font-black text-white tracking-widest uppercase">SENİN KALEN</span>
        </div>

        {/* Center Line & Circle */}
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-0.5 bg-cyan-500/40 pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 border-2 border-cyan-500/40 rounded-full pointer-events-none flex items-center justify-center">
          <Zap className="w-6 h-6 text-cyan-400/30" />
        </div>

        {/* Impact Flash Spark Effect */}
        {impactSpark && (
          <div
            style={{ left: `${impactSpark.x}%`, top: `${impactSpark.y}%` }}
            className="absolute -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-cyan-400/40 rounded-full animate-ping pointer-events-none z-30"
          />
        )}

        {/* Top Half Drag Area (Multiplayer P2) */}
        {mode === 'multi' && (
          <div
            onPointerMove={handleP2Pointer}
            onPointerDown={handleP2Pointer}
            className="absolute top-0 inset-x-0 h-1/2 z-0 cursor-pointer"
          />
        )}

        {/* Yellow Bot / P2 Paddle */}
        <div
          style={{
            left: `${p2Paddle.x}%`,
            top: `${p2Paddle.y}%`,
          }}
          className="absolute -translate-x-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-amber-400 border-4 border-amber-200 shadow-[0_0_20px_#F59E0B] flex items-center justify-center z-20 pointer-events-none transition-all duration-75"
        >
          <div className="w-6 h-6 rounded-full bg-slate-950 border-2 border-amber-300" />
        </div>

        {/* Red Puck with Motion Glow */}
        <div
          style={{
            left: `${puck.x}%`,
            top: `${puck.y}%`,
          }}
          className="absolute -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-rose-500 border-2 border-white shadow-[0_0_16px_#EF4444] z-20 pointer-events-none"
        />

        {/* Cyan P1 Paddle */}
        <div
          style={{
            left: `${p1Paddle.x}%`,
            top: `${p1Paddle.y}%`,
          }}
          className="absolute -translate-x-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-cyan-400 border-4 border-cyan-200 shadow-[0_0_20px_#06B6D4] flex items-center justify-center z-20 pointer-events-none transition-all duration-75"
        >
          <div className="w-6 h-6 rounded-full bg-slate-950 border-2 border-cyan-300" />
        </div>
      </div>
    </div>
  );
};
