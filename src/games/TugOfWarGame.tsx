import React, { useState, useEffect, useRef } from 'react';
import { Flame, Zap, Trophy } from 'lucide-react';
import type { Player } from '../types/game';
import { playBeepSound, playFanfareSound, playTapSound, triggerVibration } from '../utils/audio';

interface TugOfWarGameProps {
  mode: 'single' | 'multi';
  players: Player[];
  onFinishGame: (results: { playerId: string; score: number; stats?: Record<string, number | string> }[]) => void;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
}

export const TugOfWarGame: React.FC<TugOfWarGameProps> = ({
  mode,
  players,
  onFinishGame,
  soundEnabled,
  vibrationEnabled,
}) => {
  // Rope position from 0 (Left Player Win) to 100 (Right Player Win). 50 is center.
  const [ropePos, setRopePos] = useState<number>(50);
  const [isFinished, setIsFinished] = useState<boolean>(false);

  // Power Charge Bar for Super Pull (0..100)
  const [p1Power, setP1Power] = useState<number>(0);
  const [p2Power, setP2Power] = useState<number>(0);

  // Active Super Pull Glow State
  const [p1Super, setP1Super] = useState<boolean>(false);
  const [p2Super, setP2Super] = useState<boolean>(false);

  const isFinishedRef = useRef<boolean>(false);
  const ropePosRef = useRef<number>(50);

  const player1 = players[0];
  const player2 = players[1] || { id: 'bot', name: 'Dev Bot', color: '#EF4444', score: 0 };

  // AI Pull Loop for Single-Player Mode
  useEffect(() => {
    if (mode !== 'single' || isFinishedRef.current) return;

    const interval = setInterval(() => {
      if (isFinishedRef.current) return;

      // AI pulls right periodically
      const aiPullPower = 1.3 + Math.random() * 0.8;
      let newPos = ropePosRef.current + aiPullPower;

      // AI occasional Super Pull chance
      if (Math.random() < 0.08) {
        newPos += 4.5;
        setP2Super(true);
        setTimeout(() => setP2Super(false), 500);
      }

      ropePosRef.current = Math.min(96, newPos);
      setRopePos(ropePosRef.current);

      if (ropePosRef.current >= 92) {
        clearInterval(interval);
        handleGameEnd(player2);
      }
    }, 130);

    return () => clearInterval(interval);
  }, [mode]);

  const handlePullLeft = () => {
    if (isFinishedRef.current) return;
    playTapSound(soundEnabled);
    triggerVibration(12, vibrationEnabled);

    // Charge Super Power
    setP1Power((prev) => {
      const next = prev + 12;
      if (next >= 100) {
        // Trigger P1 Super Pull!
        setP1Super(true);
        setTimeout(() => setP1Super(false), 600);
        ropePosRef.current = Math.max(8, ropePosRef.current - 9.0);
        setRopePos(ropePosRef.current);
        playFanfareSound(soundEnabled);
        return 0;
      }
      return next;
    });

    // Normal Pull
    const pullAmount = p1Super ? 6.0 : 2.6;
    const nextPos = Math.max(8, ropePosRef.current - pullAmount);
    ropePosRef.current = nextPos;
    setRopePos(nextPos);

    if (nextPos <= 12) {
      handleGameEnd(player1);
    }
  };

  const handlePullRight = () => {
    if (isFinishedRef.current || mode === 'single') return;
    playTapSound(soundEnabled);
    triggerVibration(12, vibrationEnabled);

    // Charge Super Power
    setP2Power((prev) => {
      const next = prev + 12;
      if (next >= 100) {
        // Trigger P2 Super Pull!
        setP2Super(true);
        setTimeout(() => setP2Super(false), 600);
        ropePosRef.current = Math.min(92, ropePosRef.current + 9.0);
        setRopePos(ropePosRef.current);
        playFanfareSound(soundEnabled);
        return 0;
      }
      return next;
    });

    // Normal Pull
    const pullAmount = p2Super ? 6.0 : 2.6;
    const nextPos = Math.min(92, ropePosRef.current + pullAmount);
    ropePosRef.current = nextPos;
    setRopePos(nextPos);

    if (nextPos >= 88) {
      handleGameEnd(player2);
    }
  };

  const handleGameEnd = (winner: Player) => {
    if (isFinishedRef.current) return;
    isFinishedRef.current = true;
    setIsFinished(true);

    if (winner.id === player1.id) {
      playFanfareSound(soundEnabled);
      triggerVibration([20, 40], vibrationEnabled);
    } else {
      playBeepSound(200, 0.3, soundEnabled);
      triggerVibration(50, vibrationEnabled);
    }

    const results = [
      {
        playerId: player1.id,
        score: winner.id === player1.id ? 100 : 35,
        stats: {
          'Düello Sonucu': winner.id === player1.id ? 'ŞAMPİYON (KAZANDI)' : 'ÇAMURA DÜŞTÜ',
        },
      },
    ];

    if (mode === 'multi' && players[1]) {
      results.push({
        playerId: players[1].id,
        score: winner.id === players[1].id ? 100 : 35,
        stats: {
          'Düello Sonucu': winner.id === players[1].id ? 'ŞAMPİYON (KAZANDI)' : 'ÇAMURA DÜŞTÜ',
        },
      });
    }

    setTimeout(() => onFinishGame(results), 1400);
  };

  return (
    <div className="relative flex-1 flex flex-col h-full w-full bg-slate-950 text-white select-none overflow-hidden touch-none p-3 space-y-2">
      {/* Header Bar with left padding reserved for global Ana Sayfa HomeButton */}
      <div className="flex items-center justify-between bg-slate-900/90 border border-slate-800 rounded-2xl pl-28 pr-3 py-1.5 shadow-md">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="font-black text-[11px] tracking-tight text-amber-400 truncate">🪢 HALAT ÇEKME</span>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] font-black shrink-0">
          <span style={{ color: player1.color }} className="bg-slate-950/80 px-2 py-0.5 rounded-lg border border-slate-800 truncate max-w-[80px]">
            👤 {player1.name}
          </span>
          <span className="text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-lg flex items-center gap-1">
            <Trophy className="w-3 h-3" /> VS
          </span>
          <span style={{ color: player2.color }} className="bg-slate-950/80 px-2 py-0.5 rounded-lg border border-slate-800 truncate max-w-[80px]">
            👤 {mode === 'single' ? 'BOT' : player2.name}
          </span>
        </div>
      </div>

      {/* Main Mud Pit Arena */}
      <div
        className="flex-1 relative border-2 border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col justify-between p-4"
        style={{
          background: 'linear-gradient(to bottom, #020617 0%, #3F2305 40%, #261303 70%, #0F0903 100%)',
        }}
      >
        {/* Super Pull Glow Banners */}
        {p1Super && (
          <div className="absolute top-4 left-4 z-50 bg-amber-500 text-slate-950 font-black text-xs px-3 py-1 rounded-full animate-bounce shadow-[0_0_20px_#F59E0B] flex items-center gap-1">
            <Flame className="w-4 h-4 fill-current" /> {player1.name} SÜPER ÇEKİŞ!
          </div>
        )}
        {p2Super && (
          <div className="absolute top-4 right-4 z-50 bg-rose-500 text-white font-black text-xs px-3 py-1 rounded-full animate-bounce shadow-[0_0_20px_#EF4444] flex items-center gap-1">
            <Flame className="w-4 h-4 fill-current" /> {mode === 'single' ? 'BOT' : player2.name} SÜPER ÇEKİŞ!
          </div>
        )}

        {/* Central Mud Pit Graphics */}
        <div className="relative w-full h-44 bg-amber-950/80 border-4 border-amber-900/60 rounded-3xl my-auto flex flex-col justify-center px-4 shadow-2xl overflow-hidden">
          {/* Mud Pit Waves Pattern */}
          <div className="absolute inset-0 bg-[radial-gradient(#78350F_1px,transparent_1px)] [background-size:16px_16px] opacity-40" />

          {/* Central Mud Danger Pit Zone */}
          <div className="absolute left-1/2 top-0 bottom-0 w-32 -translate-x-1/2 bg-amber-950 border-x-4 border-dashed border-amber-600/40 flex items-center justify-center pointer-events-none">
            <span className="text-[10px] font-black text-amber-500/60 uppercase tracking-widest rotate-90">
              💩 ÇAMUR ÇUKURU
            </span>
          </div>

          {/* Winning Flags */}
          <div className="absolute left-6 top-0 bottom-0 w-1 bg-cyan-400/40 border-r border-dashed border-cyan-400" />
          <div className="absolute right-6 top-0 bottom-0 w-1 bg-rose-400/40 border-l border-dashed border-rose-400" />

          {/* Heavy Rope SVG Strand */}
          <div className="relative w-full h-16 flex items-center z-20">
            <svg width="100%" height="48" className="w-full h-12 overflow-visible">
              <defs>
                <linearGradient id="tugRopeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#D97706" />
                  <stop offset="50%" stopColor="#F59E0B" />
                  <stop offset="100%" stopColor="#B45309" />
                </linearGradient>
              </defs>

              {/* Rope Shadow & Core */}
              <line x1="0" y1="24" x2="100%" y2="24" stroke="#451A03" strokeWidth="18" strokeLinecap="round" />
              <line x1="0" y1="24" x2="100%" y2="24" stroke="url(#tugRopeGrad)" strokeWidth="14" strokeLinecap="round" />
              <line x1="0" y1="24" x2="100%" y2="24" stroke="#78350F" strokeWidth="10" strokeDasharray="10 8" strokeLinecap="round" />
            </svg>

            {/* Central Red Marker Knot & Flag */}
            <div
              style={{ left: `${ropePos}%` }}
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 transition-all duration-75 z-40 flex flex-col items-center"
            >
              <div className="w-9 h-9 rounded-full bg-rose-600 border-2 border-white shadow-[0_0_20px_rgba(225,29,72,0.8)] flex items-center justify-center text-white font-black text-sm animate-pulse">
                🚩
              </div>
              <div className="w-1.5 h-10 bg-rose-500 shadow-md" />
            </div>

            {/* Left Pulling Character Stickman */}
            <div
              style={{ left: `calc(${ropePos}% - 65px)` }}
              className="absolute top-1/2 -translate-y-1/2 transition-all duration-75 z-30 flex items-center gap-1"
            >
              <div className="w-10 h-10 rounded-full bg-cyan-500 border-2 border-white shadow-lg flex items-center justify-center font-black text-xs text-white animate-bounce">
                🏋️‍♂️
              </div>
            </div>

            {/* Right Pulling Character Stickman */}
            <div
              style={{ left: `calc(${ropePos}% + 25px)` }}
              className="absolute top-1/2 -translate-y-1/2 transition-all duration-75 z-30 flex items-center gap-1"
            >
              <div className="w-10 h-10 rounded-full bg-rose-500 border-2 border-white shadow-lg flex items-center justify-center font-black text-xs text-white animate-bounce">
                🤼‍♂️
              </div>
            </div>
          </div>
        </div>

        {/* Action Touch Controls */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          {/* Player 1 Pull Button */}
          <div className="flex flex-col gap-1.5">
            {/* Power Meter */}
            <div className="w-full bg-slate-950 border border-cyan-500/30 rounded-full h-3 overflow-hidden p-0.5">
              <div
                style={{ width: `${p1Power}%` }}
                className="h-full bg-gradient-to-r from-cyan-500 to-amber-400 rounded-full transition-all duration-100"
              />
            </div>
            <button
              onClick={handlePullLeft}
              disabled={isFinished}
              style={{ backgroundColor: player1.color }}
              className="py-4 rounded-2xl font-black text-sm text-white shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-2 border-2 border-white/20"
            >
              <Zap className="w-5 h-5 fill-current" />
              <span>{player1.name} (ÇEK!)</span>
            </button>
          </div>

          {/* Player 2 / Bot Pull Button */}
          <div className="flex flex-col gap-1.5">
            {/* Power Meter */}
            <div className="w-full bg-slate-950 border border-rose-500/30 rounded-full h-3 overflow-hidden p-0.5">
              <div
                style={{ width: `${p2Power}%` }}
                className="h-full bg-gradient-to-r from-rose-500 to-amber-400 rounded-full transition-all duration-100"
              />
            </div>
            <button
              onClick={handlePullRight}
              disabled={isFinished || mode === 'single'}
              style={{ backgroundColor: player2.color }}
              className={`py-4 rounded-2xl font-black text-sm text-white shadow-2xl transition-all flex items-center justify-center gap-2 border-2 border-white/20 ${
                mode === 'single' ? 'opacity-60 cursor-not-allowed' : 'active:scale-95'
              }`}
            >
              <Zap className="w-5 h-5 fill-current" />
              <span>{mode === 'single' ? 'BOT RAKİP' : `${player2.name} (ÇEK!)`}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
