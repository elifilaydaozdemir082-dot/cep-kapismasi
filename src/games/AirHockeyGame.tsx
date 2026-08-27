import React, { useState, useEffect, useRef } from 'react';
import { Disc, Zap, Shield, Flame, Snowflake } from 'lucide-react';
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

  // Power-Ups & Special Ability States
  const [isShieldActive, setIsShieldActive] = useState<boolean>(false);
  const [shieldTimer, setShieldTimer] = useState<number>(0);
  const [isBotFrozen, setIsBotFrozen] = useState<boolean>(false);
  const [freezeTimer, setFreezeTimer] = useState<number>(0);
  const [isRocketActive, setIsRocketActive] = useState<boolean>(false);

  // Ability Cooldowns (in seconds)
  const [rocketCooldown, setRocketCooldown] = useState<number>(0);
  const [shieldCooldown, setShieldCooldown] = useState<number>(0);
  const [freezeCooldown, setFreezeCooldown] = useState<number>(0);

  const isFinishedRef = useRef<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const p1PaddleRef = useRef<{ x: number; y: number }>({ x: 50, y: 82 });

  useEffect(() => {
    p1PaddleRef.current = p1Paddle;
  }, [p1Paddle]);

  // Ability Cooldown Ticker
  useEffect(() => {
    const interval = setInterval(() => {
      setRocketCooldown((c) => Math.max(0, c - 1));
      setShieldCooldown((c) => Math.max(0, c - 1));
      setFreezeCooldown((c) => Math.max(0, c - 1));

      setShieldTimer((t) => {
        if (t <= 1) {
          setIsShieldActive(false);
          return 0;
        }
        return t - 1;
      });

      setFreezeTimer((t) => {
        if (t <= 1) {
          setIsBotFrozen(false);
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // 60FPS Game Physics Loop with Power-Ups & Responsive Teleport Controls
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

      // 1. Bot AI Logic (Frozen when Freeze Ability is Active)
      if (mode === 'single' && !isBotFrozen) {
        setP2Paddle((prev) => {
          const targetX = puck.x;
          const targetY = puck.y < 50 ? Math.min(32, Math.max(14, puck.y - 4)) : 18;

          const dx = targetX - prev.x;
          const dy = targetY - prev.y;

          const speedX = 0.12;
          const speedY = 0.10;

          const newX = Math.min(Math.max(prev.x + dx * speedX, 15), 85);
          const newY = Math.min(Math.max(prev.y + dy * speedY, 10), 38);

          return { x: newX, y: newY };
        });
      }

      // 2. Puck Motion & Shield / Wall Collisions
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

        // Shield Wall Protection on Bottom Goal (y >= 92%)
        if (isShieldActive && newY >= 92) {
          vy = -Math.abs(vy) * 1.1;
          newY = 91;
          playBeepSound(750, 0.1, soundEnabled);
          triggerVibration([15, 25], vibrationEnabled);
        }

        // Check Goal Mouths
        if (newY <= 3) {
          if (newX >= 28 && newX <= 72) {
            handleGoal('P1');
            setIsRocketActive(false);
            return { x: 50, y: 50, vx: (Math.random() - 0.5) * 0.4, vy: 0.5 };
          } else {
            vy = Math.abs(vy) * 0.95;
            newY = 3;
            playBeepSound(300, 0.05, soundEnabled);
          }
        } else if (newY >= 97) {
          if (newX >= 28 && newX <= 72) {
            handleGoal('P2');
            setIsRocketActive(false);
            return { x: 50, y: 50, vx: (Math.random() - 0.5) * 0.4, vy: -0.5 };
          } else {
            vy = -Math.abs(vy) * 0.95;
            newY = 97;
            playBeepSound(300, 0.05, soundEnabled);
          }
        }

        // Convert percentage positions to pixel units for collision
        const puckPxX = (newX / 100) * arenaW;
        const puckPxY = (newY / 100) * arenaH;

        const paddleRadiusPx = 34; // Enlarged paddle hitbox for easy control
        const puckRadiusPx = 18;
        const combinedRadius = paddleRadiusPx + puckRadiusPx;

        // Paddle Collision - P1 Player Paddle (Cyan / Bottom)
        const p1PxX = (p1PaddleRef.current.x / 100) * arenaW;
        const p1PxY = (p1PaddleRef.current.y / 100) * arenaH;
        const distP1Px = Math.hypot(puckPxX - p1PxX, puckPxY - p1PxY);

        if (distP1Px <= combinedRadius && distP1Px > 0) {
          const normalX = (puckPxX - p1PxX) / distP1Px;

          // Positional Correction
          const overlap = combinedRadius - distP1Px + 3;
          newX += (normalX * overlap / arenaW) * 100;
          newY += ((puckPxY - p1PxY) / distP1Px * overlap / arenaH) * 100;

          // Powerful rocket hit
          vy = -1.25 - Math.abs(vy) * 0.25;
          vx = normalX * 0.95;

          setImpactSpark({ x: newX, y: newY });
          setTimeout(() => setImpactSpark(null), 250);

          playBeepSound(700, 0.08, soundEnabled);
          triggerVibration(25, vibrationEnabled);
        }

        // Paddle Collision - P2 Yellow Bot Paddle (Top)
        const p2PxX = (p2Paddle.x / 100) * arenaW;
        const p2PxY = (p2Paddle.y / 100) * arenaH;
        const distP2Px = Math.hypot(puckPxX - p2PxX, puckPxY - p2PxY);

        if (distP2Px <= combinedRadius && distP2Px > 0) {
          const normalX = (puckPxX - p2PxX) / distP2Px;

          const overlap = combinedRadius - distP2Px + 3;
          newX += (normalX * overlap / arenaW) * 100;
          newY += ((puckPxY - p2PxY) / distP2Px * overlap / arenaH) * 100;

          vy = 0.75 + Math.abs(vy) * 0.15;
          vx = normalX * 0.75;

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
  }, [p2Paddle, puck, mode, isBotFrozen, isShieldActive, soundEnabled, vibrationEnabled]);

  // Activate Rocket Shot Ability
  const handleActivateRocket = () => {
    if (rocketCooldown > 0 || isFinishedRef.current) return;
    setIsRocketActive(true);
    setRocketCooldown(6);

    // Launch puck at 3X rocket speed towards opponent's goal!
    setPuck((prev) => ({
      x: prev.x,
      y: Math.min(prev.y, 75),
      vx: (Math.random() - 0.5) * 0.8,
      vy: -1.8,
    }));

    playFanfareSound(soundEnabled);
    triggerVibration([30, 40, 30], vibrationEnabled);
  };

  // Activate Shield Wall Ability
  const handleActivateShield = () => {
    if (shieldCooldown > 0 || isFinishedRef.current) return;
    setIsShieldActive(true);
    setShieldTimer(5);
    setShieldCooldown(8);

    playFanfareSound(soundEnabled);
    triggerVibration([20, 30], vibrationEnabled);
  };

  // Activate Freeze Bot Ability
  const handleActivateFreeze = () => {
    if (freezeCooldown > 0 || isFinishedRef.current) return;
    setIsBotFrozen(true);
    setFreezeTimer(3);
    setFreezeCooldown(10);

    playFanfareSound(soundEnabled);
    triggerVibration([30, 30], vibrationEnabled);
  };

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

  // Instant Touch Teleport & Full-Range Paddle Controls
  const handleP1Pointer = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!containerRef.current || isFinishedRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.min(Math.max(((e.clientX - rect.left) / rect.width) * 100, 5), 95);
    const y = Math.min(Math.max(((e.clientY - rect.top) / rect.height) * 100, 42), 95);
    setP1Paddle({ x, y });
  };

  const handleP2Pointer = (e: React.PointerEvent<HTMLDivElement>) => {
    if (mode !== 'multi' || !containerRef.current || isFinishedRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.min(Math.max(((e.clientX - rect.left) / rect.width) * 100, 5), 95);
    const y = Math.min(Math.max(((e.clientY - rect.top) / rect.height) * 100, 5), 48);
    setP2Paddle({ x, y });
  };

  return (
    <div className="relative flex-1 flex flex-col h-full w-full bg-slate-950 text-white select-none overflow-hidden touch-none p-3 space-y-2">
      {/* Header Bar */}
      <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-2xl px-4 py-2.5 shadow-md">
        <div className="flex items-center gap-2">
          <Disc className="w-5 h-5 text-cyan-400" />
          <span className="font-extrabold text-sm text-white">Power Hokey Arena</span>
        </div>

        <div className="flex items-center gap-4 text-xs font-black">
          <span style={{ color: players[0]?.color }} className="bg-slate-950 px-2.5 py-1 rounded-xl border border-slate-800">
            👤 {players[0]?.name}: {p1Score}
          </span>
          <span className="text-slate-500">VS</span>
          <span style={{ color: players[1]?.color || '#F59E0B' }} className="bg-slate-950 px-2.5 py-1 rounded-xl border border-slate-800">
            {mode === 'single' ? '🤖 BOT' : players[1]?.name}: {p2Score}
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

        {/* Top Goal Mouth (Bot / P2) */}
        <div className="absolute top-0 inset-x-[28%] h-3.5 bg-emerald-500/80 border-b-2 border-emerald-400 rounded-b-lg flex items-center justify-center z-10">
          <span className="text-[9px] font-black text-white tracking-widest uppercase">BOT KALESİ</span>
        </div>

        {/* Bottom Goal Mouth with Active Shield Overlay */}
        <div className="absolute bottom-0 inset-x-[28%] h-3.5 bg-cyan-500/80 border-t-2 border-cyan-400 rounded-t-lg flex items-center justify-center z-10">
          <span className="text-[9px] font-black text-white tracking-widest uppercase">SENİN KALEN</span>
        </div>

        {/* Active Protective Shield Wall Visual */}
        {isShieldActive && (
          <div className="absolute bottom-4 inset-x-[10%] h-3 bg-cyan-400/80 border-2 border-cyan-200 rounded-full shadow-[0_0_20px_#38BDF8] animate-pulse z-30 flex items-center justify-center">
            <span className="text-[10px] font-black text-slate-950 tracking-wider">🛡️ KALKAN KORUMASI ({shieldTimer}s)</span>
          </div>
        )}

        {/* Center Line & Circle */}
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-0.5 bg-cyan-500/40 pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 border-2 border-cyan-500/40 rounded-full pointer-events-none flex items-center justify-center">
          <Zap className="w-6 h-6 text-cyan-400/30" />
        </div>

        {/* Impact Flash Spark Effect */}
        {impactSpark && (
          <div
            style={{ left: `${impactSpark.x}%`, top: `${impactSpark.y}%` }}
            className="absolute -translate-x-1/2 -translate-y-1/2 w-14 h-14 bg-cyan-400/50 rounded-full animate-ping pointer-events-none z-30"
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

        {/* Yellow Bot Paddle (Frozen Ice Effect when Frozen) */}
        <div
          style={{
            left: `${p2Paddle.x}%`,
            top: `${p2Paddle.y}%`,
          }}
          className={`absolute -translate-x-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-amber-400 border-4 border-amber-200 shadow-[0_0_20px_#F59E0B] flex items-center justify-center z-20 pointer-events-none transition-all duration-75 ${
            isBotFrozen ? 'ring-8 ring-cyan-400/70 opacity-80' : ''
          }`}
        >
          {isBotFrozen ? (
            <div className="flex flex-col items-center justify-center">
              <Snowflake className="w-6 h-6 text-cyan-200 animate-spin" />
              <span className="text-[8px] font-black text-white">{freezeTimer}s</span>
            </div>
          ) : (
            <div className="w-6 h-6 rounded-full bg-slate-950 border-2 border-amber-300" />
          )}
        </div>

        {/* Red Puck (Rocket Flame Streak when Rocket Shot) */}
        <div
          style={{
            left: `${puck.x}%`,
            top: `${puck.y}%`,
          }}
          className={`absolute -translate-x-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-rose-500 border-2 border-white shadow-[0_0_20px_#EF4444] z-20 pointer-events-none ${
            isRocketActive ? 'shadow-[0_0_30px_#F59E0B] ring-4 ring-amber-400 animate-pulse' : ''
          }`}
        />

        {/* Cyan P1 Player Paddle */}
        <div
          style={{
            left: `${p1Paddle.x}%`,
            top: `${p1Paddle.y}%`,
          }}
          className="absolute -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-cyan-400 border-4 border-cyan-100 shadow-[0_0_25px_#06B6D4] flex items-center justify-center z-20 pointer-events-none transition-all duration-75"
        >
          <div className="w-7 h-7 rounded-full bg-slate-950 border-2 border-cyan-300 flex items-center justify-center">
            <div className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
          </div>
        </div>
      </div>

      {/* Special Ability Powers Bar (Single Player) */}
      {mode === 'single' && (
        <div className="flex items-center justify-around bg-slate-900 border border-slate-800 rounded-2xl p-2 shadow-xl backdrop-blur gap-2 z-40">
          {/* Turbo Rocket Shot */}
          <button
            onClick={handleActivateRocket}
            disabled={rocketCooldown > 0}
            className={`flex-1 py-2 px-3 rounded-xl border flex items-center justify-center gap-1.5 font-black text-xs transition-all ${
              rocketCooldown > 0
                ? 'bg-slate-950/60 border-slate-800 text-slate-500 opacity-60'
                : 'bg-gradient-to-r from-amber-500 to-rose-600 border-amber-400 text-white shadow-[0_0_12px_#F59E0B] active:scale-95'
            }`}
          >
            <Flame className="w-4 h-4 text-amber-200 fill-current" />
            <span>ROKET SHUT {rocketCooldown > 0 ? `(${rocketCooldown}s)` : ''}</span>
          </button>

          {/* Shield Wall Protection */}
          <button
            onClick={handleActivateShield}
            disabled={shieldCooldown > 0}
            className={`flex-1 py-2 px-3 rounded-xl border flex items-center justify-center gap-1.5 font-black text-xs transition-all ${
              shieldCooldown > 0
                ? 'bg-slate-950/60 border-slate-800 text-slate-500 opacity-60'
                : 'bg-gradient-to-r from-cyan-500 to-blue-600 border-cyan-300 text-white shadow-[0_0_12px_#06B6D4] active:scale-95'
            }`}
          >
            <Shield className="w-4 h-4 text-cyan-200 fill-current" />
            <span>KALKAN {shieldCooldown > 0 ? `(${shieldCooldown}s)` : ''}</span>
          </button>

          {/* Freeze Bot */}
          <button
            onClick={handleActivateFreeze}
            disabled={freezeCooldown > 0}
            className={`flex-1 py-2 px-3 rounded-xl border flex items-center justify-center gap-1.5 font-black text-xs transition-all ${
              freezeCooldown > 0
                ? 'bg-slate-950/60 border-slate-800 text-slate-500 opacity-60'
                : 'bg-gradient-to-r from-teal-400 to-emerald-600 border-teal-300 text-slate-950 shadow-[0_0_12px_#2DD4BF] active:scale-95'
            }`}
          >
            <Snowflake className="w-4 h-4 text-slate-950 fill-current" />
            <span>BOTU DONDUR {freezeCooldown > 0 ? `(${freezeCooldown}s)` : ''}</span>
          </button>
        </div>
      )}
    </div>
  );
};
