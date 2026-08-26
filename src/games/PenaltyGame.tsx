import React, { useState, useRef } from 'react';
import { Goal, Shield } from 'lucide-react';
import type { Player } from '../types/game';
import { playBeepSound, playFanfareSound, triggerVibration } from '../utils/audio';

interface PenaltyGameProps {
  mode: 'single' | 'multi';
  players: Player[];
  onFinishGame: (results: { playerId: string; score: number; stats?: Record<string, number | string> }[]) => void;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
}

export const PenaltyGame: React.FC<PenaltyGameProps> = ({
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
  const [keeperPos, setKeeperPos] = useState<{ x: number }>({ x: 50 });
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isShooting, setIsShooting] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);
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

    const dx = dragCurrent.x - dragStart.x;
    const dy = dragStart.y - dragCurrent.y;

    setDragStart(null);
    setDragCurrent(null);

    if (dy < 30) return;

    setIsShooting(true);

    const targetX = Math.min(90, Math.max(10, 50 + dx * 0.2));
    const targetY = Math.min(45, Math.max(15, 80 - dy * 0.25));
    const keeperTargetX = Math.min(85, Math.max(15, 50 + (Math.random() - 0.5) * 70));

    setKeeperPos({ x: keeperTargetX });
    setBallPos({ x: targetX, y: targetY });

    setTimeout(() => {
      evaluateShot(targetX, targetY, keeperTargetX);
    }, 600);
  };

  const evaluateShot = (targetX: number, targetY: number, keeperTargetX: number) => {
    let shotGoal = false;
    let feedbackStr = '';

    if (targetY < 18) {
      feedbackStr = 'ÜSTTEN OUT! (Şut fazla güçlüydü)';
    } else if (targetX < 20 || targetX > 80) {
      feedbackStr = 'YANDAN OUT! (Köşeyi ortalayın)';
    } else {
      const keeperDist = Math.abs(targetX - keeperTargetX);
      if (keeperDist < 16) {
        feedbackStr = 'KALECİ KURTARDI!';
      } else {
        shotGoal = true;
        feedbackStr = targetX < 30 || targetX > 70 ? 'TAM KÖŞEYE MÜKEMMEL GOL!' : 'GOL!';
      }
    }

    if (shotGoal) {
      playFanfareSound(soundEnabled);
      triggerVibration([20, 30], vibrationEnabled);
      setPlayerScores((prev) => ({
        ...prev,
        [currentPlayer.id]: prev[currentPlayer.id] + 1,
      }));
    } else {
      playBeepSound(200, 0.3, soundEnabled);
      triggerVibration(40, vibrationEnabled);
    }

    setFeedback(feedbackStr);

    setTimeout(() => {
      setFeedback(null);
      setBallPos({ x: 50, y: 80 });
      setKeeperPos({ x: 50 });
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
        'Atılan Gol': `${playerScores[p.id] || 0}/${totalShots}`,
      },
    }));

    onFinishGame(results);
  };

  return (
    <div className="relative flex-1 flex flex-col h-full w-full bg-slate-950 text-white select-none overflow-hidden touch-none p-3 space-y-2">
      {/* Header Bar */}
      <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3 shadow-md">
        <div className="flex items-center gap-2">
          <Goal className="w-5 h-5 text-emerald-400" aria-hidden="true" />
          <span className="font-extrabold text-sm text-white">Penaltı Yarışması</span>
        </div>

        <div className="flex items-center gap-3 text-xs font-black">
          <span style={{ color: currentPlayer.color }}>{currentPlayer.name}</span>
          <span className="text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-3 py-1 rounded-full">
            Şut: {currentShot} / {totalShots}
          </span>
        </div>
      </div>

      {/* Main Goal Pitch Arena */}
      <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className="flex-1 relative bg-gradient-to-b from-slate-900 via-emerald-950/40 to-slate-950 border-2 border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col justify-between p-4"
      >
        {/* Feedback Banner */}
        {feedback && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-40 bg-slate-950/95 border border-emerald-500 px-5 py-2 rounded-full font-black text-xs text-amber-400 shadow-2xl animate-scale-up">
            {feedback}
          </div>
        )}

        {/* Goal Post Frame */}
        <div className="relative w-4/5 mx-auto h-36 border-4 border-white rounded-t-xl bg-slate-900/60 shadow-inner flex items-center justify-center">
          <div
            style={{ left: `${keeperPos.x}%` }}
            className="absolute bottom-2 -translate-x-1/2 p-2 rounded-xl bg-amber-400 text-slate-950 shadow-xl transition-all duration-300"
          >
            <Shield className="w-8 h-8 stroke-[2.5]" aria-hidden="true" />
          </div>
        </div>

        {/* Drag Aim Vector Line */}
        {dragStart && dragCurrent && (
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-30">
            <line
              x1={dragStart.x}
              y1={dragStart.y}
              x2={dragCurrent.x}
              y2={dragCurrent.y}
              stroke="#00D2D3"
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
          className="absolute -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white border-2 border-slate-900 flex items-center justify-center font-black text-slate-950 shadow-2xl transition-all duration-500 z-20"
        >
          <Goal className="w-6 h-6 text-slate-950 stroke-[2.5]" aria-hidden="true" />
        </div>

        {/* Instruction Footer */}
        <div className="text-center py-2 bg-slate-900/60 border border-slate-800 rounded-2xl">
          <p className="text-xs text-slate-300 font-bold">
            Topu kaleye doğru sürükleyip fırlatın!
          </p>
        </div>
      </div>
    </div>
  );
};
