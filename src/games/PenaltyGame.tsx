import React, { useState, useRef } from 'react';
import { Goal, Shield, Trophy, Zap } from 'lucide-react';
import type { Player } from '../types/game';
import { playBeepSound, playFanfareSound, playTapSound, triggerVibration } from '../utils/audio';

interface PenaltyGameProps {
  mode: 'single' | 'multi';
  players: Player[];
  difficulty?: 'easy' | 'normal' | 'hard';
  onFinishGame: (results: { playerId: string; score: number; stats?: Record<string, number | string> }[]) => void;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
}

interface ShotResult {
  goals: number;
  score: number;
  bestStreak: number;
  currentStreak: number;
  shotsTaken: number;
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

  const [stats, setStats] = useState<ShotResult>({
    goals: 0,
    score: 0,
    bestStreak: 0,
    currentStreak: 0,
    shotsTaken: 0,
  });

  // Aim & Drag State
  const [aimTarget, setAimTarget] = useState<{ x: number; y: number } | null>(null);
  const [isShooting, setIsShooting] = useState<boolean>(false);

  // Ball & Keeper Visual Positions
  const [ballPos, setBallPos] = useState<{ x: number; y: number }>({ x: 50, y: 82 });
  const [ballScale, setBallScale] = useState<number>(1);
  const [ballRotation, setBallRotation] = useState<number>(0);

  const [keeperPos, setKeeperPos] = useState<{ x: number; y: number }>({ x: 50, y: 28 });
  const [keeperAngle, setKeeperAngle] = useState<number>(0);

  // Feedback Effects
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [netRipple, setNetRipple] = useState<boolean>(false);
  const [postSparkle, setPostSparkle] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const isFinishedRef = useRef<boolean>(false);
  const statsRef = useRef<ShotResult>({
    goals: 0,
    score: 0,
    bestStreak: 0,
    currentStreak: 0,
    shotsTaken: 0,
  });
  const animFrameRef = useRef<number | null>(null);

  const currentPlayer = players[currentPlayerIdx] || players[0];

  // Extract pointer coordinates normalized in %
  const getPointerPct = (e: React.PointerEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return { x: 50, y: 28 };
    const xPct = Math.min(92, Math.max(8, ((e.clientX - rect.left) / rect.width) * 100));
    const yPct = Math.min(60, Math.max(10, ((e.clientY - rect.top) / rect.height) * 100));
    return { x: xPct, y: yPct };
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (isShooting || isFinishedRef.current) return;
    const pt = getPointerPct(e);
    setAimTarget(pt);
    playTapSound(soundEnabled);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!aimTarget || isShooting || isFinishedRef.current) return;
    const pt = getPointerPct(e);
    setAimTarget(pt);
  };

  const handlePointerUp = () => {
    if (!aimTarget || isShooting || isFinishedRef.current) {
      setAimTarget(null);
      return;
    }

    const finalTarget = { ...aimTarget };
    setAimTarget(null);
    setIsShooting(true);

    // AI Keeper Dive Intelligence (5 possible dive zones)
    const diveZones = [
      { x: 22, y: 16, angle: -45 }, // Top-Left Corner Dive
      { x: 25, y: 32, angle: -25 }, // Low-Left Dive
      { x: 50, y: 28, angle: 0 },   // Stay Center
      { x: 75, y: 32, angle: 25 },  // Low-Right Dive
      { x: 78, y: 16, angle: 45 },  // Top-Right Corner Dive
    ];

    // Pick keeper dive zone with slight random variance
    const chosenZone = diveZones[Math.floor(Math.random() * diveZones.length)];
    setKeeperPos({ x: chosenZone.x, y: chosenZone.y });
    setKeeperAngle(chosenZone.angle);

    // Launch Ball Flight Animation towards target
    launchBallFlight(finalTarget.x, finalTarget.y, chosenZone);
  };

  const launchBallFlight = (
    targetX: number,
    targetY: number,
    keeperZone: { x: number; y: number; angle: number }
  ) => {
    const startX = 50;
    const startY = 82;
    const apexY = Math.min(startY, targetY) - 15; // Flight curve arc

    let progress = 0;
    const durationFrames = 26; // 430ms flight speed

    const animate = () => {
      progress += 1 / durationFrames;

      if (progress >= 1) {
        setBallPos({ x: targetX, y: targetY });
        setBallScale(0.48);
        setBallRotation(720);
        evaluateShot(targetX, targetY, keeperZone);
        return;
      }

      // Parabolic flight math
      const t = progress;
      const currentX = (1 - t) * (1 - t) * startX + 2 * (1 - t) * t * targetX + t * t * targetX;
      const currentY = (1 - t) * (1 - t) * startY + 2 * (1 - t) * t * apexY + t * t * targetY;

      setBallPos({ x: currentX, y: currentY });
      setBallScale(1 - t * 0.52);
      setBallRotation(t * 720);

      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);
  };

  const evaluateShot = (
    targetX: number,
    targetY: number,
    keeperZone: { x: number; y: number; angle: number }
  ) => {
    // Goal Dimensions: Width: X: 15%..85%, Height: Y: 10%..42%
    const isInsideGoal = targetX >= 16 && targetX <= 84 && targetY >= 10 && targetY <= 42;
    const isPostHit =
      (Math.abs(targetX - 16) < 3 || Math.abs(targetX - 84) < 3) && targetY >= 10 && targetY <= 44;

    // Distance between ball target and keeper gloves
    const distToKeeper = Math.hypot(targetX - keeperZone.x, targetY - keeperZone.y);

    let isGoal = false;
    let points = 0;
    let feedback = '';

    if (isInsideGoal && distToKeeper > 14) {
      // GOAL SCORED!
      isGoal = true;
      setNetRipple(true);

      const isTopCorner = (targetX <= 26 || targetX >= 74) && targetY <= 20;
      const isPanenka = Math.abs(targetX - 50) < 12 && keeperZone.x !== 50 && targetY > 28;

      if (isPanenka) {
        points = 200;
        feedback = '💎 PANENKA AŞIRTMA GOL! (+200 Puan)';
      } else if (isTopCorner) {
        points = 175;
        feedback = '🚀 DOKSANA MÜKEMMEL GOL! (+175 Puan)';
      } else {
        points = 150;
        feedback = '⚽ HARİKA PLASE GOL! (+150 Puan)';
      }
    } else if (distToKeeper <= 14) {
      // SAVED BY KEEPER!
      feedback = '🧤 KALECİ HARİKA UÇTU VE KURTARDI!';
      setBallPos((prev) => ({ x: prev.x + (prev.x > 50 ? 8 : -8), y: prev.y + 12 }));
    } else if (isPostHit) {
      // POST HIT!
      setPostSparkle(true);
      feedback = '💥 DİREKTEN DÖNDÜ!';
      setBallPos((prev) => ({ x: prev.x > 50 ? prev.x + 10 : prev.x - 10, y: prev.y + 14 }));
    } else {
      // OUT!
      feedback = '❌ ŞUT DIŞARI GİTTİ!';
    }

    // Update Stats
    const prevStats = statsRef.current;
    const nextTaken = prevStats.shotsTaken + 1;
    const nextGoals = isGoal ? prevStats.goals + 1 : prevStats.goals;
    const nextStreak = isGoal ? prevStats.currentStreak + 1 : 0;
    const nextBest = Math.max(prevStats.bestStreak, nextStreak);
    const nextScore = prevStats.score + points;

    const newStats: ShotResult = {
      shotsTaken: nextTaken,
      goals: nextGoals,
      currentStreak: nextStreak,
      bestStreak: nextBest,
      score: nextScore,
    };

    statsRef.current = newStats;
    setStats(newStats);

    if (isGoal) {
      playFanfareSound(soundEnabled);
      triggerVibration([25, 35], vibrationEnabled);
    } else {
      playBeepSound(200, 0.3, soundEnabled);
      triggerVibration(40, vibrationEnabled);
    }

    setFeedbackMessage(feedback);

    setTimeout(() => {
      setFeedbackMessage(null);
      setNetRipple(false);
      setPostSparkle(false);

      // Reset Positions for next shot
      setBallPos({ x: 50, y: 82 });
      setBallScale(1);
      setBallRotation(0);
      setKeeperPos({ x: 50, y: 28 });
      setKeeperAngle(0);
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
    if (isFinishedRef.current) return;
    isFinishedRef.current = true;

    const current = statsRef.current;
    const accuracy = current.shotsTaken > 0 ? Math.round((current.goals / current.shotsTaken) * 100) : 0;

    const results = players.map((p) => ({
      playerId: p.id,
      score: current.score,
      stats: {
        'Gol Sayısı': `${current.goals} / ${totalShots}`,
        'İsabet Oranı': `%${accuracy}`,
        'En Yüksek Seri': `${current.bestStreak} Gol`,
        'Toplam Puan': current.score,
      },
    }));

    onFinishGame(results);
  };

  // Trajectory Prediction Vector Math
  let trajectoryPath = '';
  if (aimTarget) {
    const targetX = aimTarget.x;
    const targetY = aimTarget.y;
    const apexY = Math.min(82, targetY) - 15;

    trajectoryPath = `M 50 82 Q ${(50 + targetX) / 2} ${apexY} ${targetX} ${targetY}`;
  }

  return (
    <div className="relative flex-1 flex flex-col h-full w-full bg-slate-950 text-white select-none overflow-hidden touch-none p-3 space-y-2">
      {/* Stadium Top Bar HUD */}
      <div className="flex items-center justify-between bg-slate-900/90 border border-slate-800 rounded-2xl px-4 py-2.5 shadow-xl backdrop-blur">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <Goal className="w-5 h-5" aria-hidden="true" />
          </div>
          <span className="font-black text-sm tracking-wide text-white">PENALTI STADYUMU</span>
        </div>

        <div className="flex items-center gap-3 text-xs font-black">
          <span style={{ color: currentPlayer.color }} className="bg-slate-950/80 px-2.5 py-1 rounded-xl border border-slate-800">
            👤 {currentPlayer.name}
          </span>
          <span className="text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full flex items-center gap-1">
            <Trophy className="w-3.5 h-3.5" /> {stats.score} Puan (Gol: {stats.goals})
          </span>
          <span className="text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-3 py-1 rounded-full flex items-center gap-1">
            <Zap className="w-3.5 h-3.5" /> Şut: {currentShot} / {totalShots}
          </span>
        </div>
      </div>

      {/* Main 3D Stadium Pitch Arena Container */}
      <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className="flex-1 relative border-2 border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col justify-between cursor-crosshair"
        style={{
          background: 'linear-gradient(to bottom, #020617 0%, #064E3B 30%, #047857 65%, #065F46 100%)',
        }}
      >
        {/* Stadium Floodlight Beams Backdrop */}
        <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-cyan-400/15 via-emerald-500/10 to-transparent pointer-events-none z-0" />
        <div className="absolute top-2 left-8 w-16 h-16 bg-white/20 blur-xl rounded-full pointer-events-none" />
        <div className="absolute top-2 right-8 w-16 h-16 bg-white/20 blur-xl rounded-full pointer-events-none" />

        {/* Alternating 3D Grass Stripes */}
        <div className="absolute inset-0 flex flex-col pointer-events-none opacity-25">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className={`flex-1 w-full ${i % 2 === 0 ? 'bg-black/20' : 'bg-white/10'}`}
            />
          ))}
        </div>

        {/* Penalty Box Chalk Lines */}
        <div className="absolute inset-x-[15%] top-[5%] h-[55%] border-2 border-white/40 rounded-b-xl pointer-events-none z-0" />
        <div className="absolute inset-x-[30%] top-[5%] h-[25%] border-b-2 border-x-2 border-white/30 pointer-events-none z-0" />
        <div className="absolute bottom-[17%] left-1/2 -translate-x-1/2 w-4 h-4 bg-white/90 rounded-full shadow-[0_0_10px_#FFFFFF] pointer-events-none z-0" />

        {/* Feedback Banner */}
        {feedbackMessage && (
          <div className="absolute top-6 left-1/2 -translate-x-1/2 z-50 bg-slate-950/95 border-2 border-amber-400 px-6 py-2.5 rounded-full font-black text-xs text-amber-300 shadow-2xl animate-scale-up backdrop-blur">
            {feedbackMessage}
          </div>
        )}

        {/* 3D Goal Frame & Wave Net */}
        <div className="absolute top-[8%] left-[12%] right-[12%] h-[50%] pointer-events-none z-10">
          <svg width="100%" height="100%" viewBox="0 0 320 180" preserveAspectRatio="none" className="drop-shadow-2xl">
            <defs>
              <pattern id="stadiumNet" width="10" height="10" patternUnits="userSpaceOnUse">
                <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#F8FAFC" strokeWidth="0.9" opacity="0.4" />
              </pattern>
              <linearGradient id="postMetallic" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#CBD5E1" />
                <stop offset="50%" stopColor="#FFFFFF" />
                <stop offset="100%" stopColor="#94A3B8" />
              </linearGradient>
            </defs>

            {/* Depth Net Background */}
            <rect x="25" y="20" width="270" height="145" fill="url(#stadiumNet)" className={netRipple ? 'animate-pulse' : ''} />

            {/* 3D Metallic Posts & Crossbar */}
            <rect x="14" y="15" width="14" height="155" fill="url(#postMetallic)" rx="5" />
            <rect x="292" y="15" width="14" height="155" fill="url(#postMetallic)" rx="5" />
            <rect x="14" y="15" width="292" height="14" fill="url(#postMetallic)" rx="5" />

            {/* Sparkle Effect on Post Hit */}
            {postSparkle && (
              <circle cx="160" cy="20" r="22" fill="#F59E0B" opacity="0.9" className="animate-ping" />
            )}
          </svg>
        </div>

        {/* Dynamic 3D Goalkeeper Character */}
        <div
          style={{
            left: `${keeperPos.x}%`,
            top: `${keeperPos.y}%`,
            transform: `translate(-50%, -50%) rotate(${keeperAngle}deg)`,
          }}
          className="absolute transition-all duration-300 z-20 pointer-events-none"
        >
          <div className="relative flex flex-col items-center drop-shadow-2xl">
            {/* Outstretched Goalkeeper Gloves & Arms */}
            <div className="flex items-center gap-1">
              <div className="w-5 h-3 bg-amber-400 border border-white rounded-l-md shadow-md flex items-center justify-center">
                <span className="text-[8px]">🧤</span>
              </div>

              {/* Jersey Body & Shield Badge */}
              <div className="w-14 h-14 bg-gradient-to-br from-amber-400 via-yellow-500 to-amber-600 border-2 border-white rounded-full flex flex-col items-center justify-center shadow-2xl relative overflow-hidden">
                <span className="text-[10px] font-black text-slate-950 absolute top-1">#1</span>
                <Shield className="w-7 h-7 text-slate-950 stroke-[2.5] mt-1" />
              </div>

              <div className="w-5 h-3 bg-amber-400 border border-white rounded-r-md shadow-md flex items-center justify-center">
                <span className="text-[8px]">🧤</span>
              </div>
            </div>

            <span className="text-[9px] font-black text-amber-300 bg-slate-950/95 px-2.5 py-0.5 rounded-full mt-1 border border-amber-500/40 shadow-xl tracking-wider">
              KALECİ
            </span>
          </div>
        </div>

        {/* Live Parabolic Arc Trajectory Line */}
        {trajectoryPath && (
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-30 overflow-visible">
            <path d={trajectoryPath} fill="none" stroke="#34D399" strokeWidth="4" strokeDasharray="8 6" className="animate-pulse" />
          </svg>
        )}

        {/* Target Aiming Marker */}
        {aimTarget && (
          <div
            style={{
              left: `${aimTarget.x}%`,
              top: `${aimTarget.y}%`,
              transform: 'translate(-50%, -50%)',
            }}
            className="absolute z-50 pointer-events-none flex items-center justify-center"
          >
            <div className="w-10 h-10 rounded-full border-2 border-dashed border-emerald-400 animate-spin-slow flex items-center justify-center">
              <div className="w-3 h-3 rounded-full bg-emerald-400 shadow-[0_0_12px_#34D399]" />
            </div>
          </div>
        )}

        {/* 32-Panel Match Ball SVG */}
        <div
          style={{
            left: `${ballPos.x}%`,
            top: `${ballPos.y}%`,
            transform: `translate(-50%, -50%) scale(${ballScale}) rotate(${ballRotation}deg)`,
          }}
          className="absolute w-14 h-14 transition-transform duration-75 z-40 drop-shadow-2xl pointer-events-none"
        >
          <svg width="56" height="56" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="46" fill="#F8FAFC" stroke="#0F172A" strokeWidth="4" />
            <polygon points="50,22 65,33 60,52 40,52 35,33" fill="#0F172A" />
            <polygon points="20,60 32,55 40,68 32,80 18,75" fill="#0F172A" />
            <polygon points="80,60 68,55 60,68 68,80 82,75" fill="#0F172A" />
          </svg>
        </div>

        {/* Instruction Footer */}
        <div className="relative z-40 text-center py-2.5 mx-4 mb-3 bg-slate-950/80 border border-emerald-500/30 rounded-2xl backdrop-blur shadow-2xl">
          <p className="text-xs text-emerald-300 font-black flex items-center justify-center gap-1.5">
            🎯 Ekrana dokunarak şut atacağınız köşeyi hedefleyin ve kusursuz goller atın!
          </p>
        </div>
      </div>
    </div>
  );
};
