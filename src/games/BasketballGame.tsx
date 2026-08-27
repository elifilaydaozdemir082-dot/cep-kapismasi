import React, { useState, useRef, useEffect } from 'react';
import { Target, Trophy, Zap, ArrowUpRight } from 'lucide-react';
import type { DifficultyLevel, Player } from '../types/game';
import { playBeepSound, playFanfareSound, triggerVibration } from '../utils/audio';

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

  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [dragCurrent, setDragCurrent] = useState<{ x: number; y: number } | null>(null);
  const [ballPos, setBallPos] = useState<{ x: number; y: number }>({ x: 50, y: 80 });
  const [ballScale, setBallScale] = useState<number>(1);
  const [ballRotation, setBallRotation] = useState<number>(0);
  const [isShooting, setIsShooting] = useState<boolean>(false);
  const [lastShotFeedback, setLastShotFeedback] = useState<string | null>(null);
  const [netRipple, setNetRipple] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const isFinishedRef = useRef<boolean>(false);
  const playerScoresRef = useRef<Record<string, number>>({});

  useEffect(() => {
    const initial: Record<string, number> = {};
    players.forEach((p) => (initial[p.id] = 0));
    playerScoresRef.current = initial;
  }, [players]);

  const currentPlayer = players[currentPlayerIdx] || players[0];

  const handlePointerDown = (e: React.PointerEvent) => {
    if (isShooting || isFinishedRef.current) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setDragStart({ x, y });
    setDragCurrent({ x, y });
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragStart || isShooting || isFinishedRef.current) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setDragCurrent({ x, y });
  };

  const handlePointerUp = () => {
    if (!dragStart || !dragCurrent || isShooting || isFinishedRef.current) {
      setDragStart(null);
      setDragCurrent(null);
      return;
    }

    // Direct Intuitive Drag Vector:
    // Dragging right (dragCurrent.x > dragStart.x) produces positive dx -> Moves right!
    // Dragging up (dragStart.y > dragCurrent.y) produces positive dy -> Moves forward to hoop!
    const dx = dragCurrent.x - dragStart.x;
    const dy = dragStart.y - dragCurrent.y;

    setDragStart(null);
    setDragCurrent(null);

    // Minimum drag threshold (25px)
    if (Math.hypot(dx, dy) < 25) return;

    setIsShooting(true);

    const rect = containerRef.current?.getBoundingClientRect();
    const containerWidth = rect ? rect.width : 360;
    const containerHeight = rect ? rect.height : 500;

    // Target position percentages (Aligned cleanly to visual hoop at X: 50%, Y: 36%)
    const targetX = Math.min(88, Math.max(12, 50 + (dx / containerWidth) * 90));
    const targetY = Math.min(65, Math.max(15, 80 - (dy / containerHeight) * 180));

    // Animate ball arc towards target
    setBallRotation(720);
    setBallScale(0.65);
    setBallPos({ x: targetX, y: targetY });

    setTimeout(() => {
      evaluateShot(targetX, targetY);
    }, 550);
  };

  const evaluateShot = (targetX: number, targetY: number) => {
    // Hoop Rim Center is aligned at X: 50%, Y: 36%
    const hoopX = 50;
    const hoopY = 36;
    const distToHoop = Math.hypot(targetX - hoopX, targetY - hoopY);

    let pts = 0;
    let feedback = '';

    if (distToHoop <= 5.2) {
      pts = 3;
      feedback = '🔥 SWISH! TEMİZ BASKET! (+3 PUAN)';
      setNetRipple(true);
    } else if (distToHoop <= 9.5) {
      pts = 2;
      feedback = '🏀 BASKET! (+2 PUAN)';
      setNetRipple(true);
    } else if (distToHoop <= 14.5) {
      feedback = '💥 PANYADAN/ÇEMBERDEN SEKTİ!';
      // Bounce off effect
      setBallPos((prev) => ({ x: prev.x > 50 ? prev.x + 8 : prev.x - 8, y: prev.y + 10 }));
    } else {
      feedback = '❌ HAVA TOPU! (İsabet Sağlanamadı)';
    }

    if (pts > 0) {
      playFanfareSound(soundEnabled);
      triggerVibration([20, 30], vibrationEnabled);
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
      setBallPos({ x: 50, y: 80 });
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
    }, 1500);
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
        },
      };
    });

    onFinishGame(results);
  };

  return (
    <div className="relative flex-1 flex flex-col h-full w-full bg-slate-950 text-white select-none overflow-hidden touch-none p-3 space-y-2">
      {/* Stadium Top Bar HUD */}
      <div className="flex items-center justify-between bg-slate-900/90 border border-slate-800 rounded-2xl px-4 py-2.5 shadow-xl backdrop-blur">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <Target className="w-5 h-5" aria-hidden="true" />
          </div>
          <span className="font-black text-sm tracking-wide text-white">BASKET ATIŞI SALONU</span>
        </div>

        <div className="flex items-center gap-3 text-xs font-black">
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

      {/* Main 3D Hardwood Basketball Court Container */}
      <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className="flex-1 relative border-2 border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col justify-between"
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

        {/* Basketball Court Markings (Three Point Arc & Key Area) */}
        <div className="absolute inset-x-[12%] top-[6%] h-[60%] border-2 border-white/35 rounded-b-full pointer-events-none z-0" />
        <div className="absolute inset-x-[32%] top-[6%] h-[28%] border-b-2 border-x-2 border-amber-400/40 pointer-events-none z-0" />

        {/* Feedback Banner */}
        {lastShotFeedback && (
          <div className="absolute top-6 left-1/2 -translate-x-1/2 z-40 bg-slate-950/95 border-2 border-amber-400 px-6 py-2.5 rounded-full font-black text-xs text-amber-300 shadow-2xl animate-scale-up backdrop-blur">
            {lastShotFeedback}
          </div>
        )}

        {/* 3D Glass Backboard, Red LED & Swish Net SVG */}
        <div className="absolute top-[6%] inset-x-0 h-44 flex justify-center items-start z-10 pointer-events-none">
          <svg width="240" height="160" viewBox="0 0 240 160" className="drop-shadow-2xl">
            <defs>
              <linearGradient id="glassGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#38BDF8" stopOpacity="0.1" />
              </linearGradient>
            </defs>

            {/* Backboard Stand Support */}
            <rect x="114" y="0" width="12" height="30" fill="#334155" />

            {/* Glass Backboard Plate */}
            <rect x="25" y="18" width="190" height="110" rx="10" fill="url(#glassGrad)" stroke="#F8FAFC" strokeWidth="5" opacity="0.95" />
            <rect x="80" y="55" width="80" height="55" rx="4" fill="none" stroke="#EF4444" strokeWidth="4" />

            {/* Red LED Boundary Frame */}
            <rect x="28" y="21" width="184" height="104" rx="8" fill="none" stroke="#DC2626" strokeWidth="2" opacity="0.8" />

            {/* Metallic Rim & Net Swish */}
            <g className={netRipple ? 'animate-bounce' : ''}>
              {/* Orange Metallic Rim */}
              <ellipse cx="120" cy="118" rx="28" ry="8" fill="none" stroke="#EA580C" strokeWidth="6" />

              {/* 3D Basketball Net Lines */}
              <path
                d="M 94 119 L 102 152 L 120 158 L 138 152 L 146 119"
                fill="none"
                stroke="#F8FAFC"
                strokeWidth="3"
                strokeDasharray="5 3"
              />
              <path
                d="M 107 119 L 120 156 L 133 119"
                fill="none"
                stroke="#F8FAFC"
                strokeWidth="2.5"
              />
            </g>
          </svg>
        </div>

        {/* Dotted Aim Trajectory Line */}
        {dragStart && dragCurrent && (
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-30">
            <line
              x1={dragStart.x}
              y1={dragStart.y}
              x2={dragCurrent.x}
              y2={dragCurrent.y}
              stroke="#F59E0B"
              strokeWidth="5"
              strokeDasharray="8 8"
              strokeLinecap="round"
            />
            <circle cx={dragCurrent.x} cy={dragCurrent.y} r="10" fill="#F59E0B" opacity="0.9" />
          </svg>
        )}

        {/* 8-Seam Basketball SVG */}
        <div
          style={{
            left: `${ballPos.x}%`,
            top: `${ballPos.y}%`,
            transform: `translate(-50%, -50%) scale(${ballScale}) rotate(${ballRotation}deg)`,
          }}
          className="absolute w-16 h-16 transition-all duration-500 z-20 drop-shadow-2xl pointer-events-none"
        >
          <svg width="64" height="64" viewBox="0 0 100 100">
            <defs>
              <radialGradient id="basketballGrad" cx="35%" cy="35%" r="65%">
                <stop offset="0%" stopColor="#FB923C" />
                <stop offset="60%" stopColor="#EA580C" />
                <stop offset="100%" stopColor="#9A3412" />
              </radialGradient>
            </defs>

            {/* Ball Body */}
            <circle cx="50" cy="50" r="46" fill="url(#basketballGrad)" stroke="#0F172A" strokeWidth="3" />

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
            <ArrowUpRight className="w-4 h-4 text-amber-400" /> Topa dokunup potaya doğru nişan alıp fırlatın!
          </p>
        </div>
      </div>
    </div>
  );
};
