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

  // Controlled State Machine
  const [shotPhase, setShotPhase] = useState<ShotPhase>('ready');

  // Stats State & Ref
  const [penaltyStats, setPenaltyStats] = useState<PenaltyStats>(INITIAL_PENALTY_STATS);
  const penaltyStatsRef = useRef<PenaltyStats>(INITIAL_PENALTY_STATS);

  // Ball & Keeper Visual Positions
  const [ballPos, setBallPos] = useState<Point2D>({ x: 50, y: 80 }); // % coordinates
  const [keeperPos, setKeeperPos] = useState<Point2D>({ x: 50, y: 38 });
  const [keeperZone, setKeeperZone] = useState<KeeperDiveZone>('center');

  // Shot Visual Effects
  const [latestOutcome, setLatestOutcome] = useState<ShotOutcome | null>(null);
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
  }, [players]);

  // Pointer Event Handlers for Aiming & Dragging
  const handlePointerDown = (e: React.PointerEvent) => {
    if (shotPhase !== 'ready' || isFinishedRef.current) return;
    setShotPhase('aiming');
    setDragStart({ x: e.clientX, y: e.clientY });
    setDragCurrent({ x: e.clientX, y: e.clientY });
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (shotPhase !== 'aiming' || !dragStart || isFinishedRef.current) return;
    setDragCurrent({ x: e.clientX, y: e.clientY });
  };

  const handlePointerUp = () => {
    if (shotPhase !== 'aiming' || !dragStart || !dragCurrent || isFinishedRef.current) {
      setDragStart(null);
      setDragCurrent(null);
      if (shotPhase === 'aiming') setShotPhase('ready');
      return;
    }

    const dx = dragCurrent.x - dragStart.x;
    const dy = dragStart.y - dragCurrent.y; // invert Y so up is positive

    setDragStart(null);
    setDragCurrent(null);

    // Minimum upward drag required to shoot
    if (dy < 25) {
      setShotPhase('ready');
      return;
    }

    // Single trigger: Transition to 'shooting'
    setShotPhase('shooting');

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

    // Execute Shot Resolution after motion delay (500ms)
    setTimeout(() => {
      resolveShot(ballTarget, keeperTargetPos);
    }, 550);
  };

  // Single Source of Truth Resolution
  const resolveShot = (ballTarget: Point2D, keeperTargetPos: Point2D) => {
    if (isFinishedRef.current || shotPhase !== 'shooting') return;
    setShotPhase('resolved');

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

      let msg = 'GOL!';
      if (isTopCorner) msg = 'ÜST KÖŞEYE HARİKA GOL! (+175 Puan)';
      else if (isCorner) msg = 'KÖŞEYE MÜKEMMEL GOL! (+150 Puan)';
      setFeedbackMessage(msg);
    } else if (outcome === 'saved') {
      // Deflect ball slightly backward on save
      setBallPos((prev) => ({ x: prev.x, y: prev.y + 12 }));
      playBeepSound(200, 0.3, soundEnabled);
      triggerVibration(40, vibrationEnabled);
      setFeedbackMessage('KALECİ KURTARDI!');
    } else if (outcome === 'post') {
      setPostSparkle(true);
      setBallPos((prev) => ({ x: prev.x > 50 ? prev.x + 8 : prev.x - 8, y: prev.y + 10 }));
      playBeepSound(350, 0.3, soundEnabled);
      triggerVibration(50, vibrationEnabled);
      setFeedbackMessage('DİREKTEN DÖNDÜ!');
    } else {
      // missed
      playBeepSound(150, 0.3, soundEnabled);
      triggerVibration(30, vibrationEnabled);
      setFeedbackMessage('ŞUT DIŞARI GİTTİ!');
    }

    // Transition to next shot or finish after 1500ms
    setTimeout(() => {
      setShotPhase('next-shot');
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
          setShotPhase('ready');
        } else {
          setShotPhase('finished');
          finishGame();
        }
      } else {
        if (currentPlayerIdx < players.length - 1) {
          setCurrentPlayerIdx((prev) => prev + 1);
          setShotPhase('ready');
        } else if (currentShot < totalShots) {
          setCurrentPlayerIdx(0);
          setCurrentShot((s) => s + 1);
          setShotPhase('ready');
        } else {
          setShotPhase('finished');
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
        'Kurtarış': stats.saves,
        'Direk': stats.posts,
        'Kaçan Şut': stats.misses,
        'En Uzun Seri': stats.bestStreak,
        'İsabet Oranı': `%${accuracy}`,
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
          <span className="font-extrabold text-xs text-white">Penaltı Yarışması</span>
        </div>

        <div className="flex items-center gap-3 text-xs font-black">
          <span style={{ color: currentPlayer.color }}>{currentPlayer.name}</span>
          <span className="text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full text-[11px]">
            🏆 {penaltyStats.score} Puan (Gol: {penaltyStats.goals})
          </span>
          <span className="text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-0.5 rounded-full text-[11px]">
            Şut: {currentShot} / {totalShots}
          </span>
        </div>
      </div>

      {/* Main Pitch & Goal Arena */}
      <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className="flex-1 relative bg-gradient-to-b from-slate-900 via-emerald-950/50 to-slate-950 border-2 border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col justify-between p-4 cursor-crosshair"
      >
        {/* Feedback Banner */}
        {feedbackMessage && (
          <div
            className={`absolute top-16 left-1/2 -translate-x-1/2 z-40 px-5 py-2 rounded-full font-black text-xs shadow-2xl animate-scale-up border ${
              latestOutcome === 'goal'
                ? 'bg-emerald-950/95 border-emerald-400 text-emerald-300 ring-4 ring-emerald-500/20'
                : latestOutcome === 'saved'
                ? 'bg-slate-950/95 border-amber-400 text-amber-300'
                : latestOutcome === 'post'
                ? 'bg-purple-950/95 border-purple-400 text-purple-300'
                : 'bg-rose-950/95 border-rose-500 text-rose-300'
            }`}
          >
            {feedbackMessage}
          </div>
        )}

        {/* Goal Frame & Net Area */}
        <div
          className={`relative w-4/5 mx-auto h-40 border-4 border-white rounded-t-xl bg-slate-900/80 shadow-2xl flex items-center justify-center transition-all ${
            netRipple ? 'border-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.5)]' : ''
          }`}
        >
          {/* Net Crosshatch Grid */}
          <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:8px_8px] opacity-40 pointer-events-none" />

          {/* Post Sparkle Glow */}
          {postSparkle && (
            <div className="absolute -inset-1 border-4 border-amber-400 animate-ping rounded-t-xl pointer-events-none" />
          )}

          {/* Goalkeeper Container */}
          <div
            style={{
              left: `${keeperPos.x}%`,
              top: `${keeperPos.y}%`,
            }}
            className="absolute -translate-x-1/2 -translate-y-1/2 transition-all duration-300 z-20"
          >
            <div
              className={`p-2 rounded-2xl bg-amber-400 text-slate-950 shadow-2xl border-2 border-white flex items-center justify-center transition-transform ${
                keeperZone === 'left' || keeperZone === 'top-left'
                  ? '-rotate-45 -translate-x-2'
                  : keeperZone === 'right' || keeperZone === 'top-right'
                  ? 'rotate-45 translate-x-2'
                  : ''
              }`}
            >
              <Shield className="w-8 h-8 stroke-[2.5]" aria-hidden="true" />
            </div>
          </div>
        </div>

        {/* Drag Aim Vector Dotted Line */}
        {dragStart && dragCurrent && (
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-30">
            <line
              x1={dragStart.x}
              y1={dragStart.y}
              x2={dragCurrent.x}
              y2={dragCurrent.y}
              stroke="#22D3EE"
              strokeWidth="4"
              strokeDasharray="6 6"
            />
            <circle cx={dragCurrent.x} cy={dragCurrent.y} r="8" fill="#22D3EE" opacity="0.6" />
          </svg>
        )}

        {/* Ball */}
        <div
          style={{
            left: `${ballPos.x}%`,
            top: `${ballPos.y}%`,
          }}
          className="absolute -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white border-2 border-slate-900 flex items-center justify-center shadow-2xl transition-all duration-500 z-30"
        >
          <Goal className="w-6 h-6 text-slate-950 stroke-[2.5]" aria-hidden="true" />
        </div>

        {/* Footer Guidance */}
        <div className="text-center py-2 bg-slate-900/80 border border-slate-800 rounded-2xl">
          <p className="text-xs text-slate-300 font-bold flex items-center justify-center gap-1.5">
            <ArrowUpRight className="w-4 h-4 text-cyan-400" /> Topa dokunup hedeflediğiniz köşeye doğru sürükleyip bırakın!
          </p>
        </div>
      </div>
    </div>
  );
};
