import React, { useState, useEffect, useRef } from 'react';
import { Timer, Smartphone } from 'lucide-react';
import type { Player } from '../types/game';
import { useTimer } from '../hooks/useTimer';
import { playTapSound, triggerVibration } from '../utils/audio';

interface MultiPlayerTapGameProps {
  players: Player[];
  onFinishGame: (finalPlayers: Player[]) => void;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
}

export const MultiPlayerTapGame: React.FC<MultiPlayerTapGameProps> = ({
  players,
  onFinishGame,
  soundEnabled,
  vibrationEnabled,
}) => {
  const [playerState, setPlayerState] = useState<Player[]>(players);
  const [ripples, setRipples] = useState<
    { id: number; playerId: string; x: number; y: number }[]
  >([]);
  const isFinishedRef = useRef<boolean>(false);
  const playersRef = useRef<Player[]>(players);

  // Sync ref immediately whenever player score changes
  const addPlayerScore = (playerId: string) => {
    if (isFinishedRef.current) return;
    const updated = playersRef.current.map((p) =>
      p.id === playerId ? { ...p, score: p.score + 1 } : p
    );
    playersRef.current = updated;
    setPlayerState(updated);
  };

  const handleTimeFinish = () => {
    if (isFinishedRef.current) return;
    isFinishedRef.current = true;
    onFinishGame(playersRef.current);
  };

  const { timeLeft, isRunning } = useTimer({
    durationSeconds: 10,
    onFinish: handleTimeFinish,
    autoStart: true,
  });

  const handleZoneTap = (
    playerId: string,
    e: React.PointerEvent<HTMLDivElement>
  ) => {
    if (!isRunning || isFinishedRef.current) return;

    e.preventDefault();
    e.stopPropagation();

    addPlayerScore(playerId);

    playTapSound(soundEnabled);
    triggerVibration(15, vibrationEnabled);

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const rippleId = Date.now() + Math.random();

    setRipples((prev) => [
      ...prev.slice(-15),
      { id: rippleId, playerId, x, y },
    ]);
  };

  // Keyboard shortcut support for desktop testing
  useEffect(() => {
    const keyMap: { [key: string]: number } = {
      KeyQ: 0, // Player 1
      KeyP: 1, // Player 2
      KeyZ: 2, // Player 3
      KeyM: 3, // Player 4
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isRunning || isFinishedRef.current) return;
      const idx = keyMap[e.code];
      if (idx !== undefined && idx < players.length) {
        e.preventDefault();
        const targetId = players[idx].id;
        addPlayerScore(targetId);
        playTapSound(soundEnabled);
        triggerVibration(15, vibrationEnabled);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isRunning, players, soundEnabled, vibrationEnabled]);

  const count = players.length;
  const gridClasses =
    count === 2
      ? 'grid-cols-2 grid-rows-1'
      : count === 3
      ? 'grid-cols-3 grid-rows-1'
      : 'grid-cols-2 grid-rows-2';

  const keyboardHints = ['Q Tuşu', 'P Tuşu', 'Z Tuşu', 'M Tuşu'];

  return (
    <div className="relative flex-1 flex flex-col h-full w-full bg-slate-950 text-white select-none overflow-hidden touch-none">
      {/* Floating Center Timer Badge */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
        <div className="flex items-center gap-2 bg-slate-950/90 border-2 border-cyan-500/80 px-6 py-2 rounded-full text-cyan-400 font-black text-xl shadow-2xl backdrop-blur-md animate-pulse">
          <Timer className="w-6 h-6" />
          <span>{timeLeft}s</span>
        </div>
      </div>

      {/* Touch Screen Control Zones Grid */}
      <div className={`flex-1 grid ${gridClasses} gap-2 p-2 h-full w-full`}>
        {playerState.map((p, idx) => (
          <div
            key={p.id}
            onPointerDown={(e) => handleZoneTap(p.id, e)}
            style={{ backgroundColor: p.color }}
            className="relative flex flex-col items-center justify-center rounded-2xl shadow-xl cursor-pointer active:scale-[0.98] transition-transform overflow-hidden select-none touch-none border-2 border-white/20"
          >
            {/* Visual Ripples for this player zone */}
            {ripples
              .filter((r) => r.playerId === p.id)
              .map((r) => (
                <span
                  key={r.id}
                  style={{ left: r.x, top: r.y }}
                  className="absolute w-20 h-20 -ml-10 -mt-10 rounded-full bg-white/40 pointer-events-none animate-ping opacity-75"
                />
              ))}

            <div className="relative z-10 text-center space-y-1 pointer-events-none">
              <span className="inline-block px-3 py-1 rounded-full bg-slate-950/40 text-white font-extrabold text-xs uppercase tracking-wider backdrop-blur-sm">
                {p.name}
              </span>

              <div className="text-6xl sm:text-7xl font-black text-white drop-shadow-2xl tracking-tight">
                {p.score}
              </div>

              <span className="block text-[10px] font-bold text-white/80 uppercase tracking-widest">
                DOKUN! ({keyboardHints[idx]})
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Landscape Hint Notification */}
      <div className="hidden sm:flex absolute bottom-2 left-1/2 -translate-x-1/2 z-20 pointer-events-none items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/80 text-[11px] text-slate-300 backdrop-blur-sm border border-slate-800">
        <Smartphone className="w-3.5 h-3.5 text-cyan-400 rotate-90" />
        <span>En iyi parti kapışması için telefonu yatay tutun</span>
      </div>
    </div>
  );
};
