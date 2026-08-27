import React, { useState, useRef, useEffect } from 'react';
import { Goal, Shield, ArrowUpRight } from 'lucide-react';
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

  // Controlled State Machine with Ref backing to prevent stale closure freezes
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
  const [ballPos, setBallPos] = useState<Point2D>({ x: 50, y: 80 }); // % coordinates
  const [keeperPos, setKeeperPos] = useState<Point2D>({ x: 50, y: 38 });
  const [_keeperZone, setKeeperZone] = useState<KeeperDiveZone>('center');

  // Shot Visual Effects
  const [_latestOutcome, setLatestOutcome] = useState<ShotOutcome | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [netRipple, setNetRipple] = useState<boolean>(false);
  const [postSparkle, setPostSparkle] = useState<boolean>(false);

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

    // Minimum upward drag required to shoot
    if (dy < 25) {
      updateShotPhase('ready');
      return;
    }

    // Transition to 'shooting' using ref-synced updater
    updateShotPhase('shooting');

    // Calculate Target Coordinates from Drag Vector
    const powerScale = Math.min(1.4, Math.max(0.6, Math.sqrt(dx * dx + dy * dy) / 100));
    const targetX = Math.min(95, Math.max(5, 50 + (dx / 3)));
    const targetY = Math.min(60, Math.max(8, 80 - (dy / 3) * powerScale));

    const ballTarget: Point2D = { x: targetX, y: targetY };
    previousShotsRef.current.push(ballTarget);

    // Select Goalkeeper Dive Zone and Target Position
    const selectedZone = selectKeeperDiveZone(difficulty, previousShotsRef.current);
    const keeperTargetPos = calculateKeeperTargetPosition(selectedZone);

    setKeeperZone(selectedZone);
    setKeeperPos(keeperTargetPos);
    setBallPos(ballTarget);

    // Execute Shot Resolution after motion delay (550ms)
    setTimeout(() => {
      resolveShot(ballTarget, keeperTargetPos);
    }, 550);
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
      setBallPos((prev) => ({ x: prev.x, y: prev.y + 12 }));
      playBeepSound(200, 0.3, soundEnabled);
      triggerVibration(40, vibrationEnabled);
      setFeedbackMessage('🧤 KALECİ KURTARDI!');
    } else if (outcome === 'post') {
      setPostSparkle(true);
      setBallPos((prev) => ({ x: prev.x > 50 ? prev.x + 8 : prev.x - 8, y: prev.y + 10 }));
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

      // Reset Ball & Keeper
      setBallPos({ x: 50, y: 80 });
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
      {/* Header Bar */}
      <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-2xl px-4 py-2.5 shadow-md">
        <div className="flex items-center gap-2">
          <Goal className="w-5 h-5 text-emerald-400" aria-hidden="true" />
          <span className="font-extrabold text-sm text-white">Penaltı Yarışması</span>
        </div>

        <div className="flex items-center gap-3 text-xs font-black">
          <span style={{ color: currentPlayer.color }}>{currentPlayer.name}</span>
          <span className="text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
            🏆 {penaltyStats.score} Puan (Gol: {penaltyStats.goals})
          </span>
          <span className="text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-3 py-1 rounded-full">
            Şut: {currentShot} / {totalShots}
          </span>
        </div>
      </div>

      {/* Main Pitch Arena */}
      <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className="flex-1 relative bg-gradient-to-b from-slate-950 via-slate-900 to-emerald-950/40 border-2 border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col justify-between p-4"
      >
        {/* Feedback Banner */}
        {feedbackMessage && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-40 bg-slate-950/95 border-2 border-emerald-400 px-5 py-2.5 rounded-full font-black text-xs text-emerald-300 shadow-2xl animate-scale-up">
            {feedbackMessage}
          </div>
        )}

        {/* Goal Post Frame SVG & Net */}
        <div className="relative w-full h-48 flex justify-center items-start pt-2">
          <svg
            width="320"
            height="160"
            viewBox="0 0 320 160"
            className={`drop-shadow-2xl ${netRipple ? 'animate-pulse' : ''}`}
          >
            {/* Goal Net Grid Background */}
            <pattern id="netPattern" width="10" height="10" patternUnits="userSpaceOnUse">
              <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#F8FAFC" strokeWidth="0.8" opacity="0.4" />
            </pattern>
            <rect x="25" y="15" width="270" height="130" fill="url(#netPattern)" />

            {/* Posts & Crossbar */}
            <rect x="15" y="10" width="12" height="145" fill="#F8FAFC" rx="4" />
            <rect x="293" y="10" width="12" height="145" fill="#F8FAFC" rx="4" />
            <rect x="15" y="10" width="290" height="12" fill="#F8FAFC" rx="4" />

            {/* Sparkle on Post Hit */}
            {postSparkle && (
              <circle cx="20" cy="15" r="15" fill="#F59E0B" opacity="0.8" className="animate-ping" />
            )}
          </svg>

          {/* Goalkeeper SVG */}
          <div
            style={{
              left: `${keeperPos.x}%`,
              top: `${keeperPos.y}%`,
            }}
            className="absolute -translate-x-1/2 -translate-y-1/2 transition-all duration-500 z-20"
          >
            <div className="w-14 h-14 bg-amber-400 border-2 border-white rounded-full flex items-center justify-center shadow-xl">
              <Shield className="w-8 h-8 text-slate-950 stroke-[2.5]" />
            </div>
            <span className="text-[10px] font-black text-amber-400 bg-slate-950/80 px-2 py-0.5 rounded-full block text-center mt-1">
              KALECİ
            </span>
          </div>
        </div>

        {/* Aim Drag Vector */}
        {dragStart && dragCurrent && (
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-30">
            <line
              x1={dragStart.x}
              y1={dragStart.y}
              x2={dragCurrent.x}
              y2={dragCurrent.y}
              stroke="#10B981"
              strokeWidth="4"
              strokeDasharray="6 6"
              strokeLinecap="round"
            />
            <circle cx={dragCurrent.x} cy={dragCurrent.y} r="8" fill="#10B981" opacity="0.8" />
          </svg>
        )}

        {/* Football SVG */}
        <div
          style={{
            left: `${ballPos.x}%`,
            top: `${ballPos.y}%`,
          }}
          className="absolute -translate-x-1/2 -translate-y-1/2 w-14 h-14 transition-all duration-500 z-20 drop-shadow-2xl"
        >
          <svg width="56" height="56" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="46" fill="#F8FAFC" stroke="#0F172A" strokeWidth="4" />
            <polygon points="50,22 65,33 60,52 40,52 35,33" fill="#0F172A" />
            <polygon points="20,60 32,55 40,68 32,80 18,75" fill="#0F172A" />
            <polygon points="80,60 68,55 60,68 68,80 82,75" fill="#0F172A" />
          </svg>
        </div>

        {/* Instruction Footer */}
        <div className="text-center py-2.5 bg-slate-900/80 border border-slate-800 rounded-2xl backdrop-blur">
          <p className="text-xs text-emerald-400 font-black flex items-center justify-center gap-1">
            <ArrowUpRight className="w-4 h-4" /> Topa dokunup hedeflediğiniz köşeye doğru sürükleyip bırakın!
          </p>
        </div>
      </div>
    </div>
  );
};
