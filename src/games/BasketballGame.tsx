import React, { useState, useRef, useEffect } from 'react';
import { Target } from 'lucide-react';
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
  const [ballPos, setBallPos] = useState<{ x: number; y: number }>({ x: 50, y: 78 });
  const [ballScale, setBallScale] = useState<number>(1);
  const [ballRotation, setBallRotation] = useState<number>(0);
  const [isShooting, setIsShooting] = useState<boolean>(false);
  const [lastShotFeedback, setLastShotFeedback] = useState<string | null>(null);

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

    const dx = dragStart.x - dragCurrent.x;
    const dy = dragStart.y - dragCurrent.y; // Pulling downwards = positive dy

    setDragStart(null);
    setDragCurrent(null);

    // Minimum drag threshold
    if (Math.hypot(dx, dy) < 25) return;

    setIsShooting(true);

    // Trajectory calculation: Pulling back Launches forward towards target
    const rect = containerRef.current?.getBoundingClientRect();
    const containerWidth = rect ? rect.width : 360;
    const containerHeight = rect ? rect.height : 500;

    // Target position percentages
    const targetX = Math.min(85, Math.max(15, 50 + (dx / containerWidth) * 120));
    const targetY = Math.min(45, Math.max(12, 78 - (dy / containerHeight) * 110));

    // Animate ball arc towards target
    setBallRotation(720);
    setBallScale(0.65);
    setBallPos({ x: targetX, y: targetY });

    setTimeout(() => {
      evaluateShot(targetX, targetY);
    }, 550);
  };

  const evaluateShot = (targetX: number, targetY: number) => {
    // Hoop Rim Center is at X: 50%, Y: 22%
    const hoopX = 50;
    const hoopY = 22;
    const distToHoop = Math.hypot(targetX - hoopX, targetY - hoopY);

    let pts = 0;
    let feedback = '';

    if (distToHoop <= 6.5) {
      pts = 3;
      feedback = '🔥 TEMİZ BASKET! (+3 PUAN)';
    } else if (distToHoop <= 13) {
      pts = 2;
      feedback = '🏀 BASKET! (+2 PUAN)';
    } else {
      feedback = '❌ KAÇTI! (İsabet Sağlanamadı)';
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
      setBallPos({ x: 50, y: 78 });
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

    const results = players.map((p) => ({
      playerId: p.id,
      score: playerScoresRef.current[p.id] || 0,
      stats: {
        'Basket Puanı': playerScoresRef.current[p.id] || 0,
      },
    }));

    onFinishGame(results);
  };

  return (
    <div className="relative flex-1 flex flex-col h-full w-full bg-slate-950 text-white select-none overflow-hidden touch-none p-3 space-y-2">
      {/* Header Bar */}
      <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-2xl px-4 py-2.5 shadow-md">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-amber-400" aria-hidden="true" />
          <span className="font-extrabold text-sm text-white">Basket Atışı</span>
        </div>

        <div className="flex items-center gap-3 text-xs font-black">
          <span style={{ color: currentPlayer.color }}>
            {currentPlayer.name} (Skor: {playerScores[currentPlayer.id] || 0})
          </span>
          <span className="text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-3 py-1 rounded-full">
            Atış: {currentShot} / {totalShots}
          </span>
        </div>
      </div>

      {/* Main Basketball Hoop Arena */}
      <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className="flex-1 relative bg-gradient-to-b from-slate-950 via-slate-900 to-amber-950/20 border-2 border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col justify-between p-4"
      >
        {/* Feedback Banner */}
        {lastShotFeedback && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-40 bg-slate-950/95 border-2 border-amber-400 px-5 py-2.5 rounded-full font-black text-xs text-amber-300 shadow-2xl animate-scale-up">
            {lastShotFeedback}
          </div>
        )}

        {/* High-Quality Hoop Backboard & Net SVG */}
        <div className="relative w-full h-44 flex justify-center items-start pt-2">
          <svg width="220" height="150" viewBox="0 0 220 150" className="drop-shadow-2xl">
            {/* Backboard Stand Pole */}
            <rect x="105" y="0" width="10" height="30" fill="#334155" />

            {/* Backboard Glass Plate */}
            <rect x="30" y="20" width="160" height="100" rx="10" fill="#020617" stroke="#F8FAFC" strokeWidth="6" opacity="0.9" />
            <rect x="75" y="55" width="70" height="50" rx="4" fill="none" stroke="#F59E0B" strokeWidth="4" />

            {/* Orange Metallic Rim */}
            <ellipse cx="110" cy="115" rx="26" ry="7" fill="none" stroke="#EA580C" strokeWidth="6" />

            {/* Basketball Net Lines */}
            <path
              d="M 85 116 L 92 145 L 110 150 L 128 145 L 135 116"
              fill="none"
              stroke="#F8FAFC"
              strokeWidth="2.5"
              strokeDasharray="4 3"
            />
            <path
              d="M 98 116 L 110 148 L 122 116"
              fill="none"
              stroke="#F8FAFC"
              strokeWidth="2"
            />
          </svg>
        </div>

        {/* Slingshot Aim Line */}
        {dragStart && dragCurrent && (
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-30">
            <line
              x1={dragStart.x}
              y1={dragStart.y}
              x2={dragCurrent.x}
              y2={dragCurrent.y}
              stroke="#F59E0B"
              strokeWidth="4"
              strokeDasharray="6 6"
              strokeLinecap="round"
            />
            <circle cx={dragCurrent.x} cy={dragCurrent.y} r="8" fill="#F59E0B" opacity="0.8" />
          </svg>
        )}

        {/* Realistic Basketball SVG */}
        <div
          style={{
            left: `${ballPos.x}%`,
            top: `${ballPos.y}%`,
            transform: `translate(-50%, -50%) scale(${ballScale}) rotate(${ballRotation}deg)`,
          }}
          className="absolute w-16 h-16 transition-all duration-500 z-20 drop-shadow-2xl"
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

        {/* Instruction Banner */}
        <div className="text-center py-2.5 bg-slate-900/80 border border-slate-800 rounded-2xl backdrop-blur">
          <p className="text-xs text-amber-400 font-black">
            Topu aşağı-geriye doğru çekip potaya fırlatın!
          </p>
        </div>
      </div>
    </div>
  );
};
