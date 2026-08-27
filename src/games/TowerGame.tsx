import React, { useState, useEffect, useRef } from 'react';
import { Building2, Sparkles, Trophy, Cloud, Star, Timer, Shield, Flame } from 'lucide-react';
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
  width: number; // percentage width
  centerX: number; // percentage center position
  type: 'normal' | 'gold' | 'steel';
}

export const TowerGame: React.FC<TowerGameProps> = ({
  players,
  onFinishGame,
  soundEnabled,
  vibrationEnabled,
}) => {
  const INITIAL_WIDTH = 55;

  // Selected Duration Options (30s, 60s, 90s, Unlimited)
  const [selectedDuration, setSelectedDuration] = useState<number | 'unlimited'>(60);
  const [timeLeft, setTimeLeft] = useState<number | 'unlimited'>(60);
  const [isGameStarted, setIsGameStarted] = useState<boolean>(false);

  const [floors, setFloors] = useState<FloorBlock[]>([
    { id: 1, width: INITIAL_WIDTH, centerX: 50, type: 'normal' },
  ]);

  // Crane & Physics State
  const [craneX, setCraneX] = useState<number>(50); // Crane Hook Center X %
  const [towerTilt, setTowerTilt] = useState<number>(0);
  const [score, setScore] = useState<number>(1);
  const [perfectStreak, setPerfectStreak] = useState<number>(0);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);

  const animRef = useRef<number | null>(null);
  const timeRef = useRef<number>(0);
  const isFinishedRef = useRef<boolean>(false);
  const isGameOverRef = useRef<boolean>(false); // Strict Game Over Lock
  const scoreRef = useRef<number>(1);
  const perfectStreakRef = useRef<number>(0);
  const towerTiltRef = useRef<number>(0);

  // Sync Timer with Selected Duration
  const handleSelectDuration = (dur: number | 'unlimited') => {
    setSelectedDuration(dur);
    setTimeLeft(dur);
  };

  // Countdown Timer Loop
  useEffect(() => {
    if (!isGameStarted || isGameOver || isGameOverRef.current || isFinishedRef.current || selectedDuration === 'unlimited') return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (typeof prev === 'number' && prev <= 1) {
          clearInterval(timer);
          handleTimeExpired();
          return 0;
        }
        return typeof prev === 'number' ? prev - 1 : prev;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isGameStarted, isGameOver, selectedDuration]);

  // Crane Pendulum Oscillation Loop
  useEffect(() => {
    if (!isGameStarted || isGameOver || isGameOverRef.current || isFinishedRef.current) return;

    const loop = () => {
      timeRef.current += 0.038;

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
  }, [isGameStarted, isGameOver]);

  const handleTimeExpired = () => {
    if (isFinishedRef.current || isGameOverRef.current) return;
    isGameOverRef.current = true;
    setIsGameOver(true);

    playFanfareSound(soundEnabled);
    triggerVibration([30, 40, 30], vibrationEnabled);
    setFeedback('🕒 SÜRE DOLDU! GÖKDELEN TAMAMLANDI!');
    setTimeout(() => finishGame(), 1800);
  };

  const handleDropFloor = () => {
    if (!isGameStarted) {
      setIsGameStarted(true);
      return;
    }
    // Block clicks if game is over or time expired
    if (isGameOver || isGameOverRef.current || isFinishedRef.current) return;

    const topFloor = floors[floors.length - 1];

    // Standardized Center-Based Collision Math
    const currentWidth = Math.max(40, topFloor.width);

    const currentLeft = craneX - currentWidth / 2;
    const currentRight = craneX + currentWidth / 2;

    const topLeft = topFloor.centerX - topFloor.width / 2;
    const topRight = topFloor.centerX + topFloor.width / 2;

    const overlapLeft = Math.max(currentLeft, topLeft);
    const overlapRight = Math.min(currentRight, topRight);
    const overlapWidth = overlapRight - overlapLeft;

    // Total Miss Check -> Skyscraper Collapse
    if (overlapWidth <= 4) {
      isGameOverRef.current = true;
      setIsGameOver(true);
      playBeepSound(200, 0.4, soundEnabled);
      triggerVibration(70, vibrationEnabled);
      setFeedback('💥 GÖKDELEN YIKILDI!');
      setTimeout(() => finishGame(), 1800);
      return;
    }

    // Alignment difference between crane center and underlying block center
    const diffCenter = Math.abs(craneX - topFloor.centerX);
    const isPerfect = diffCenter <= 4.0;

    let nextTilt = towerTiltRef.current;
    let feedbackMsg = '';
    const newFloorNumber = floors.length + 1;

    // Special Block Types: Gold floor every 5th, Steel floor every 8th
    let blockType: 'normal' | 'gold' | 'steel' = 'normal';
    if (newFloorNumber % 8 === 0) {
      blockType = 'steel';
    } else if (newFloorNumber % 5 === 0) {
      blockType = 'gold';
    }

    // Steel Floor Power: Completely stabilizes tower tilt to 0 degrees!
    if (blockType === 'steel') {
      nextTilt = 0;
      towerTiltRef.current = 0;
      setTowerTilt(0);
      feedbackMsg = '🛡️ ÇELİK DESTEK KAT! (DENGE SIFIRLANDI!)';
      playFanfareSound(soundEnabled);
    } else if (isPerfect) {
      const nextStreak = perfectStreakRef.current + 1;
      perfectStreakRef.current = nextStreak;
      setPerfectStreak(nextStreak);

      nextTilt = nextTilt * 0.4;
      towerTiltRef.current = nextTilt;
      setTowerTilt(nextTilt);

      playFanfareSound(soundEnabled);
      triggerVibration([25, 35], vibrationEnabled);

      if (blockType === 'gold') {
        feedbackMsg = '💎 2X ALTIN KAT! (+2 KAT BONUSU)';
      } else {
        feedbackMsg = nextStreak >= 2 ? `🔥 ${nextStreak}X MÜKEMMEL HİZALAMA!` : '✨ KUSURSUZ KAT!';
      }
    } else {
      perfectStreakRef.current = 0;
      setPerfectStreak(0);

      const tiltDelta = (craneX - topFloor.centerX) * 0.35;
      nextTilt = nextTilt + tiltDelta;
      towerTiltRef.current = nextTilt;
      setTowerTilt(nextTilt);

      if (Math.abs(nextTilt) > 15) {
        isGameOverRef.current = true;
        setIsGameOver(true);
        playBeepSound(200, 0.4, soundEnabled);
        triggerVibration(70, vibrationEnabled);
        setFeedback('⚖️ DENGE BOZULDU! GÖKDELEN YIKILDI!');
        setTimeout(() => finishGame(), 1800);
        return;
      }

      playBeepSound(650, 0.08, soundEnabled);
      triggerVibration(15, vibrationEnabled);
      feedbackMsg = '👍 KAT YERLEŞTİ';
    }

    setFeedback(feedbackMsg);

    // EXACT 1-to-1 PLACEMENT: Placed block centerX remains at craneX (where released on right/left side!)
    const placedCenterX = isPerfect ? topFloor.centerX : craneX;

    const newFloor: FloorBlock = {
      id: newFloorNumber,
      width: currentWidth,
      centerX: placedCenterX,
      type: blockType,
    };

    setFloors((prev) => [...prev.slice(-8), newFloor]);

    const pointIncrease = blockType === 'gold' ? 2 : 1;
    setScore((s) => {
      const next = s + pointIncrease;
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
          'Seçilen Süre': typeof selectedDuration === 'number' ? `${selectedDuration}s` : 'Sınırsız',
        },
      },
    ]);
  };

  return (
    <div
      onClick={handleDropFloor}
      className="relative flex-1 flex flex-col h-full w-full bg-slate-950 text-white select-none overflow-hidden touch-none p-3 space-y-2 cursor-pointer"
    >
      {/* Duration Selector Bar */}
      <div className="flex items-center justify-between bg-slate-900/90 border border-slate-800 rounded-2xl px-4 py-2 shadow-xl backdrop-blur z-50">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            <Building2 className="w-4 h-4" />
          </div>
          <span className="font-black text-xs tracking-wide text-white">GÖKDELEN İNŞAATI</span>
        </div>

        {/* Duration Toggles */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
          {[30, 60, 90, 'unlimited'].map((dur) => (
            <button
              key={dur}
              onClick={(e) => {
                e.stopPropagation();
                if (!isGameStarted) handleSelectDuration(dur as number | 'unlimited');
              }}
              className={`px-2.5 py-0.5 rounded-lg text-[10px] font-black transition-all ${
                selectedDuration === dur
                  ? 'bg-cyan-500 text-slate-950 shadow-[0_0_10px_#06B6D4]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {dur === 'unlimited' ? '∞' : `${dur}s`}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 text-xs font-black">
          {perfectStreak >= 2 && (
            <span className="text-amber-300 bg-amber-500/20 border border-amber-500/30 px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
              <Sparkles className="w-3 h-3" /> {perfectStreak}X
            </span>
          )}

          {selectedDuration !== 'unlimited' && (
            <span
              className={`px-2.5 py-0.5 rounded-full flex items-center gap-1 border transition-all ${
                typeof timeLeft === 'number' && timeLeft <= 10
                  ? 'bg-rose-500/20 border-rose-500/40 text-rose-400 animate-pulse'
                  : 'bg-amber-500/10 border-amber-500/20 text-amber-300'
              }`}
            >
              <Timer className="w-3 h-3" /> {timeLeft}s
            </span>
          )}

          <span className="text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-0.5 rounded-full flex items-center gap-1">
            <Trophy className="w-3 h-3" /> {score} Kat
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
        {/* Background Clouds & Stars & Lightning */}
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

        {/* Start Game Tap Notification */}
        {!isGameStarted && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-cyan-500 text-slate-950 px-6 py-3 rounded-full font-black text-sm shadow-2xl animate-bounce">
            🚀 BAŞLAMAK İÇİN EKRANA DOKUNUN!
          </div>
        )}

        {/* Swinging Crane Top Cable & Hook SVG */}
        {!isGameOver && isGameStarted && (
          <div className="absolute top-0 inset-x-0 h-40 pointer-events-none z-30">
            {/* SVG Cable Line connected 100% directly to the swinging block center top */}
            <svg width="100%" height="100%" className="overflow-visible">
              <line x1="0" y1="12" x2="100%" y2="12" stroke="#F59E0B" strokeWidth="6" strokeDasharray="12 6" />
              <circle cx={`${craneX}%`} cy="12" r="8" fill="#F59E0B" stroke="#0F172A" strokeWidth="2" />
              <line x1={`${craneX}%`} y1="12" x2={`${craneX}%`} y2="98" stroke="#94A3B8" strokeWidth="3" />
              <circle cx={`${craneX}%`} cy="98" r="5" fill="#F59E0B" stroke="#0F172A" strokeWidth="2" />
            </svg>

            {/* Swinging 3D Skyscraper Floor Block (Strict 1-to-1 sync with craneX%, no CSS transition lag) */}
            <div
              style={{
                left: `${craneX}%`,
                width: `${floors[floors.length - 1]?.width || INITIAL_WIDTH}%`,
                transform: 'translateX(-50%)',
                top: '98px',
              }}
              className="absolute h-10 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-700 border-2 border-white shadow-[0_0_20px_#38BDF8] flex items-center justify-around px-3"
            >
              <div className="w-3 h-4 bg-amber-300 rounded-sm shadow-[0_0_6px_#FDE047]" />
              <div className="w-3 h-4 bg-amber-300 rounded-sm shadow-[0_0_6px_#FDE047]" />
              <div className="w-3 h-4 bg-amber-300 rounded-sm shadow-[0_0_6px_#FDE047]" />
            </div>
          </div>
        )}

        {/* Stacked Skyscraper Tower Container (Center Aligned EXACTLY to centerX%) */}
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
                left: `${floor.centerX}%`,
                width: `${floor.width}%`,
                transform: 'translateX(-50%)',
                marginBottom: '4px',
              }}
              className={`relative h-10 rounded-xl border-2 shadow-xl flex items-center justify-around px-3 transition-all ${
                floor.type === 'gold'
                  ? 'bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600 border-amber-200 shadow-[0_0_25px_#F59E0B]'
                  : floor.type === 'steel'
                  ? 'bg-gradient-to-r from-slate-400 via-gray-500 to-slate-600 border-slate-200 shadow-[0_0_25px_#94A3B8]'
                  : 'bg-gradient-to-r from-slate-900 via-indigo-900 to-slate-900 border-cyan-500/60'
              }`}
            >
              {floor.type === 'steel' ? (
                <div className="flex items-center gap-1.5 text-xs font-black text-slate-950">
                  <Shield className="w-4 h-4 fill-current" /> ÇELİK DESTEK KAT
                </div>
              ) : floor.type === 'gold' ? (
                <div className="flex items-center gap-1.5 text-xs font-black text-slate-950">
                  <Flame className="w-4 h-4 fill-current" /> 2X ALTIN KAT
                </div>
              ) : (
                <>
                  <div className={`w-3 h-4 rounded-sm ${idx % 2 === 0 ? 'bg-amber-300 shadow-[0_0_6px_#FDE047]' : 'bg-cyan-300 shadow-[0_0_6px_#38BDF8]'}`} />
                  <div className={`w-3 h-4 rounded-sm ${idx % 3 === 0 ? 'bg-amber-300 shadow-[0_0_6px_#FDE047]' : 'bg-cyan-300 shadow-[0_0_6px_#38BDF8]'}`} />
                  <div className={`w-3 h-4 rounded-sm ${idx % 2 === 1 ? 'bg-amber-300 shadow-[0_0_6px_#FDE047]' : 'bg-cyan-300 shadow-[0_0_6px_#38BDF8]'}`} />
                </>
              )}

              <span className="absolute right-2 bottom-0.5 text-[9px] font-black text-white/60">
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
