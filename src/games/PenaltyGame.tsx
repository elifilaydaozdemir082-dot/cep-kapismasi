import React, { useState, useRef, useEffect } from 'react';
import { Goal, Shield, ArrowUpRight, Zap, Trophy } from 'lucide-react';
import type { Player } from '../types/game';
import {
  calculateKeeperTargetPosition,
  selectKeeperDiveZone,
  calculateShotOutcome,
  calculateShotScore,
  updatePenaltyStats,
  INITIAL_PENALTY_STATS,
} from '../utils/penaltyEngine';
import type {
  PenaltyStats,
  Point2D,
  ShotOutcome,
  ShotPhase,
  KeeperDiveZone,
} from '../utils/penaltyEngine';
import { playBeepSound, playFanfareSound, triggerVibration } from '../utils/audio';

interface PenaltyGameProps {
  mode: 'single' | 'multi';
  players: Player[];
  difficulty?: 'easy' | 'normal' | 'hard';
  onFinishGame: (results: { playerId: string; score: number; stats?: Record<string, number | string> }[]) => void;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
}

export const PenaltyGame: React.FC<PenaltyGameProps> = ({
  mode,
  players,
  difficulty = 'normal',
  onFinishGame,
  soundEnabled,
  vibrationEnabled,
}) => {
  const [currentPlayerIdx, setCurrentPlayerIdx] = useState<number>(0);
  const [currentShot, setCurrentShot] = useState<number>(1);
  const totalShots = 5;

  // Controlled State Machine with Ref backing
  const [_shotPhase, setShotPhase] = useState<ShotPhase>('ready');
  const shotPhaseRef = useRef<ShotPhase>('ready');

  const updateShotPhase = (phase: ShotPhase) => {
    shotPhaseRef.current = phase;
    setShotPhase(phase);
  };

  // Stats State & Ref
  const [penaltyStats, setPenaltyStats] = useState<PenaltyStats>(INITIAL_PENALTY_STATS);
  const penaltyStatsRef = useRef<PenaltyStats>(INITIAL_PENALTY_STATS);

  // Ball & Keeper Visual Positions
  const [ballPos, setBallPos] = useState<Point2D>({ x: 50, y: 82 }); // Start at penalty spot
  const [keeperPos, setKeeperPos] = useState<Point2D>({ x: 50, y: 38 });
  const [keeperZone, setKeeperZone] = useState<KeeperDiveZone>('center');

  // Shot Visual Effects
  const [_latestOutcome, setLatestOutcome] = useState<ShotOutcome | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [netRipple, setNetRipple] = useState<boolean>(false);
  const [postSparkle, setPostSparkle] = useState<boolean>(false);
  const [isBallSpinning, setIsBallSpinning] = useState<boolean>(false);

  // Dragging Aim State
  const [dragStart, setDragStart] = useState<Point2D | null>(null);
  const [dragCurrent, setDragCurrent] = useState<Point2D | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const isFinishedRef = useRef<boolean>(false);
  const previousShotsRef = useRef<Point2D[]>([]);

  const currentPlayer = players[currentPlayerIdx] || players[0];

  useEffect(() => {
    penaltyStatsRef.current = INITIAL_PENALTY_STATS;
    setPenaltyStats(INITIAL_PENALTY_STATS);
    previousShotsRef.current = [];
    updateShotPhase('ready');
  }, [players]);

  // Pointer Event Handlers for Aiming & Dragging
  const handlePointerDown = (e: React.PointerEvent) => {
    if (shotPhaseRef.current !== 'ready' || isFinishedRef.current) return;
    updateShotPhase('aiming');
    setDragStart({ x: e.clientX, y: e.clientY });
    setDragCurrent({ x: e.clientX, y: e.clientY });
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (shotPhaseRef.current !== 'aiming' || !dragStart || isFinishedRef.current) return;
    setDragCurrent({ x: e.clientX, y: e.clientY });
  };

  const handlePointerUp = () => {
    if (shotPhaseRef.current !== 'aiming' || !dragStart || !dragCurrent || isFinishedRef.current) {
      setDragStart(null);
      setDragCurrent(null);
      if (shotPhaseRef.current === 'aiming') updateShotPhase('ready');
      return;
    }

    const dx = dragCurrent.x - dragStart.x;
    const dy = dragStart.y - dragCurrent.y; // invert Y so up is positive

    setDragStart(null);
    setDragCurrent(null);

    // Minimum upward drag required to shoot (25px)
    if (dy < 25) {
      updateShotPhase('ready');
      return;
    }

    // Transition to 'shooting'
    updateShotPhase('shooting');
    setIsBallSpinning(true);

    // Natural Pitch Percentage Mapping: Start at (50%, 82%) -> Target mapped cleanly to goal area or out
    const targetX = Math.min(92, Math.max(8, 50 + (dx / 3.2)));
    const targetY = Math.min(65, Math.max(14, 80 - (dy / 2.85)));

    const ballTarget: Point2D = { x: targetX, y: targetY };
    previousShotsRef.current.push(ballTarget);

    // Select Goalkeeper Dive Zone and Target Position
    const selectedZone = selectKeeperDiveZone(difficulty, previousShotsRef.current);
    const keeperTargetPos = calculateKeeperTargetPosition(selectedZone);

    setKeeperZone(selectedZone);
    setKeeperPos(keeperTargetPos);
    setBallPos(ballTarget);

    // Execute Shot Resolution after flight animation delay (500ms)
    setTimeout(() => {
      setIsBallSpinning(false);
      resolveShot(ballTarget, keeperTargetPos);
    }, 500);
  };

  // Single Source of Truth Resolution
  const resolveShot = (ballTarget: Point2D, keeperTargetPos: Point2D) => {
    if (isFinishedRef.current || shotPhaseRef.current !== 'shooting') return;
    updateShotPhase('resolved');

    // Calculate outcome driven strictly by trajectory & goalkeeper collision
    const outcome = calculateShotOutcome(ballTarget, keeperTargetPos, difficulty);
    setLatestOutcome(outcome);

    const { points, isCorner, isTopCorner } = calculateShotScore(
      outcome,
      ballTarget,
      penaltyStatsRef.current.currentStreak
    );

    // Update Stats Ref synchronously
    const updatedStats = updatePenaltyStats(penaltyStatsRef.current, outcome, points);
    penaltyStatsRef.current = updatedStats;
    setPenaltyStats(updatedStats);

    // Visual & Sound Feedback driven by outcome
    if (outcome === 'goal') {
      setNetRipple(true);
      playFanfareSound(soundEnabled);
      triggerVibration([20, 30], vibrationEnabled);

      let msg = '⚽ GOL!';
      if (isTopCorner) msg = '🔥 90\'A MÜKEMMEL GOL! (+175 Puan)';
      else if (isCorner) msg = '🎯 KÖŞEYE HARİKA GOL! (+150 Puan)';
      setFeedbackMessage(msg);
    } else if (outcome === 'saved') {
      // Physical deflection: Ball bounces off keeper's hands
      setBallPos((prev) => ({ x: prev.x + (prev.x > 50 ? 6 : -6), y: prev.y + 14 }));
      playBeepSound(200, 0.3, soundEnabled);
      triggerVibration(40, vibrationEnabled);
      setFeedbackMessage('🧤 KALECİ KURTARDI!');
    } else if (outcome === 'post') {
      setPostSparkle(true);
      setBallPos((prev) => ({ x: prev.x > 50 ? prev.x + 8 : prev.x - 8, y: prev.y + 12 }));
      playBeepSound(350, 0.3, soundEnabled);
      triggerVibration(50, vibrationEnabled);
      setFeedbackMessage('💥 DİREKTEN DÖNDÜ!');
    } else {
      playBeepSound(150, 0.3, soundEnabled);
      triggerVibration(30, vibrationEnabled);
      setFeedbackMessage('❌ ŞUT DIŞARI GİTTİ!');
    }

    // Transition to next shot or finish after 1500ms
    setTimeout(() => {
      updateShotPhase('next-shot');
      setFeedbackMessage(null);
      setNetRipple(false);
      setPostSparkle(false);

      // Reset Ball & Keeper back to penalty spot
      setBallPos({ x: 50, y: 82 });
      setKeeperPos({ x: 50, y: 38 });
      setKeeperZone('center');

      if (mode === 'single') {
        if (updatedStats.shotsTaken < totalShots) {
          setCurrentShot(updatedStats.shotsTaken + 1);
          updateShotPhase('ready');
        } else {
          updateShotPhase('finished');
          finishGame();
        }
      } else {
        if (currentPlayerIdx < players.length - 1) {
          setCurrentPlayerIdx((prev) => prev + 1);
          updateShotPhase('ready');
        } else if (currentShot < totalShots) {
          setCurrentPlayerIdx(0);
          setCurrentShot((s) => s + 1);
          updateShotPhase('ready');
        } else {
          updateShotPhase('finished');
          finishGame();
        }
      }
    }, 1500);
  };

  const finishGame = () => {
    if (isFinishedRef.current) return;
    isFinishedRef.current = true;

    const stats = penaltyStatsRef.current;
    const accuracy = stats.shotsTaken > 0 ? Math.round((stats.goals / stats.shotsTaken) * 100) : 0;

    const results = players.map((p) => ({
      playerId: p.id,
      score: stats.score,
      stats: {
        'Gol Sayısı': `${stats.goals} / ${totalShots}`,
        'İsabet Oranı': `%${accuracy}`,
        'En Yüksek Seri': `${stats.bestStreak} Gol`,
        'Toplam Puan': stats.score,
      },
    }));

    onFinishGame(results);
  };

  return (
    <div className="relative flex-1 flex flex-col h-full w-full bg-slate-950 text-white select-none overflow-hidden touch-none p-3 space-y-2">
      {/* Stadium Top Bar HUD */}
      <div className="flex items-center justify-between bg-slate-900/90 border border-slate-800 rounded-2xl px-4 py-2.5 shadow-xl backdrop-blur">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <Goal className="w-5 h-5" aria-hidden="true" />
          </div>
          <span className="font-black text-sm tracking-wide text-white">PENALTISI STADYUMU</span>
        </div>

        <div className="flex items-center gap-3 text-xs font-black">
          <span style={{ color: currentPlayer.color }} className="bg-slate-950/80 px-2.5 py-1 rounded-xl border border-slate-800">
            👤 {currentPlayer.name}
          </span>
          <span className="text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full flex items-center gap-1">
            <Trophy className="w-3.5 h-3.5" /> {penaltyStats.score} Puan (Gol: {penaltyStats.goals})
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
        className="flex-1 relative border-2 border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col justify-between"
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
        {/* Goal Area Line */}
        <div className="absolute inset-x-[30%] top-[5%] h-[25%] border-b-2 border-x-2 border-white/30 pointer-events-none z-0" />
        {/* Penalty Spot Circle */}
        <div className="absolute bottom-[17%] left-1/2 -translate-x-1/2 w-4 h-4 bg-white/90 rounded-full shadow-[0_0_10px_#FFFFFF] pointer-events-none z-0" />

        {/* Feedback Banner */}
        {feedbackMessage && (
          <div className="absolute top-6 left-1/2 -translate-x-1/2 z-40 bg-slate-950/95 border-2 border-amber-400 px-6 py-2.5 rounded-full font-black text-xs text-amber-300 shadow-2xl animate-scale-up backdrop-blur">
            {feedbackMessage}
          </div>
        )}

        {/* 3D Realistic Goal Frame & Mesh Net Area */}
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

        {/* Goalkeeper Character SVG (Padded Jersey, Gloves & Dynamic Dive Angle) */}
        <div
          style={{
            left: `${keeperPos.x}%`,
            top: `${keeperPos.y}%`,
            transform: `translate(-50%, -50%) rotate(${
              keeperZone === 'top-left'
                ? '-35deg'
                : keeperZone === 'left'
                ? '-20deg'
                : keeperZone === 'top-right'
                ? '35deg'
                : keeperZone === 'right'
                ? '20deg'
                : '0deg'
            })`,
          }}
          className="absolute transition-all duration-500 z-20 pointer-events-none"
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

        {/* Aim Drag Vector Guideline */}
        {dragStart && dragCurrent && (
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-30">
            <line
              x1={dragStart.x}
              y1={dragStart.y}
              x2={dragCurrent.x}
              y2={dragCurrent.y}
              stroke="#34D399"
              strokeWidth="5"
              strokeDasharray="8 8"
              strokeLinecap="round"
            />
            <circle cx={dragCurrent.x} cy={dragCurrent.y} r="10" fill="#34D399" opacity="0.9" />
          </svg>
        )}

        {/* 32-Panel Match Ball SVG */}
        <div
          style={{
            left: `${ballPos.x}%`,
            top: `${ballPos.y}%`,
          }}
          className={`absolute -translate-x-1/2 -translate-y-1/2 w-13 h-13 transition-all duration-500 z-30 drop-shadow-2xl pointer-events-none ${
            isBallSpinning ? 'animate-spin' : ''
          }`}
        >
          <svg width="52" height="52" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="46" fill="#F8FAFC" stroke="#0F172A" strokeWidth="4" />
            <polygon points="50,22 65,33 60,52 40,52 35,33" fill="#0F172A" />
            <polygon points="20,60 32,55 40,68 32,80 18,75" fill="#0F172A" />
            <polygon points="80,60 68,55 60,68 68,80 82,75" fill="#0F172A" />
          </svg>
        </div>

        {/* Stadium Grass Instruction Footer */}
        <div className="relative z-40 text-center py-2.5 mx-4 mb-3 bg-slate-950/80 border border-emerald-500/30 rounded-2xl backdrop-blur shadow-2xl">
          <p className="text-xs text-emerald-300 font-black flex items-center justify-center gap-1.5">
            <ArrowUpRight className="w-4 h-4 text-emerald-400" /> Topa dokunup hedeflediğiniz köşeye doğru sürükleyip bırakın!
          </p>
        </div>
      </div>
    </div>
  );
};
