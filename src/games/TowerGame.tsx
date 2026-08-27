import React, { useState, useEffect, useRef } from 'react';
import { Building2, Sparkles, Trophy, Cloud, Star, Timer, Plus } from 'lucide-react';
import type { Player } from '../types/game';
import { playBeepSound, playFanfareSound, triggerVibration } from '../utils/audio';

interface TowerGameProps {
  mode: 'single' | 'multi';
  players: Player[];
  onFinishGame: (results: { playerId: string; score: number; stats?: Record<string, number | string> }[]) => void;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
}

interface FloorBlock {
  id: number;
  width: number; // percentage width (40..70%)
  x: number; // percentage position
  tiltOffset: number; // offset from ideal center
}

export const TowerGame: React.FC<TowerGameProps> = ({
  players,
  onFinishGame,
  soundEnabled,
  vibrationEnabled,
}) => {
  const INITIAL_WIDTH = 55;

  const [floors, setFloors] = useState<FloorBlock[]>([
    { id: 1, width: INITIAL_WIDTH, x: 22.5, tiltOffset: 0 },
  ]);

  // Game States & 60s Construction Rush Timer
  const [craneX, setCraneX] = useState<number>(50);
  const [towerTilt, setTowerTilt] = useState<number>(0);
  const [score, setScore] = useState<number>(1);
  const [timeLeft, setTimeLeft] = useState<number>(60);
  const [perfectStreak, setPerfectStreak] = useState<number>(0);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [timeBonusNotice, setTimeBonusNotice] = useState<string | null>(null);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);

  const animRef = useRef<number | null>(null);
  const timeRef = useRef<number>(0);
  const isFinishedRef = useRef<boolean>(false);
  const scoreRef = useRef<number>(1);
  const perfectStreakRef = useRef<number>(0);
  const towerTiltRef = useRef<number>(0);

  // 60-Second Countdown Timer Loop
  useEffect(() => {
    if (isGameOver || isFinishedRef.current) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleTimeExpired();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isGameOver]);

  // Crane Pendulum Oscillation Loop
  useEffect(() => {
    if (isGameOver || isFinishedRef.current) return;

    const loop = () => {
      timeRef.current += 0.04;

      // Dynamic oscillation speed for thrilling construction tempo
      const speed = 1.1 + Math.min(1.4, scoreRef.current * 0.05);
      const amp = 36 + Math.min(8, scoreRef.current * 0.4);

      const newX = 50 + Math.sin(timeRef.current * speed) * amp;
      setCraneX(newX);

      animRef.current = requestAnimationFrame(loop);
    };

    animRef.current = requestAnimationFrame(loop);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [isGameOver]);

  const handleTimeExpired = () => {
    if (isFinishedRef.current) return;
    setIsGameOver(true);
    playFanfareSound(soundEnabled);
    triggerVibration([30, 40, 30], vibrationEnabled);
    setFeedback('🕒 SÜRE DOLDU! GÖKDELEN TAMAMLANDI!');
    setTimeout(() => finishGame(), 1600);
  };

  const handleDropFloor = () => {
    if (isGameOver || isFinishedRef.current) return;

    const topFloor = floors[floors.length - 1];

    const currentWidth = Math.max(40, topFloor.width);
    const currentX = craneX - currentWidth / 2;

    const currentEnd = currentX + currentWidth;
    const topEnd = topFloor.x + topFloor.width;

    const overlapStart = Math.max(currentX, topFloor.x);
    const overlapEnd = Math.min(currentEnd, topEnd);
    const overlapWidth = overlapEnd - overlapStart;

    // Check complete miss -> Collapse!
    if (overlapWidth <= 5) {
      playBeepSound(200, 0.4, soundEnabled);
      triggerVibration(70, vibrationEnabled);
      setIsGameOver(true);
      setFeedback('💥 GÖKDELEN YIKILDI!');
      setTimeout(() => finishGame(), 1600);
      return;
    }

    const diffCenter = Math.abs(currentX - topFloor.x);
    const isPerfect = diffCenter <= 3.8;

    let nextTilt = towerTiltRef.current;
    let feedbackMsg = '';
    let extraTimeSec = 0;

    if (isPerfect) {
      const nextStreak = perfectStreakRef.current + 1;
      perfectStreakRef.current = nextStreak;
      setPerfectStreak(nextStreak);

      nextTilt = nextTilt * 0.4;
      towerTiltRef.current = nextTilt;
      setTowerTilt(nextTilt);

      // Time Extension Bonuses for Fast Accurate Drops
      extraTimeSec = nextStreak >= 3 ? 5 : 3;
      setTimeLeft((t) => Math.min(99, t + extraTimeSec));

      playFanfareSound(soundEnabled);
      triggerVibration([25, 35], vibrationEnabled);

      feedbackMsg = nextStreak >= 2 ? `🔥 ${nextStreak}X MÜKEMMEL TEMPO!` : '✨ KUSURSUZ KAT!';

      setTimeBonusNotice(`+${extraTimeSec}s SÜRE BONUSU!`);
      setTimeout(() => setTimeBonusNotice(null), 1000);
    } else {
      perfectStreakRef.current = 0;
      setPerfectStreak(0);

      const tiltDelta = (currentX - topFloor.x) * 0.35;
      nextTilt = nextTilt + tiltDelta;
      towerTiltRef.current = nextTilt;
      setTowerTilt(nextTilt);

      if (Math.abs(nextTilt) > 15) {
        playBeepSound(200, 0.4, soundEnabled);
        triggerVibration(70, vibrationEnabled);
        setIsGameOver(true);
        setFeedback('⚖️ DENGE BOZULDU! GÖKDELEN YIKILDI!');
        setTimeout(() => finishGame(), 1600);
        return;
      }

      playBeepSound(650, 0.08, soundEnabled);
      triggerVibration(15, vibrationEnabled);
      feedbackMsg = '👍 KAT YERLEŞTİ';
    }

    setFeedback(feedbackMsg);

    const newFloor: FloorBlock = {
      id: floors.length + 1,
      width: currentWidth,
      x: isPerfect ? topFloor.x : overlapStart,
      tiltOffset: currentX - topFloor.x,
    };

    setFloors((prev) => [...prev.slice(-8), newFloor]);
    setScore((s) => {
      const next = s + 1;
      scoreRef.current = next;
      return next;
    });

    setTimeout(() => setFeedback(null), 1200);
  };

  const finishGame = () => {
    if (isFinishedRef.current) return;
    isFinishedRef.current = true;

    onFinishGame([
      {
        playerId: players[0].id,
        score: scoreRef.current,
        stats: {
          'Gökdelen Yüksekliği': `${scoreRef.current} Kat`,
          'Mükemmel Seri': `${perfectStreakRef.current}X`,
          'Kalan Süre': `${timeLeft}s`,
        },
      },
    ]);
  };

  return (
    <div
      onClick={handleDropFloor}
      className="relative flex-1 flex flex-col h-full w-full bg-slate-950 text-white select-none overflow-hidden touch-none p-3 space-y-2 cursor-pointer"
    >
      {/* Header HUD Bar */}
      <div className="flex items-center justify-between bg-slate-900/90 border border-slate-800 rounded-2xl px-4 py-2.5 shadow-xl backdrop-blur">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            <Building2 className="w-5 h-5" aria-hidden="true" />
          </div>
          <span className="font-black text-sm tracking-wide text-white">GÖKDELEN İNŞAATI</span>
        </div>

        <div className="flex items-center gap-3 text-xs font-black">
          {/* 60s Construction Timer Pill */}
          <span
            className={`px-3 py-1 rounded-full flex items-center gap-1 border transition-all ${
              timeLeft <= 10
                ? 'bg-rose-500/20 border-rose-500/40 text-rose-400 animate-pulse shadow-[0_0_12px_#EF4444]'
                : 'bg-amber-500/10 border-amber-500/20 text-amber-300'
            }`}
          >
            <Timer className="w-3.5 h-3.5" /> Süre: {timeLeft}s
          </span>

          {perfectStreak >= 2 && (
            <span className="text-amber-300 bg-amber-500/20 border border-amber-500/30 px-2.5 py-1 rounded-full flex items-center gap-1 animate-pulse">
              <Sparkles className="w-3.5 h-3.5" /> {perfectStreak}X
            </span>
          )}

          <span className="text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-3 py-1 rounded-full flex items-center gap-1">
            <Trophy className="w-3.5 h-3.5" /> {score} Kat
          </span>
        </div>
      </div>

      {/* Main Construction Skyline Arena */}
      <div
        className="flex-1 relative border-2 border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col justify-end p-4 transition-colors duration-1000"
        style={{
          background:
            score > 15
              ? 'linear-gradient(to bottom, #020617 0%, #0F172A 50%, #1E1B4B 100%)'
              : score > 8
              ? 'linear-gradient(to bottom, #0F172A 0%, #1E293B 60%, #312E81 100%)'
              : 'linear-gradient(to bottom, #020617 0%, #0F172A 60%, #1E293B 100%)',
        }}
      >
        {/* Background Clouds & Stars */}
        <div className="absolute inset-0 pointer-events-none opacity-30">
          <Star className="absolute top-8 left-12 w-4 h-4 text-white animate-pulse" />
          <Star className="absolute top-16 right-16 w-3 h-3 text-amber-200 animate-pulse" />
          <Cloud className="absolute top-24 left-1/4 w-12 h-12 text-slate-400 opacity-40" />
          <Cloud className="absolute top-36 right-1/4 w-16 h-16 text-slate-500 opacity-30" />
        </div>

        {/* Feedback Banner */}
        {feedback && (
          <div className="absolute top-6 left-1/2 -translate-x-1/2 z-50 bg-slate-950/95 border-2 border-cyan-400 px-6 py-2.5 rounded-full font-black text-xs text-amber-300 shadow-2xl animate-scale-up backdrop-blur">
            {feedback}
          </div>
        )}

        {/* Time Extension Bonus Floating Notification */}
        {timeBonusNotice && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 bg-amber-500/90 border border-amber-300 px-4 py-1.5 rounded-full font-black text-xs text-slate-950 shadow-xl animate-bounce flex items-center gap-1">
            <Plus className="w-3.5 h-3.5" /> {timeBonusNotice}
          </div>
        )}

        {/* Swinging Crane Top Cable & Hook SVG */}
        {!isGameOver && (
          <div className="absolute top-0 inset-x-0 h-40 pointer-events-none z-30">
            <svg width="100%" height="100%" className="overflow-visible">
              <line x1="0" y1="12" x2="100%" y2="12" stroke="#F59E0B" strokeWidth="6" strokeDasharray="12 6" />
              <circle cx={`${craneX}%`} cy="12" r="8" fill="#F59E0B" stroke="#0F172A" strokeWidth="2" />
              <line x1={`${craneX}%`} y1="12" x2={`${craneX}%`} y2="100" stroke="#94A3B8" strokeWidth="3" />
              <circle cx={`${craneX}%`} cy="100" r="6" fill="none" stroke="#F59E0B" strokeWidth="3" />
            </svg>

            {/* Swinging 3D Skyscraper Floor Block */}
            <div
              style={{
                left: `${craneX}%`,
                width: `${floors[floors.length - 1]?.width || INITIAL_WIDTH}%`,
                transform: 'translateX(-50%)',
                top: '100px',
              }}
              className="absolute h-10 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-700 border-2 border-white shadow-[0_0_20px_#38BDF8] flex items-center justify-around px-3 transition-transform"
            >
              <div className="w-3 h-4 bg-amber-300 rounded-sm shadow-[0_0_6px_#FDE047]" />
              <div className="w-3 h-4 bg-amber-300 rounded-sm shadow-[0_0_6px_#FDE047]" />
              <div className="w-3 h-4 bg-amber-300 rounded-sm shadow-[0_0_6px_#FDE047]" />
            </div>
          </div>
        )}

        {/* Stacked Skyscraper Tower Container (With Dynamic Balance Tilt) */}
        <div
          style={{
            transform: `rotate(${towerTilt}deg)`,
            transformOrigin: 'bottom center',
          }}
          className="relative w-full flex flex-col justify-end transition-transform duration-300 z-20"
        >
          {floors.map((floor, idx) => (
            <div
              key={floor.id}
              style={{
                left: `${floor.x}%`,
                width: `${floor.width}%`,
                marginBottom: '4px',
              }}
              className="relative h-10 rounded-xl bg-gradient-to-r from-slate-900 via-indigo-900 to-slate-900 border-2 border-cyan-500/60 shadow-xl flex items-center justify-around px-3 transition-all"
            >
              <div className={`w-3 h-4 rounded-sm ${idx % 2 === 0 ? 'bg-amber-300 shadow-[0_0_6px_#FDE047]' : 'bg-cyan-300 shadow-[0_0_6px_#38BDF8]'}`} />
              <div className={`w-3 h-4 rounded-sm ${idx % 3 === 0 ? 'bg-amber-300 shadow-[0_0_6px_#FDE047]' : 'bg-cyan-300 shadow-[0_0_6px_#38BDF8]'}`} />
              <div className={`w-3 h-4 rounded-sm ${idx % 2 === 1 ? 'bg-amber-300 shadow-[0_0_6px_#FDE047]' : 'bg-cyan-300 shadow-[0_0_6px_#38BDF8]'}`} />

              <span className="absolute right-2 bottom-0.5 text-[9px] font-black text-white/50">
                KAT {floor.id}
              </span>
            </div>
          ))}

          {/* City Skyline Foundation Base */}
          <div className="w-full h-12 rounded-2xl bg-slate-950 border-2 border-slate-700 text-center text-xs font-black text-cyan-400 flex items-center justify-center shadow-2xl relative overflow-hidden z-10">
            <span className="relative z-10">🏙️ GÖKDELEN TEMELİ (EKRANA DOKUNUP KATİ BIRAK!)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
