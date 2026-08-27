import React, { useState, useEffect, useRef } from 'react';
import { Layers, Sparkles, Trophy } from 'lucide-react';
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
  width: number; // percentage 35..100%
  x: number; // percentage position 0..100%
  colorIdx: number;
}

const BLOCK_COLORS = [
  'from-cyan-500 to-blue-600 border-cyan-300',
  'from-emerald-500 to-teal-600 border-emerald-300',
  'from-amber-500 to-orange-600 border-amber-300',
  'from-rose-500 to-pink-600 border-rose-300',
  'from-purple-500 to-indigo-600 border-purple-300',
];

export const TowerGame: React.FC<TowerGameProps> = ({
  players,
  onFinishGame,
  soundEnabled,
  vibrationEnabled,
}) => {
  const INITIAL_WIDTH = 70;
  const INITIAL_X = 15;

  const [blocks, setBlocks] = useState<Block[]>([
    { id: 1, width: INITIAL_WIDTH, x: INITIAL_X, colorIdx: 0 },
  ]);
  const [movingBlock, setMovingBlock] = useState<{ width: number; x: number; direction: 1 | -1 }>({
    width: INITIAL_WIDTH,
    x: 0,
    direction: 1,
  });
  const [score, setScore] = useState<number>(1);
  const [perfectCombo, setPerfectCombo] = useState<number>(0);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);

  const animRef = useRef<number | null>(null);
  const isFinishedRef = useRef<boolean>(false);
  const scoreRef = useRef<number>(1);
  const perfectComboRef = useRef<number>(0);

  // Moving Block Animation Loop (Adjusts speed based on tower height)
  useEffect(() => {
    if (isGameOver || isFinishedRef.current) return;

    const loop = () => {
      setMovingBlock((prev) => {
        // Speed increases gently with height
        const moveSpeed = Math.min(2.8, 1.3 + Math.floor(scoreRef.current / 5) * 0.2);
        let nextX = prev.x + prev.direction * moveSpeed;
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

    // Strict check: if no overlap at all, tower collapses!
    if (overlapWidth <= 0) {
      playBeepSound(200, 0.4, soundEnabled);
      triggerVibration(60, vibrationEnabled);
      setIsGameOver(true);
      setFeedback('❌ KULE YIKILDI!');
      setTimeout(() => finishGame(), 1500);
      return;
    }

    // Generous Perfect Alignment Check (Tolerance threshold: 3.8%)
    const diffCenter = Math.abs(movingBlock.x - lastBlock.x);
    const isPerfect = diffCenter <= 3.8;

    let finalWidth = lastBlock.width;
    let finalX = lastBlock.x;
    let feedbackText = '';

    if (isPerfect) {
      const nextCombo = perfectComboRef.current + 1;
      perfectComboRef.current = nextCombo;
      setPerfectCombo(nextCombo);

      playFanfareSound(soundEnabled);
      triggerVibration([25, 35], vibrationEnabled);

      // COMBO RECOVERY BONUS: Expands block width by +5% if combo >= 2!
      if (nextCombo >= 2) {
        finalWidth = Math.min(75, lastBlock.width + 5);
        finalX = Math.max(5, lastBlock.x - 2.5);
        feedbackText = `🔥 ${nextCombo}X PERFECT COMBO! (+KULE BÜYÜDÜ!)`;
      } else {
        finalWidth = lastBlock.width;
        finalX = lastBlock.x;
        feedbackText = '✨ MÜKEMMEL HİZALAMA!';
      }
    } else {
      perfectComboRef.current = 0;
      setPerfectCombo(0);

      playBeepSound(600, 0.08, soundEnabled);
      triggerVibration(15, vibrationEnabled);

      // MINIMUM WIDTH SAFETY FLOOR: Block width never shrinks below 35%!
      finalWidth = Math.max(35, overlapWidth);
      finalX = overlapStart;
      feedbackText = '👍 İYİ HİZALAMA';
    }

    setFeedback(feedbackText);

    const newBlock: Block = {
      id: blocks.length + 1,
      width: finalWidth,
      x: finalX,
      colorIdx: blocks.length % BLOCK_COLORS.length,
    };

    // Keep visible block history for smooth stack rendering
    setBlocks((prev) => [...prev.slice(-10), newBlock]);
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

    setTimeout(() => setFeedback(null), 1100);
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
          'En Yüksek Kombo': `${perfectComboRef.current}X`,
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
          <Layers className="w-5 h-5 text-emerald-400" aria-hidden="true" />
          <span className="font-extrabold text-sm text-white">Denge Kulesi</span>
        </div>

        <div className="flex items-center gap-3 text-xs font-black">
          {perfectCombo >= 2 && (
            <span className="text-amber-300 bg-amber-500/20 border border-amber-500/30 px-3 py-1 rounded-full flex items-center gap-1 animate-pulse">
              <Sparkles className="w-3.5 h-3.5" /> {perfectCombo}X KOMBO
            </span>
          )}
          <span className="text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-1 rounded-full flex items-center gap-1">
            <Trophy className="w-3.5 h-3.5" /> Kat: {score}
          </span>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-40 bg-slate-950/95 border-2 border-emerald-400 px-6 py-2.5 rounded-full font-black text-xs text-amber-300 shadow-2xl animate-scale-up backdrop-blur">
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
              bottom: `${(blocks.length + 1) * 38}px`,
            }}
            className="absolute h-9 rounded-2xl bg-gradient-to-r from-emerald-400 to-teal-500 border-2 border-white shadow-[0_0_20px_#10B981] transition-all z-30 flex items-center justify-center"
          >
            <div className="w-12 h-1.5 rounded-full bg-white/60" />
          </div>
        )}

        {/* Stacked Tower Blocks */}
        {blocks.map((block, idx) => (
          <div
            key={block.id}
            style={{
              left: `${block.x}%`,
              width: `${block.width}%`,
              bottom: `${(idx + 1) * 38}px`,
            }}
            className={`absolute h-9 rounded-2xl bg-gradient-to-r ${
              BLOCK_COLORS[block.colorIdx]
            } border-2 shadow-xl transition-all z-20 flex items-center justify-center`}
          >
            <div className="w-10 h-1.5 rounded-full bg-white/40" />
          </div>
        ))}

        {/* Base Platform */}
        <div className="w-full h-10 rounded-2xl bg-slate-950 border-2 border-slate-700 text-center text-xs font-black text-emerald-400 flex items-center justify-center shadow-inner z-10">
          EKRANA DOKUNARAK BLOĞU TAM ZAMANINDA BIRAK!
        </div>
      </div>
    </div>
  );
};
