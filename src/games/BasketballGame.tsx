import React, { useState, useRef, useEffect } from 'react';
import { Target, Trophy, Zap, Flame, Sparkles } from 'lucide-react';
import type { DifficultyLevel, Player } from '../types/game';
import { playBeepSound, playFanfareSound, playTapSound, triggerVibration } from '../utils/audio';

interface BasketballGameProps {
  mode: 'single' | 'multi';
  players: Player[];
  difficulty: DifficultyLevel;
  onFinishGame: (results: { playerId: string; score: number; stats?: Record<string, number | string> }[]) => void;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
}

export const BasketballGame: React.FC<BasketballGameProps> = ({
  mode,
  players,
  onFinishGame,
  soundEnabled,
  vibrationEnabled,
}) => {
  const [currentPlayerIdx, setCurrentPlayerIdx] = useState<number>(0);
  const [currentShot, setCurrentShot] = useState<number>(1);
  const totalShots = 5;

  const [playerScores, setPlayerScores] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    players.forEach((p) => (initial[p.id] = 0));
    return initial;
  });

  // Direct Precision Aim & Shot State
  const [aimTarget, setAimTarget] = useState<{ x: number; y: number } | null>(null);
  const [isShooting, setIsShooting] = useState<boolean>(false);

  // Ball Flight State
  const [ballPos, setBallPos] = useState<{ x: number; y: number }>({ x: 50, y: 82 });
  const [ballScale, setBallScale] = useState<number>(1);
  const [ballRotation, setBallRotation] = useState<number>(0);

  // Feedback & Effects
  const [lastShotFeedback, setLastShotFeedback] = useState<string | null>(null);
  const [netRipple, setNetRipple] = useState<boolean>(false);
  const [hoopOffsetX, setHoopOffsetX] = useState<number>(0);
  const [streakCount, setStreakCount] = useState<number>(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const isFinishedRef = useRef<boolean>(false);
  const playerScoresRef = useRef<Record<string, number>>({});
  const hoopDirectionRef = useRef<number>(1);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const initial: Record<string, number> = {};
    players.forEach((p) => (initial[p.id] = 0));
    playerScoresRef.current = initial;
  }, [players]);

  // Gentle Moving Hoop Animation Loop
  useEffect(() => {
    if (isFinishedRef.current) return;

    const interval = setInterval(() => {
      setHoopOffsetX((prev) => {
        let next = prev + hoopDirectionRef.current * 0.35;
        if (next > 16) {
          next = 16;
          hoopDirectionRef.current = -1;
        } else if (next < -16) {
          next = -16;
          hoopDirectionRef.current = 1;
        }
        return next;
      });
    }, 30);

    return () => clearInterval(interval);
  }, []);

  const currentPlayer = players[currentPlayerIdx] || players[0];

  // Shot Type bonuses
  const isMoneyball = currentShot === 3;
  const isFireball = currentShot === 5 || streakCount >= 2;

  // Exact Normalized Pointer Coordinates (%)
  const getPointerPct = (e: React.PointerEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return { x: 50, y: 15.5 };
    const xPct = Math.min(92, Math.max(8, ((e.clientX - rect.left) / rect.width) * 100));
    const yPct = Math.min(65, Math.max(8, ((e.clientY - rect.top) / rect.height) * 100));
    return { x: xPct, y: yPct };
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (isShooting || isFinishedRef.current) return;
    const pt = getPointerPct(e);
    setAimTarget(pt);
    playTapSound(soundEnabled);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!aimTarget || isShooting || isFinishedRef.current) return;
    const pt = getPointerPct(e);
    setAimTarget(pt);
  };

  const handlePointerUp = () => {
    if (!aimTarget || isShooting || isFinishedRef.current) {
      setAimTarget(null);
      return;
    }

    const finalTarget = { ...aimTarget };
    setAimTarget(null);
    setIsShooting(true);

    // Launch Parabolic Flight Animation
    launchParabolicShot(finalTarget.x, finalTarget.y);
  };

  const launchParabolicShot = (targetX: number, targetY: number) => {
    const startX = 50;
    const startY = 82;
    const apexY = Math.min(startY, targetY) - 22; // Parabolic arc apex height

    let progress = 0;
    const durationFrames = 28; // 460ms flight

    const animateFlight = () => {
      progress += 1 / durationFrames;

      if (progress >= 1) {
        setBallPos({ x: targetX, y: targetY });
        setBallScale(0.6);
        setBallRotation(1080);
        evaluateShot(targetX, targetY);
        return;
      }

      // Quadratic Bezier Parabola Math
      const t = progress;
      const currentX = (1 - t) * (1 - t) * startX + 2 * (1 - t) * t * targetX + t * t * targetX;
      const currentY = (1 - t) * (1 - t) * startY + 2 * (1 - t) * t * apexY + t * t * targetY;

      setBallPos({ x: currentX, y: currentY });
      setBallScale(1 - t * 0.4);
      setBallRotation(t * 1080);

      animFrameRef.current = requestAnimationFrame(animateFlight);
    };

    animFrameRef.current = requestAnimationFrame(animateFlight);
  };

  const evaluateShot = (targetX: number, targetY: number) => {
    // Exact Rim Center Coordinates: (50 + hoopOffsetX, Y: 15.5%)
    const currentHoopX = 50 + hoopOffsetX;
    const hoopY = 15.5;
    const distToHoop = Math.hypot(targetX - currentHoopX, targetY - hoopY);

    let pts = 0;
    let feedback = '';

    const basePoints = isFireball ? 6 : isMoneyball ? 4 : 2;

    if (distToHoop <= 6.5) {
      // Swish Clean Basket!
      pts = basePoints + 1;
      setNetRipple(true);
      const nextStreak = streakCount + 1;
      setStreakCount(nextStreak);

      feedback = isFireball
        ? `☄️ ALEVLİ KUSURSUZ SWISH! (+${pts} PUAN)`
        : isMoneyball
        ? `💎 MONEYBALL SWISH! (+${pts} PUAN)`
        : `🏀 SWISH! TEMİZ BASKET! (+${pts} PUAN)`;
    } else if (distToHoop <= 14.0) {
      // Direct Basket!
      pts = basePoints;
      setNetRipple(true);
      const nextStreak = streakCount + 1;
      setStreakCount(nextStreak);

      feedback = isMoneyball ? `💎 MONEYBALL BASKET! (+${pts} PUAN)` : `🏀 BASKET! (+${pts} PUAN)`;
    } else if (distToHoop <= 20.0) {
      // Rim Bounce Basket!
      pts = basePoints;
      setNetRipple(true);
      const nextStreak = streakCount + 1;
      setStreakCount(nextStreak);

      feedback = '💥 PANYADAN SEKTİ VE GİRDİ! (+2 PUAN)';
    } else {
      // Miss
      feedback = '❌ ISKALADI!';
      setStreakCount(0);
      setBallPos((prev) => ({ x: prev.x > 50 ? prev.x + 6 : prev.x - 6, y: prev.y + 10 }));
    }

    if (pts > 0) {
      playFanfareSound(soundEnabled);
      triggerVibration([25, 35], vibrationEnabled);
      const newScore = (playerScoresRef.current[currentPlayer.id] || 0) + pts;
      playerScoresRef.current[currentPlayer.id] = newScore;
      setPlayerScores((prev) => ({
        ...prev,
        [currentPlayer.id]: newScore,
      }));
    } else {
      playBeepSound(200, 0.3, soundEnabled);
      triggerVibration(40, vibrationEnabled);
    }

    setLastShotFeedback(feedback);

    setTimeout(() => {
      setLastShotFeedback(null);
      setNetRipple(false);
      setBallPos({ x: 50, y: 82 });
      setBallScale(1);
      setBallRotation(0);
      setIsShooting(false);

      if (mode === 'single') {
        if (currentShot < totalShots) {
          setCurrentShot((s) => s + 1);
        } else {
          finishGame();
        }
      } else {
        if (currentPlayerIdx < players.length - 1) {
          setCurrentPlayerIdx((prev) => prev + 1);
        } else if (currentShot < totalShots) {
          setCurrentPlayerIdx(0);
          setCurrentShot((s) => s + 1);
        } else {
          finishGame();
        }
      }
    }, 1400);
  };

  const finishGame = () => {
    if (isFinishedRef.current) return;
    isFinishedRef.current = true;

    const results = players.map((p) => {
      const score = playerScoresRef.current[p.id] || 0;
      return {
        playerId: p.id,
        score,
        stats: {
          'Toplam Puan': score,
          'Atılan Şut': totalShots,
          'Kombo Seri': `${streakCount} Swish`,
        },
      };
    });

    onFinishGame(results);
  };

  // Trajectory Prediction Vector Math
  let trajectoryPath = '';
  if (aimTarget) {
    const targetX = aimTarget.x;
    const targetY = aimTarget.y;
    const apexY = Math.min(82, targetY) - 22;

    trajectoryPath = `M 50 82 Q ${(50 + targetX) / 2} ${apexY} ${targetX} ${targetY}`;
  }

  return (
    <div className="relative flex-1 flex flex-col h-full w-full bg-slate-950 text-white select-none overflow-hidden touch-none p-3 space-y-2">
      {/* Stadium Top Bar HUD */}
      <div className="flex items-center justify-between bg-slate-900/90 border border-slate-800 rounded-2xl px-4 py-2.5 shadow-xl backdrop-blur">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <Target className="w-5 h-5" aria-hidden="true" />
          </div>
          <span className="font-black text-sm tracking-wide text-white">NBA ALL-STAR BASKET</span>
        </div>

        <div className="flex items-center gap-3 text-xs font-black">
          {isMoneyball && (
            <span className="text-amber-300 bg-amber-500/20 border border-amber-500/30 px-2.5 py-1 rounded-full flex items-center gap-1 animate-pulse shadow-[0_0_10px_#F59E0B]">
              <Sparkles className="w-3.5 h-3.5" /> 💎 2X MONEYBALL
            </span>
          )}

          {isFireball && (
            <span className="text-rose-400 bg-rose-500/20 border border-rose-500/40 px-2.5 py-1 rounded-full flex items-center gap-1 animate-pulse shadow-[0_0_10px_#EF4444]">
              <Flame className="w-3.5 h-3.5 fill-current" /> 🔥 ALEVLİ TOP
            </span>
          )}

          <span style={{ color: currentPlayer.color }} className="bg-slate-950/80 px-2.5 py-1 rounded-xl border border-slate-800">
            👤 {currentPlayer.name}
          </span>
          <span className="text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full flex items-center gap-1">
            <Trophy className="w-3.5 h-3.5" /> Skor: {playerScores[currentPlayer.id] || 0}
          </span>
          <span className="text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-3 py-1 rounded-full flex items-center gap-1">
            <Zap className="w-3.5 h-3.5" /> Atış: {currentShot} / {totalShots}
          </span>
        </div>
      </div>

      {/* Main 3D Hardwood Basketball Court Arena */}
      <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className="flex-1 relative border-2 border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col justify-between cursor-crosshair"
        style={{
          background: 'linear-gradient(to bottom, #090D16 0%, #451A03 35%, #7C2D12 65%, #9A3412 100%)',
        }}
      >
        {/* 3D Wood Plank Lines Overlay */}
        <div className="absolute inset-0 flex flex-col pointer-events-none opacity-20">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className={`flex-1 w-full border-b border-black/40 ${i % 2 === 0 ? 'bg-black/15' : 'bg-white/5'}`}
            />
          ))}
        </div>

        {/* Basketball Court Markings */}
        <div className="absolute inset-x-[12%] top-[4%] h-[60%] border-2 border-white/35 rounded-b-full pointer-events-none z-0" />
        <div className="absolute inset-x-[32%] top-[4%] h-[28%] border-b-2 border-x-2 border-amber-400/40 pointer-events-none z-0" />

        {/* Feedback Banner */}
        {lastShotFeedback && (
          <div className="absolute top-6 left-1/2 -translate-x-1/2 z-50 bg-slate-950/95 border-2 border-amber-400 px-6 py-2.5 rounded-full font-black text-xs text-amber-300 shadow-2xl animate-scale-up backdrop-blur">
            {lastShotFeedback}
          </div>
        )}

        {/* Dynamic Moving 3D Backboard & Rim SVG (Positioned at Y: 15.5%) */}
        <div
          style={{
            left: `${50 + hoopOffsetX}%`,
            top: '2%',
            transform: 'translateX(-50%)',
          }}
          className="absolute h-48 w-60 flex justify-center items-start z-10 pointer-events-none transition-all duration-75"
        >
          <svg width="240" height="170" viewBox="0 0 240 170" className="drop-shadow-2xl">
            <defs>
              <linearGradient id="glassGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#38BDF8" stopOpacity="0.1" />
              </linearGradient>
            </defs>

            {/* Backboard Stand Support */}
            <rect x="114" y="0" width="12" height="24" fill="#334155" />

            {/* Digital Shot Clock */}
            <rect x="90" y="2" width="60" height="14" rx="3" fill="#020617" stroke="#EF4444" strokeWidth="1" />
            <text x="120" y="12" fill="#EF4444" fontSize="10" fontWeight="900" textAnchor="middle">
              {isMoneyball ? '💎 2X' : isFireball ? '🔥 3X' : '24s'}
            </text>

            {/* Glass Backboard Plate */}
            <rect x="25" y="18" width="190" height="110" rx="10" fill="url(#glassGrad)" stroke="#F8FAFC" strokeWidth="5" opacity="0.95" />
            <rect x="80" y="54" width="80" height="55" rx="4" fill="none" stroke="#EF4444" strokeWidth="4" />
            <rect x="28" y="21" width="184" height="104" rx="8" fill="none" stroke="#DC2626" strokeWidth="2" opacity="0.8" />

            {/* Metallic Rim & Animated Net Mesh (Rim Center: cy=112 -> Y: 15.5%) */}
            <g className={netRipple ? 'animate-bounce' : ''}>
              <ellipse cx="120" cy="112" rx="28" ry="8" fill="none" stroke="#EA580C" strokeWidth="6" />

              {/* Net Swish Mesh */}
              <path
                d="M 94 113 L 102 148 L 120 154 L 138 148 L 146 113"
                fill="none"
                stroke={netRipple ? '#F59E0B' : '#F8FAFC'}
                strokeWidth="3"
                strokeDasharray="5 3"
              />
              <path
                d="M 107 113 L 120 152 L 133 113"
                fill="none"
                stroke={netRipple ? '#F59E0B' : '#F8FAFC'}
                strokeWidth="2.5"
              />
            </g>
          </svg>
        </div>

        {/* Live Parabolic Arc Trajectory Prediction Curve */}
        {trajectoryPath && (
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-30 overflow-visible">
            <path d={trajectoryPath} fill="none" stroke="#F59E0B" strokeWidth="4" strokeDasharray="8 6" className="animate-pulse" />
          </svg>
        )}

        {/* Target Aiming Reticle Marker */}
        {aimTarget && (
          <div
            style={{
              left: `${aimTarget.x}%`,
              top: `${aimTarget.y}%`,
              transform: 'translate(-50%, -50%)',
            }}
            className="absolute z-50 pointer-events-none flex items-center justify-center"
          >
            <div className="w-10 h-10 rounded-full border-2 border-dashed border-amber-300 animate-spin-slow flex items-center justify-center">
              <div className="w-3 h-3 rounded-full bg-amber-400 shadow-[0_0_12px_#F59E0B]" />
            </div>
          </div>
        )}

        {/* 3D Basketball Object */}
        <div
          style={{
            left: `${ballPos.x}%`,
            top: `${ballPos.y}%`,
            transform: `translate(-50%, -50%) scale(${ballScale}) rotate(${ballRotation}deg)`,
          }}
          className={`absolute w-16 h-16 transition-transform duration-75 z-40 drop-shadow-2xl pointer-events-none ${
            isFireball ? 'drop-shadow-[0_0_20px_#EF4444]' : isMoneyball ? 'drop-shadow-[0_0_20px_#3B82F6]' : ''
          }`}
        >
          <svg width="64" height="64" viewBox="0 0 100 100">
            <defs>
              <radialGradient id="stdBallGrad" cx="35%" cy="35%" r="65%">
                <stop offset="0%" stopColor="#FB923C" />
                <stop offset="100%" stopColor="#EA580C" />
              </radialGradient>

              <radialGradient id="moneyBallGrad" cx="35%" cy="35%" r="65%">
                <stop offset="0%" stopColor="#60A5FA" />
                <stop offset="50%" stopColor="#EF4444" />
                <stop offset="100%" stopColor="#1E3A8A" />
              </radialGradient>

              <radialGradient id="fireBallGrad" cx="35%" cy="35%" r="65%">
                <stop offset="0%" stopColor="#FDE047" />
                <stop offset="60%" stopColor="#EF4444" />
                <stop offset="100%" stopColor="#7F1D1D" />
              </radialGradient>
            </defs>

            {/* Ball Body */}
            <circle
              cx="50"
              cy="50"
              r="46"
              fill={
                isFireball
                  ? 'url(#fireBallGrad)'
                  : isMoneyball
                  ? 'url(#moneyBallGrad)'
                  : 'url(#stdBallGrad)'
              }
              stroke="#0F172A"
              strokeWidth="3"
            />

            {/* Ribbed Seam Lines */}
            <path d="M 4 50 H 96" stroke="#0F172A" strokeWidth="4.5" />
            <path d="M 50 4 V 96" stroke="#0F172A" strokeWidth="4.5" />
            <path d="M 18 18 Q 50 42 82 18" fill="none" stroke="#0F172A" strokeWidth="4" />
            <path d="M 18 82 Q 50 58 82 82" fill="none" stroke="#0F172A" strokeWidth="4" />
          </svg>
        </div>

        {/* Instruction Footer */}
        <div className="relative z-40 text-center py-2.5 mx-4 mb-3 bg-slate-950/80 border border-amber-500/30 rounded-2xl backdrop-blur shadow-2xl">
          <p className="text-xs text-amber-300 font-black flex items-center justify-center gap-1.5">
            🎯 Ekrana dokunarak nişangahı potaya getirin ve parmağınızı bırakıp kusursuz basketler atın!
          </p>
        </div>
      </div>
    </div>
  );
};
