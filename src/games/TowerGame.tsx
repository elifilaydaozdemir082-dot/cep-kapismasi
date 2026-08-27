import React, { useState, useEffect, useRef } from 'react';
import { Layers } from 'lucide-react';
import type { Player } from '../types/game';
import { playBeepSound, playFanfareSound, triggerVibration } from '../utils/audio';

interface TowerGameProps {
  mode: 'single' | 'multi';
  players: Player[];
  onFinishGame: (results: { playerId: string; score: number; stats?: Record<string, number | string> }[]) => void;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
}

interface Block {
  id: number;
  width: number; // percentage 10..100%
  x: number; // percentage position 0..100%
}

export const TowerGame: React.FC<TowerGameProps> = ({
  players,
  onFinishGame,
  soundEnabled,
  vibrationEnabled,
}) => {
  const [blocks, setBlocks] = useState<Block[]>([
    { id: 1, width: 70, x: 15 },
  ]);
  const [movingBlock, setMovingBlock] = useState<{ width: number; x: number; direction: 1 | -1 }>({
    width: 70,
    x: 0,
    direction: 1,
  });
  const [score, setScore] = useState<number>(1);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);

  const animRef = useRef<number | null>(null);
  const isFinishedRef = useRef<boolean>(false);
  const scoreRef = useRef<number>(1);

  // Moving Block Animation Loop
  useEffect(() => {
    if (isGameOver || isFinishedRef.current) return;

    const loop = () => {
      setMovingBlock((prev) => {
        let nextX = prev.x + prev.direction * 1.5;
        let nextDir = prev.direction;

        if (nextX >= 100 - prev.width) {
          nextX = 100 - prev.width;
          nextDir = -1;
        } else if (nextX <= 0) {
          nextX = 0;
          nextDir = 1;
        }

        return { ...prev, x: nextX, direction: nextDir };
      });

      animRef.current = requestAnimationFrame(loop);
    };

    animRef.current = requestAnimationFrame(loop);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [isGameOver]);

  const handlePlaceBlock = () => {
    if (isGameOver || isFinishedRef.current) return;

    const lastBlock = blocks[blocks.length - 1];

    // Calculate exact overlapping interval [overlapStart, overlapEnd]
    const movingEnd = movingBlock.x + movingBlock.width;
    const lastEnd = lastBlock.x + lastBlock.width;

    const overlapStart = Math.max(movingBlock.x, lastBlock.x);
    const overlapEnd = Math.min(movingEnd, lastEnd);
    const overlapWidth = overlapEnd - overlapStart;

    if (overlapWidth <= 0) {
      // Tower collapsed!
      playBeepSound(200, 0.4, soundEnabled);
      triggerVibration(60, vibrationEnabled);
      setIsGameOver(true);
      setFeedback('KULE YIKILDI!');
      setTimeout(() => finishGame(), 1500);
      return;
    }

    // Check if placement was nearly perfect (<2% difference)
    const diffCenter = Math.abs(movingBlock.x - lastBlock.x);
    const isPerfect = diffCenter < 2.0;

    if (isPerfect) {
      playFanfareSound(soundEnabled);
      triggerVibration([20, 30], vibrationEnabled);
      setFeedback('✨ MÜKEMMEL HİZALAMA!');
    } else {
      playBeepSound(600, 0.08, soundEnabled);
      triggerVibration(15, vibrationEnabled);
    }

    const finalWidth = isPerfect ? lastBlock.width : overlapWidth;
    const finalX = isPerfect ? lastBlock.x : overlapStart;

    const newBlock: Block = {
      id: blocks.length + 1,
      width: finalWidth,
      x: finalX,
    };

    setBlocks((prev) => [...prev.slice(-9), newBlock]);
    setScore((s) => {
      const next = s + 1;
      scoreRef.current = next;
      return next;
    });

    setMovingBlock({
      width: finalWidth,
      x: 0,
      direction: 1,
    });

    setTimeout(() => setFeedback(null), 1000);
  };

  const finishGame = () => {
    if (isFinishedRef.current) return;
    isFinishedRef.current = true;

    onFinishGame([
      {
        playerId: players[0].id,
        score: scoreRef.current,
        stats: {
          'Kule Yüksekliği': `${scoreRef.current} Kat`,
        },
      },
    ]);
  };

  return (
    <div
      onClick={handlePlaceBlock}
      className="relative flex-1 flex flex-col h-full w-full bg-slate-950 text-white select-none overflow-hidden touch-none p-3 space-y-2 cursor-pointer"
    >
      {/* Header Bar */}
      <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3 shadow-md">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-cyan-400" aria-hidden="true" />
          <span className="font-extrabold text-sm text-white">Denge Kulesi</span>
        </div>

        <span className="text-xs font-black text-amber-400 bg-amber-400/10 border border-amber-400/20 px-3 py-1 rounded-full">
          Kat: {score}
        </span>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-40 bg-slate-950/95 border-2 border-cyan-400 px-5 py-2.5 rounded-full font-black text-xs text-amber-300 shadow-2xl animate-scale-up">
          {feedback}
        </div>
      )}

      {/* Main Tower Stacking Arena */}
      <div className="flex-1 relative bg-gradient-to-b from-slate-950 via-slate-900 to-indigo-950/40 border-2 border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col justify-end p-4">
        {/* Moving Top Block */}
        {!isGameOver && (
          <div
            style={{
              left: `${movingBlock.x}%`,
              width: `${movingBlock.width}%`,
              bottom: `${(blocks.length + 1) * 36}px`,
            }}
            className="absolute h-8 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 border-2 border-white shadow-xl transition-all"
          />
        )}

        {/* Stacked Tower Blocks */}
        {blocks.map((block, idx) => (
          <div
            key={block.id}
            style={{
              left: `${block.x}%`,
              width: `${block.width}%`,
              bottom: `${(idx + 1) * 36}px`,
            }}
            className="absolute h-8 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 border-2 border-indigo-300 shadow-lg transition-all"
          />
        ))}

        {/* Base Platform */}
        <div className="w-full h-9 rounded-2xl bg-slate-950 border-2 border-slate-700 text-center text-xs font-black text-slate-300 flex items-center justify-center shadow-inner">
          EKRANA DOKUNARAK BLOĞU TAM ZAMANINDA BIRAK!
        </div>
      </div>
    </div>
  );
};
