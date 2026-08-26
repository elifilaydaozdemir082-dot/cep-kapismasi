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
    { id: 1, width: 80, x: 10 },
  ]);
  const [movingBlock, setMovingBlock] = useState<{ width: number; x: number; direction: 1 | -1 }>({
    width: 80,
    x: 0,
    direction: 1,
  });
  const [score, setScore] = useState<number>(1);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);

  const animRef = useRef<number | null>(null);

  // Moving Block Animation
  useEffect(() => {
    if (isGameOver) return;

    const loop = () => {
      setMovingBlock((prev) => {
        let nextX = prev.x + prev.direction * 1.4;
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
    if (isGameOver) return;

    const lastBlock = blocks[blocks.length - 1];
    const diff = movingBlock.x - lastBlock.x;
    const overlap = lastBlock.width - Math.abs(diff);

    if (overlap <= 0) {
      // Tower collapse!
      playBeepSound(200, 0.4, soundEnabled);
      triggerVibration(60, vibrationEnabled);
      setIsGameOver(true);
      setFeedback('KULE YIKILDI!');
      setTimeout(() => finishGame(), 1500);
      return;
    }

    // Successful Placement!
    const isPerfect = Math.abs(diff) < 2.5;
    if (isPerfect) {
      playFanfareSound(soundEnabled);
      triggerVibration([20, 30], vibrationEnabled);
      setFeedback('MÜKEMMEL HİZALAMA!');
    } else {
      playBeepSound(600, 0.08, soundEnabled);
      triggerVibration(15, vibrationEnabled);
    }

    const newWidth = isPerfect ? lastBlock.width : overlap;
    const newX = diff > 0 ? movingBlock.x : lastBlock.x;

    const newBlock: Block = {
      id: blocks.length + 1,
      width: newWidth,
      x: newX,
    };

    setBlocks((prev) => [...prev.slice(-8), newBlock]);
    setScore((s) => s + 1);

    setMovingBlock({
      width: newWidth,
      x: 0,
      direction: 1,
    });

    setTimeout(() => setFeedback(null), 1000);
  };

  const finishGame = () => {
    onFinishGame([
      {
        playerId: players[0].id,
        score,
        stats: {
          'Kule Katı': score,
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
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-40 bg-slate-950/95 border border-cyan-500 px-5 py-2 rounded-full font-black text-xs text-amber-400 shadow-2xl animate-scale-up">
          {feedback}
        </div>
      )}

      {/* Main Tower Stacking Arena */}
      <div className="flex-1 relative bg-slate-900 border-2 border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col justify-end p-4">
        {/* Moving Top Block */}
        {!isGameOver && (
          <div
            style={{
              left: `${movingBlock.x}%`,
              width: `${movingBlock.width}%`,
              bottom: `${(blocks.length + 1) * 36}px`,
            }}
            className="absolute h-8 rounded-xl bg-cyan-400 border-2 border-white shadow-xl transition-all"
          />
        )}

        {/* Stacked Blocks */}
        {blocks.map((block, idx) => (
          <div
            key={block.id}
            style={{
              left: `${block.x}%`,
              width: `${block.width}%`,
              bottom: `${(idx + 1) * 36}px`,
            }}
            className="absolute h-8 rounded-xl bg-indigo-600 border-2 border-indigo-300 shadow-lg transition-all"
          />
        ))}

        {/* Base Platform */}
        <div className="w-full h-8 rounded-2xl bg-slate-950 border-2 border-slate-700 text-center text-xs font-black text-slate-400 flex items-center justify-center">
          DOKUNARAK BLOĞU DURDUR!
        </div>
      </div>
    </div>
  );
};
