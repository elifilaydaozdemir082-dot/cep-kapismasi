import React, { useState, useEffect, useRef } from 'react';
import { Target, Trophy, Zap, Eye, Flame } from 'lucide-react';
import type { Player } from '../types/game';
import { playBeepSound, playFanfareSound, playTapSound, triggerVibration } from '../utils/audio';

interface ArcheryGameProps {
  mode: 'single' | 'multi';
  players: Player[];
  onFinishGame: (results: { playerId: string; score: number; stats?: Record<string, number | string> }[]) => void;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
}

interface ConfettiParticle {
  id: number;
  x: number; // %
  y: number; // %
  color: string;
  size: number;
  vx: number;
  vy: number;
}

const CONFETTI_COLORS = ['#F59E0B', '#EC4899', '#06B6D4', '#10B981', '#8B5CF6', '#F43F5E', '#FACC15'];

export const ArcheryGame: React.FC<ArcheryGameProps> = ({
  mode,
  players,
  onFinishGame,
  soundEnabled,
  vibrationEnabled,
}) => {
  const [currentPlayerIdx, setCurrentPlayerIdx] = useState<number>(0);
  const [currentShot, setCurrentShot] = useState<number>(1);
  const totalShots = 15;

  const [playerScores, setPlayerScores] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    players.forEach((p) => (initial[p.id] = 0));
    return initial;
  });

  // Target SVG Coordinates (viewBox 0 0 200 200, Center (100, 100))
  const [aimSvg, setAimSvg] = useState<{ x: number; y: number } | null>(null);
  const [isShooting, setIsShooting] = useState<boolean>(false);

  // Arrow & Confetti State
  const [arrowSvg, setArrowSvg] = useState<{ x: number; y: number }>({ x: 100, y: 240 });
  const [arrowScale, setArrowScale] = useState<number>(1.8);
  const [stuckArrows, setStuckArrows] = useState<{ x: number; y: number; isFire: boolean; id: number }[]>([]);
  const [confetti, setConfetti] = useState<ConfettiParticle[]>([]);

  const [feedback, setFeedback] = useState<string | null>(null);

  const targetSvgRef = useRef<SVGSVGElement>(null);
  const isFinishedRef = useRef<boolean>(false);
  const playerScoresRef = useRef<Record<string, number>>({});
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const initial: Record<string, number> = {};
    players.forEach((p) => (initial[p.id] = 0));
    playerScoresRef.current = initial;
  }, [players]);

  const currentPlayer = players[currentPlayerIdx] || players[0];

  // Distance: Level 1-5: 30m, Level 6-10: 50m, Level 11-15: 70m
  const getTargetDistance = (shot: number) => {
    if (shot <= 5) return 30;
    if (shot <= 10) return 50;
    return 70;
  };

  const targetDistance = getTargetDistance(currentShot);
  const isFireArrow = currentShot >= 5; // Fireball arrows active from Level 5+

  // Target Visual Scale (30m: 100%, 50m: 78%, 70m: 60%)
  const distanceTargetScale = targetDistance === 30 ? 1.0 : targetDistance === 50 ? 0.78 : 0.60;

  // Pointer position normalized to SVG coordinates (0..200)
  const getSvgCoords = (e: React.PointerEvent) => {
    if (!targetSvgRef.current) return { x: 100, y: 100 };
    const rect = targetSvgRef.current.getBoundingClientRect();
    const xRatio = (e.clientX - rect.left) / rect.width;
    const yRatio = (e.clientY - rect.top) / rect.height;

    const svgX = Math.min(195, Math.max(5, xRatio * 200));
    const svgY = Math.min(195, Math.max(5, yRatio * 200));
    return { x: svgX, y: svgY };
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (isShooting || isFinishedRef.current) return;
    const pt = getSvgCoords(e);
    setAimSvg(pt);
    playTapSound(soundEnabled);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!aimSvg || isShooting || isFinishedRef.current) return;
    const pt = getSvgCoords(e);
    setAimSvg(pt);
  };

  const handlePointerUp = () => {
    if (!aimSvg || isShooting || isFinishedRef.current) {
      setAimSvg(null);
      return;
    }

    const hitSvgX = aimSvg.x;
    const hitSvgY = aimSvg.y;

    setAimSvg(null);
    setIsShooting(true);

    launchArrowFlight(hitSvgX, hitSvgY);
  };

  const launchArrowFlight = (hitX: number, hitY: number) => {
    const startX = 100;
    const startY = 250;

    let progress = 0;
    const durationFrames = 24;

    const animate = () => {
      progress += 1 / durationFrames;

      if (progress >= 1) {
        setArrowSvg({ x: hitX, y: hitY });
        setArrowScale(1);
        evaluateArrowHit(hitX, hitY);
        return;
      }

      const t = progress;
      const currentX = (1 - t) * startX + t * hitX;
      const currentY = (1 - t) * startY + t * hitY;

      setArrowSvg({ x: currentX, y: currentY });
      setArrowScale(1.8 - t * 0.8);

      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);
  };

  const triggerConfettiExplosion = () => {
    const newParticles: ConfettiParticle[] = Array.from({ length: 35 }).map((_, i) => ({
      id: Date.now() + i,
      x: 50 + (Math.random() * 20 - 10),
      y: 45 + (Math.random() * 20 - 10),
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      size: Math.random() * 8 + 6,
      vx: (Math.random() - 0.5) * 16,
      vy: (Math.random() - 0.7) * 16,
    }));
    setConfetti(newParticles);

    setTimeout(() => {
      setConfetti([]);
    }, 1800);
  };

  const evaluateArrowHit = (hitX: number, hitY: number) => {
    const targetCenterX = 100;
    const targetCenterY = 100;
    const radius = Math.hypot(hitX - targetCenterX, hitY - targetCenterY);

    let baseScore = 0;
    let text = '';

    if (radius <= 10.0) {
      baseScore = 10;
      text = `🎯 SEVİYE ${currentShot} (${targetDistance}m): TAM 12'DEN BULLSEYE!`;
    } else if (radius <= 16.0) {
      baseScore = 9;
      text = `🟡 SEVİYE ${currentShot} (${targetDistance}m): SARI ISABET!`;
    } else if (radius <= 34.0) {
      baseScore = 7;
      text = `🔴 SEVİYE ${currentShot} (${targetDistance}m): KIRMIZI ISABET!`;
    } else if (radius <= 58.0) {
      baseScore = 5;
      text = `🔵 SEVİYE ${currentShot} (${targetDistance}m): MAVİ ISABET!`;
    } else if (radius <= 82.0) {
      baseScore = 3;
      text = `⬛ SEVİYE ${currentShot} (${targetDistance}m): SİYAH ISABET!`;
    } else if (radius <= 98.0) {
      baseScore = 1;
      text = `⚪ SEVİYE ${currentShot} (${targetDistance}m): BEYAZ DIŞ HALKA!`;
    } else {
      baseScore = 0;
      text = `❌ SEVİYE ${currentShot} (${targetDistance}m): KARAVANA!`;
    }

    // Fireball Bonus Multiplier for Level 5+
    const score = isFireArrow && baseScore > 0 ? Math.round(baseScore * 1.5) : baseScore;
    const feedbackText = isFireArrow && baseScore > 0 ? `🔥 ${text} (+${score} PUAN BONUSU!)` : `${text} (+${score} PUAN)`;

    setFeedback(feedbackText);
    setStuckArrows((prev) => [...prev, { x: hitX, y: hitY, isFire: isFireArrow, id: Date.now() }]);

    if (score > 0) {
      playFanfareSound(soundEnabled);
      triggerVibration([25, 35], vibrationEnabled);

      // Trigger Confetti Explosion ONLY on exact center Bullseye (10 Puan) hits!
      if (baseScore === 10) {
        triggerConfettiExplosion();
      }

      const newScore = (playerScoresRef.current[currentPlayer.id] || 0) + score;
      playerScoresRef.current[currentPlayer.id] = newScore;
      setPlayerScores((prev) => ({
        ...prev,
        [currentPlayer.id]: newScore,
      }));
    } else {
      playBeepSound(200, 0.3, soundEnabled);
      triggerVibration(40, vibrationEnabled);
    }

    setTimeout(() => {
      setFeedback(null);
      setArrowSvg({ x: 100, y: 240 });
      setArrowScale(1.8);
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
    }, 1600);
  };

  const finishGame = () => {
    if (isFinishedRef.current) return;
    isFinishedRef.current = true;

    const results = players.map((p) => ({
      playerId: p.id,
      score: playerScoresRef.current[p.id] || 0,
      stats: {
        'Toplam Okçuluk Skoru': playerScoresRef.current[p.id] || 0,
        'Tamamlanan Seviye': `${totalShots} Seviye`,
      },
    }));

    onFinishGame(results);
  };

  return (
    <div className="relative flex-1 flex flex-col h-full w-full bg-slate-950 text-white select-none overflow-hidden touch-none p-3 space-y-2">
      {/* Header Bar */}
      <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-2xl px-4 py-2.5 shadow-md">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <Target className="w-5 h-5" aria-hidden="true" />
          </div>
          <span className="font-black text-sm tracking-wide text-white">15 SEVİYE DÜRBÜNLÜ OKÇULUK</span>
        </div>

        <div className="flex items-center gap-3 text-xs font-black">
          {isFireArrow && (
            <span className="text-amber-300 bg-rose-500/20 border border-rose-500/30 px-2.5 py-1 rounded-full flex items-center gap-1 animate-pulse shadow-[0_0_10px_#EF4444]">
              <Flame className="w-3.5 h-3.5 text-rose-500 fill-current" /> 🔥 ALEVLİ OK
            </span>
          )}

          <span className="text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full flex items-center gap-1">
            📏 Mesafe: {targetDistance}m
          </span>
          <span style={{ color: currentPlayer.color }} className="bg-slate-950/80 px-2.5 py-1 rounded-xl border border-slate-800">
            👤 {currentPlayer.name}
          </span>
          <span className="text-amber-400 bg-amber-500/10 border border-amber-400/20 px-3 py-1 rounded-full flex items-center gap-1">
            <Trophy className="w-3.5 h-3.5" /> Skor: {playerScores[currentPlayer.id] || 0}
          </span>
          <span className="text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-3 py-1 rounded-full flex items-center gap-1">
            <Zap className="w-3.5 h-3.5" /> Seviye: {currentShot} / {totalShots}
          </span>
        </div>
      </div>

      {/* Main Archery Field Arena */}
      <div
        className="flex-1 relative border-2 border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col justify-between p-4"
        style={{
          background: 'linear-gradient(to bottom, #020617 0%, #064E3B 35%, #047857 70%, #065F46 100%)',
        }}
      >
        {/* Feedback Banner */}
        {feedback && (
          <div className="absolute top-6 left-1/2 -translate-x-1/2 z-50 bg-slate-950/95 border-2 border-amber-400 px-6 py-2.5 rounded-full font-black text-xs text-amber-300 shadow-2xl animate-scale-up backdrop-blur">
            {feedback}
          </div>
        )}

        {/* Bursting Celebration Confetti Particles */}
        {confetti.map((c) => (
          <div
            key={c.id}
            style={{
              left: `${c.x}%`,
              top: `${c.y}%`,
              width: `${c.size}px`,
              height: `${c.size}px`,
              backgroundColor: c.color,
            }}
            className="absolute rounded-sm pointer-events-none z-50 animate-ping"
          />
        ))}

        {/* Distant Target Board (Scales down dynamically with distance) */}
        <div
          style={{
            transform: `translate(-50%, -50%) scale(${distanceTargetScale})`,
          }}
          className="absolute top-[46%] left-1/2 w-80 h-80 flex items-center justify-center pointer-events-none z-10 transition-transform duration-700"
        >
          <svg
            ref={targetSvgRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            width="320"
            height="320"
            viewBox="0 0 200 200"
            className="drop-shadow-2xl overflow-visible select-none pointer-events-auto cursor-crosshair"
          >
            {/* Wooden Tripod Stand */}
            <line x1="40" y1="180" x2="15" y2="215" stroke="#78350F" strokeWidth="8" strokeLinecap="round" />
            <line x1="160" y1="180" x2="185" y2="215" stroke="#78350F" strokeWidth="8" strokeLinecap="round" />
            <line x1="100" y1="180" x2="100" y2="220" stroke="#78350F" strokeWidth="10" strokeLinecap="round" />

            {/* Target Outer Frame */}
            <circle cx="100" cy="100" r="98" fill="#1E293B" stroke="#0F172A" strokeWidth="4" />

            {/* Concentric Score Rings */}
            <circle cx="100" cy="100" r="98" fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="1" />
            <circle cx="100" cy="100" r="82" fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="1" />

            <circle cx="100" cy="100" r="82" fill="#0F172A" stroke="#334155" strokeWidth="1" />
            <circle cx="100" cy="100" r="58" fill="#0F172A" stroke="#334155" strokeWidth="1" />

            <circle cx="100" cy="100" r="58" fill="#2563EB" stroke="#1D4ED8" strokeWidth="1" />
            <circle cx="100" cy="100" r="34" fill="#2563EB" stroke="#1D4ED8" strokeWidth="1" />

            <circle cx="100" cy="100" r="34" fill="#DC2626" stroke="#B91C1C" strokeWidth="1" />
            <circle cx="100" cy="100" r="16" fill="#DC2626" stroke="#B91C1C" strokeWidth="1" />

            <circle cx="100" cy="100" r="16" fill="#F59E0B" stroke="#D97706" strokeWidth="1" />
            <circle cx="100" cy="100" r="10" fill="#FBBF24" stroke="#D97706" strokeWidth="1" />
            <circle cx="100" cy="100" r="2" fill="#020617" />

            {/* Stuck Arrows Rendered Inside SVG Canvas */}
            {stuckArrows.map((arrow) => (
              <g key={arrow.id} transform={`translate(${arrow.x}, ${arrow.y})`}>
                <circle cx="0" cy="0" r="3.5" fill={arrow.isFire ? '#EF4444' : '#F59E0B'} stroke="#FFFFFF" strokeWidth="1.2" />
                <line x1="0" y1="0" x2="8" y2="-12" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />
              </g>
            ))}

            {/* Flying Arrow inside SVG Canvas (Normal vs Fire Arrow) */}
            <g transform={`translate(${arrowSvg.x}, ${arrowSvg.y}) scale(${arrowScale})`}>
              <line x1="0" y1="12" x2="0" y2="-12" stroke={isFireArrow ? '#EF4444' : '#FFFFFF'} strokeWidth="3" strokeLinecap="round" />
              <polygon points="0,-16 -4,-8 4,-8" fill={isFireArrow ? '#FDE047' : '#EF4444'} />
              <polygon points="0,14 -4,8 0,9 4,8" fill="#F59E0B" />
            </g>
          </svg>
        </div>

        {/* Interactive Telescopic Scope Overlay (Direct Precision Aiming) */}
        {aimSvg && (
          <div className="absolute inset-0 pointer-events-none z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm animate-fade-in">
            {/* Scope Lens Frame */}
            <div className="relative w-72 h-72 rounded-full border-4 border-amber-400 shadow-[0_0_50px_rgba(245,158,11,0.5)] overflow-hidden flex items-center justify-center bg-slate-900">
              {/* Scope Lens Crosshair Lines */}
              <svg width="100%" height="100%" viewBox="0 0 200 200" className="absolute inset-0 z-30">
                <circle cx="100" cy="100" r="95" fill="none" stroke="#F59E0B" strokeWidth="2" opacity="0.6" />
                <line x1="0" y1="100" x2="200" y2="100" stroke="#EF4444" strokeWidth="1.5" strokeDasharray="6 4" />
                <line x1="100" y1="0" x2="100" y2="200" stroke="#EF4444" strokeWidth="1.5" strokeDasharray="6 4" />
                <circle cx="100" cy="100" r="15" fill="none" stroke="#EF4444" strokeWidth="1.5" />
                <circle cx="100" cy="100" r="3" fill="#EF4444" />
              </svg>

              {/* Magnified Target View inside Scope Lens */}
              <div
                style={{
                  transform: `translate(${(100 - aimSvg.x) * 2.2}px, ${(100 - aimSvg.y) * 2.2}px) scale(2.2)`,
                }}
                className="transition-transform duration-75"
              >
                <svg width="200" height="200" viewBox="0 0 200 200">
                  <circle cx="100" cy="100" r="98" fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="1" />
                  <circle cx="100" cy="100" r="82" fill="#0F172A" stroke="#334155" strokeWidth="1" />
                  <circle cx="100" cy="100" r="58" fill="#2563EB" stroke="#1D4ED8" strokeWidth="1" />
                  <circle cx="100" cy="100" r="34" fill="#DC2626" stroke="#B91C1C" strokeWidth="1" />
                  <circle cx="100" cy="100" r="16" fill="#F59E0B" stroke="#D97706" strokeWidth="1" />
                  <circle cx="100" cy="100" r="10" fill="#FBBF24" stroke="#D97706" strokeWidth="1" />
                  <circle cx="100" cy="100" r="2" fill="#020617" />
                </svg>
              </div>

              {/* Scope Lens HUD Distance Info */}
              <div className="absolute bottom-3 inset-x-0 text-center z-40">
                <span className="text-[10px] font-black bg-slate-950/90 border border-amber-400/40 text-amber-300 px-3 py-1 rounded-full shadow-lg flex items-center justify-center gap-1">
                  {isFireArrow ? <Flame className="w-3 h-3 text-rose-500 fill-current animate-pulse" /> : null}
                  🔭 DÜRBÜN BÜYÜTMESİ (MESAFE: {targetDistance}m)
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Instruction Footer */}
        <div className="relative z-40 text-center py-2.5 mx-4 mb-3 bg-slate-950/80 border border-emerald-500/30 rounded-2xl backdrop-blur shadow-2xl">
          <p className="text-xs text-emerald-300 font-black flex items-center justify-center gap-1.5">
            <Eye className="w-4 h-4 text-emerald-400" /> Dürbün merceği ile 15 seviyeli mesafe turnuvasında alevli oklar atın!
          </p>
        </div>
      </div>
    </div>
  );
};
