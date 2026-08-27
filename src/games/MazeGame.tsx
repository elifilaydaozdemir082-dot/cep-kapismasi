import React, { useState, useEffect, useRef } from 'react';
import { Compass, Key, Navigation, Award } from 'lucide-react';
import type { Player } from '../types/game';
import { playBeepSound, playFanfareSound, triggerVibration } from '../utils/audio';

interface MazeGameProps {
  mode: 'single' | 'multi';
  players: Player[];
  onFinishGame: (results: { playerId: string; score: number; stats?: Record<string, number | string> }[]) => void;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
}

interface MazeLevel {
  levelNumber: number;
  size: number; // 5x5, 7x7, 9x9
  start: { r: number; c: number };
  keyPos: { r: number; c: number };
  exitPos: { r: number; c: number };
  walls: { r: number; c: number }[];
}

const MAZE_LEVELS: MazeLevel[] = [
  {
    levelNumber: 1,
    size: 5,
    start: { r: 0, c: 0 },
    keyPos: { r: 2, c: 2 },
    exitPos: { r: 4, c: 4 },
    walls: [
      { r: 0, c: 1 },
      { r: 1, c: 1 },
      { r: 3, c: 0 },
      { r: 3, c: 1 },
      { r: 3, c: 3 },
      { r: 1, c: 3 },
      { r: 2, c: 4 },
    ],
  },
  {
    levelNumber: 2,
    size: 7,
    start: { r: 0, c: 0 },
    keyPos: { r: 3, c: 3 },
    exitPos: { r: 6, c: 6 },
    walls: [
      { r: 0, c: 2 },
      { r: 1, c: 2 },
      { r: 2, c: 2 },
      { r: 4, c: 1 },
      { r: 4, c: 2 },
      { r: 4, c: 3 },
      { r: 2, c: 5 },
      { r: 3, c: 5 },
      { r: 4, c: 5 },
      { r: 5, c: 5 },
      { r: 6, c: 2 },
    ],
  },
  {
    levelNumber: 3,
    size: 8,
    start: { r: 0, c: 0 },
    keyPos: { r: 4, c: 4 },
    exitPos: { r: 7, c: 7 },
    walls: [
      { r: 0, c: 3 },
      { r: 1, c: 3 },
      { r: 2, c: 3 },
      { r: 3, c: 1 },
      { r: 3, c: 2 },
      { r: 5, c: 2 },
      { r: 5, c: 3 },
      { r: 5, c: 4 },
      { r: 5, c: 5 },
      { r: 2, c: 6 },
      { r: 3, c: 6 },
      { r: 4, c: 6 },
      { r: 6, c: 6 },
    ],
  },
];

export const MazeGame: React.FC<MazeGameProps> = ({
  players,
  onFinishGame,
  soundEnabled,
  vibrationEnabled,
}) => {
  const [currentLevelIdx, setCurrentLevelIdx] = useState<number>(0);
  const currentLevel = MAZE_LEVELS[currentLevelIdx] || MAZE_LEVELS[0];

  const [playerPos, setPlayerPos] = useState<{ r: number; c: number }>(currentLevel.start);
  const [hasKey, setHasKey] = useState<boolean>(false);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [feedback, setFeedback] = useState<string | null>(null);

  const elapsedTimeRef = useRef<number>(0);
  const isFinishedRef = useRef<boolean>(false);

  useEffect(() => {
    setPlayerPos(currentLevel.start);
    setHasKey(false);
  }, [currentLevelIdx]);

  useEffect(() => {
    const timer = setInterval(() => {
      if (isFinishedRef.current) return;
      setElapsedTime((prev) => {
        const next = +(prev + 0.1).toFixed(1);
        elapsedTimeRef.current = next;
        return next;
      });
    }, 100);

    return () => clearInterval(timer);
  }, []);

  const handleMove = (dr: number, dc: number) => {
    if (isFinishedRef.current) return;

    const nr = playerPos.r + dr;
    const nc = playerPos.c + dc;

    // Bounds check
    if (nr < 0 || nr >= currentLevel.size || nc < 0 || nc >= currentLevel.size) {
      return;
    }

    // Wall collision check
    const isWall = currentLevel.walls.some((w) => w.r === nr && w.c === nc);
    if (isWall) {
      playBeepSound(150, 0.2, soundEnabled);
      triggerVibration(40, vibrationEnabled);
      setFeedback('DUVARA ÇARPTIN! (+0.3s CEZA)');
      setElapsedTime((t) => {
        const next = +(t + 0.3).toFixed(1);
        elapsedTimeRef.current = next;
        return next;
      });
      setTimeout(() => setFeedback(null), 1000);
      return;
    }

    playBeepSound(500, 0.05, soundEnabled);
    setPlayerPos({ r: nr, c: nc });

    // Key pickup
    if (!hasKey && nr === currentLevel.keyPos.r && nc === currentLevel.keyPos.c) {
      setHasKey(true);
      playFanfareSound(soundEnabled);
      triggerVibration([20, 30], vibrationEnabled);
      setFeedback('🔑 ANAHTAR ALINDI!');
      setTimeout(() => setFeedback(null), 1000);
    }

    // Exit check
    if (hasKey && nr === currentLevel.exitPos.r && nc === currentLevel.exitPos.c) {
      if (currentLevelIdx < MAZE_LEVELS.length - 1) {
        playFanfareSound(soundEnabled);
        setFeedback(`SEVİYE ${currentLevel.levelNumber} TAMAMLANDI!`);
        setTimeout(() => {
          setFeedback(null);
          setCurrentLevelIdx((prev) => prev + 1);
        }, 1200);
      } else {
        finishGame();
      }
    }
  };

  const finishGame = () => {
    if (isFinishedRef.current) return;
    isFinishedRef.current = true;

    const finalTime = elapsedTimeRef.current;
    playFanfareSound(soundEnabled);
    onFinishGame([
      {
        playerId: players[0].id,
        score: finalTime,
        stats: {
          'Tamamlama Süresi': `${finalTime}s`,
          'Tamamlanan Seviye': `${MAZE_LEVELS.length} Seviye`,
        },
      },
    ]);
  };

  const size = currentLevel.size;

  return (
    <div className="relative flex-1 flex flex-col h-full w-full bg-slate-950 text-white select-none overflow-hidden touch-none p-3 space-y-2">
      {/* Header Bar */}
      <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-2xl px-4 py-2.5 shadow-md">
        <div className="flex items-center gap-2">
          <Compass className="w-5 h-5 text-indigo-400" aria-hidden="true" />
          <span className="font-extrabold text-sm text-white">Labirent Kaçışı</span>
        </div>

        <div className="flex items-center gap-3 text-xs font-black">
          <span className="text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-3 py-1 rounded-full">
            Seviye: {currentLevel.levelNumber} / {MAZE_LEVELS.length}
          </span>
          <span className="text-amber-400 bg-amber-400/10 border border-amber-400/20 px-3 py-1 rounded-full">
            Süre: {elapsedTime}s
          </span>
        </div>
      </div>

      {/* Main Grid Maze Arena */}
      <div className="flex-1 relative bg-slate-950 border-2 border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col items-center justify-center p-3">
        {/* Feedback Banner */}
        {feedback && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 bg-slate-950/95 border-2 border-indigo-400 px-5 py-2 rounded-full font-black text-xs text-amber-300 shadow-2xl animate-scale-up">
            {feedback}
          </div>
        )}

        {/* Dynamic Grid Layout */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))`,
            gridTemplateRows: `repeat(${size}, minmax(0, 1fr))`,
          }}
          className="w-full max-w-sm aspect-square bg-slate-900 border-2 border-slate-700 rounded-2xl p-1.5 gap-1 shadow-inner relative"
        >
          {Array.from({ length: size * size }).map((_, idx) => {
            const r = Math.floor(idx / size);
            const c = idx % size;

            const isPlayer = playerPos.r === r && playerPos.c === c;
            const isKey = !hasKey && currentLevel.keyPos.r === r && currentLevel.keyPos.c === c;
            const isExit = currentLevel.exitPos.r === r && currentLevel.exitPos.c === c;
            const isWall = currentLevel.walls.some((w) => w.r === r && w.c === c);

            return (
              <div
                key={idx}
                className={`rounded-lg flex items-center justify-center transition-all ${
                  isWall
                    ? 'bg-slate-800 border border-slate-700 shadow-inner'
                    : isExit
                    ? 'bg-emerald-950 border-2 border-emerald-400 text-emerald-300 font-black text-[10px]'
                    : isKey
                    ? 'bg-amber-950/80 border border-amber-400 text-amber-400 animate-pulse'
                    : 'bg-slate-950/60 border border-slate-800/50'
                }`}
              >
                {isPlayer ? (
                  <div className="p-1 rounded-xl bg-cyan-400 text-slate-950 shadow-md animate-scale-up">
                    <Navigation className="w-4 h-4 stroke-[3]" />
                  </div>
                ) : isKey ? (
                  <Key className="w-4 h-4 stroke-[2.5]" />
                ) : isExit ? (
                  <Award className="w-4 h-4 stroke-[2.5]" />
                ) : null}
              </div>
            );
          })}
        </div>
      </div>

      {/* D-Pad Directional Controls */}
      <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto pt-1">
        <div />
        <button
          onClick={() => handleMove(-1, 0)}
          className="py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-cyan-400 font-black text-sm active:scale-95 transition-all shadow-md"
        >
          ▲ YUKARI
        </button>
        <div />
        <button
          onClick={() => handleMove(0, -1)}
          className="py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-cyan-400 font-black text-sm active:scale-95 transition-all shadow-md"
        >
          ◀ SOL
        </button>
        <button
          onClick={() => handleMove(1, 0)}
          className="py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-cyan-400 font-black text-sm active:scale-95 transition-all shadow-md"
        >
          ▼ AŞAĞI
        </button>
        <button
          onClick={() => handleMove(0, 1)}
          className="py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-cyan-400 font-black text-sm active:scale-95 transition-all shadow-md"
        >
          SAĞ ▶
        </button>
      </div>
    </div>
  );
};
