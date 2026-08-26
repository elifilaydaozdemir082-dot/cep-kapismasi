import React, { useState } from 'react';
import { Target, Trophy } from 'lucide-react';
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
  const [isShooting, setIsShooting] = useState<boolean>(false);
  const [lastShotFeedback, setLastShotFeedback] = useState<string | null>(null);

  const currentPlayer = players[currentPlayerIdx] || players[0];

  const handlePointerDown = (e: React.PointerEvent) => {
    if (isShooting) return;
    setDragStart({ x: e.clientX, y: e.clientY });
    setDragCurrent({ x: e.clientX, y: e.clientY });
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragStart || isShooting) return;
    setDragCurrent({ x: e.clientX, y: e.clientY });
  };

  const handlePointerUp = () => {
    if (!dragStart || !dragCurrent || isShooting) {
      setDragStart(null);
      setDragCurrent(null);
      return;
    }

    const dx = dragStart.x - dragCurrent.x;
    const dy = dragStart.y - dragCurrent.y;

    setDragStart(null);
    setDragCurrent(null);

    if (dy < 30) return;

    setIsShooting(true);

    const targetX = Math.min(85, Math.max(15, 50 + dx * 0.25));
    const targetY = Math.min(40, Math.max(15, 80 - dy * 0.3));

    setBallPos({ x: targetX, y: targetY });

    setTimeout(() => {
      evaluateShot(targetX, targetY);
    }, 600);
  };

  const evaluateShot = (targetX: number, targetY: number) => {
    const hoopCenterX = 50;
    const hoopCenterY = 25;
    const distToHoop = Math.hypot(targetX - hoopCenterX, targetY - hoopCenterY);

    let pts = 0;
    let feedback = '';

    if (distToHoop < 8) {
      pts = 3;
      feedback = 'TEMİZ BASKET! (+3 PUAN)';
    } else if (distToHoop < 16) {
      pts = 2;
      feedback = 'BASKET! (+2 PUAN)';
    } else {
      feedback = 'KAÇTI! (İsabet Sağlanamadı)';
    }

    if (pts > 0) {
      playFanfareSound(soundEnabled);
      triggerVibration([20, 30], vibrationEnabled);
      setPlayerScores((prev) => ({
        ...prev,
        [currentPlayer.id]: prev[currentPlayer.id] + pts,
      }));
    } else {
      playBeepSound(200, 0.3, soundEnabled);
      triggerVibration(40, vibrationEnabled);
    }

    setLastShotFeedback(feedback);

    setTimeout(() => {
      setLastShotFeedback(null);
      setBallPos({ x: 50, y: 80 });
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
    const results = players.map((p) => ({
      playerId: p.id,
      score: playerScores[p.id] || 0,
      stats: {
        'Basket Puanı': playerScores[p.id] || 0,
      },
    }));

    onFinishGame(results);
  };

  return (
    <div className="relative flex-1 flex flex-col h-full w-full bg-slate-950 text-white select-none overflow-hidden touch-none p-3 space-y-2">
      {/* Header Bar */}
      <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3 shadow-md">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-amber-400" aria-hidden="true" />
          <span className="font-extrabold text-sm text-white">Basket Atışı</span>
        </div>

        <div className="flex items-center gap-3 text-xs font-black">
          <span style={{ color: currentPlayer.color }}>{currentPlayer.name}</span>
          <span className="text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-3 py-1 rounded-full">
            Atış: {currentShot} / {totalShots}
          </span>
        </div>
      </div>

      {/* Main Basketball Hoop Arena */}
      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className="flex-1 relative bg-gradient-to-b from-slate-900 via-indigo-950/40 to-slate-950 border-2 border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col justify-between p-4"
      >
        {/* Feedback Banner */}
        {lastShotFeedback && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-40 bg-slate-950/95 border border-amber-400 px-5 py-2 rounded-full font-black text-xs text-amber-400 shadow-2xl animate-scale-up">
            {lastShotFeedback}
          </div>
        )}

        {/* Hoop Backboard & Rim */}
        <div className="relative w-full h-32 flex justify-center items-start pt-4">
          <div className="w-28 h-20 bg-slate-950 border-4 border-white rounded-xl flex flex-col items-center justify-end shadow-2xl relative">
            <div className="w-14 h-10 border-2 border-amber-400 rounded-md mb-2" />
            <div className="absolute -bottom-3 w-16 h-3 bg-amber-500 rounded-full border border-slate-900 flex items-center justify-center shadow-lg">
              <div className="w-12 h-6 border-b-2 border-x-2 border-slate-300 border-dashed rounded-b-xl" />
            </div>
          </div>
        </div>

        {/* Drag Aim Trajectory Vector */}
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
            />
          </svg>
        )}

        {/* Ball */}
        <div
          style={{
            left: `${ballPos.x}%`,
            top: `${ballPos.y}%`,
          }}
          className="absolute -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-amber-500 border-2 border-slate-950 flex items-center justify-center font-black text-slate-950 shadow-2xl transition-all duration-500 z-20"
        >
          <Trophy className="w-6 h-6 text-slate-950 stroke-[2.5]" aria-hidden="true" />
        </div>

        {/* Instruction Footer */}
        <div className="text-center py-2 bg-slate-900/60 border border-slate-800 rounded-2xl">
          <p className="text-xs text-slate-300 font-bold">
            Topu geriye çekip potaya fırlatın!
          </p>
        </div>
      </div>
    </div>
  );
};
