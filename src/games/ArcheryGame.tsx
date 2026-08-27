import React, { useState, useEffect, useRef } from 'react';
import { Target, Compass, Sparkles, Trophy, Zap } from 'lucide-react';
import type { Player } from '../types/game';
import { playBeepSound, playFanfareSound, playTapSound, triggerVibration } from '../utils/audio';

interface ArcheryGameProps {
  mode: 'single' | 'multi';
  players: Player[];
  onFinishGame: (results: { playerId: string; score: number; stats?: Record<string, number | string> }[]) => void;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
}

interface WindVector {
  speed: number; // in m/s (0.5 .. 4.5)
  angle: number; // degrees (0 .. 360)
  label: string;
}

const WIND_PRESETS: WindVector[] = [
  { speed: 1.2, angle: 45, label: '↗️ 1.2 m/s Kuzeydoğu Meltemi' },
  { speed: 2.8, angle: 180, label: '⬇️ 2.8 m/s Güney Rüzgârı' },
  { speed: 3.5, angle: 270, label: '⬅️ 3.5 m/s Batı Fırtınası' },
  { speed: 0.8, angle: 90, label: '➡️ 0.8 m/s Doğu Rüzgârı' },
  { speed: 4.2, angle: 315, label: '↖️ 4.2 m/s Şiddetli Rüzgâr' },
];

export const ArcheryGame: React.FC<ArcheryGameProps> = ({
  mode,
  players,
  onFinishGame,
  soundEnabled,
  vibrationEnabled,
}) => {
  const [currentPlayerIdx, setCurrentPlayerIdx] = useState<number>(0);
  const [currentShot, setCurrentShot] = useState<number>(1);
  const totalShots = 5;

  const [playerScores, setPlayerScores] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    players.forEach((p) => (initial[p.id] = 0));
    return initial;
  });

  // Pull-to-Draw Bow & Aiming State
  const [aimTarget, setAimTarget] = useState<{ x: number; y: number } | null>(null);
  const [isShooting, setIsShooting] = useState<boolean>(false);
  const [wind, setWind] = useState<WindVector>(WIND_PRESETS[0]);

  // Arrow Flying & Impact State
  const [arrowPos, setArrowPos] = useState<{ x: number; y: number }>({ x: 50, y: 88 });
  const [arrowScale, setArrowScale] = useState<number>(1);
  const [stuckArrows, setStuckArrows] = useState<{ x: number; y: number; id: number }[]>([]);

  const [feedback, setFeedback] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const isFinishedRef = useRef<boolean>(false);
  const playerScoresRef = useRef<Record<string, number>>({});
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const initial: Record<string, number> = {};
    players.forEach((p) => (initial[p.id] = 0));
    playerScoresRef.current = initial;
  }, [players]);

  const currentPlayer = players[currentPlayerIdx] || players[0];

  // Rotate wind vector on each shot
  useEffect(() => {
    const randWind = WIND_PRESETS[Math.floor(Math.random() * WIND_PRESETS.length)];
    setWind(randWind);
  }, [currentShot, currentPlayerIdx]);

  // Normalized % pointer coordinates
  const getPointerPct = (e: React.PointerEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return { x: 50, y: 48 };
    const xPct = Math.min(92, Math.max(8, ((e.clientX - rect.left) / rect.width) * 100));
    const yPct = Math.min(85, Math.max(12, ((e.clientY - rect.top) / rect.height) * 100));
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

    const rawTarget = { ...aimTarget };
    setAimTarget(null);
    setIsShooting(true);

    // Wind Drift Vector Physics Calculation
    const rad = (wind.angle * Math.PI) / 180;
    const driftX = Math.cos(rad) * wind.speed * 2.2;
    const driftY = Math.sin(rad) * wind.speed * 2.2;

    const finalHitX = Math.min(92, Math.max(8, rawTarget.x + driftX));
    const finalHitY = Math.min(85, Math.max(12, rawTarget.y + driftY));

    // Launch Flight Animation
    launchArrowFlight(finalHitX, finalHitY);
  };

  const launchArrowFlight = (hitX: number, hitY: number) => {
    const startX = 50;
    const startY = 88;

    let progress = 0;
    const durationFrames = 24; // 400ms flight

    const animate = () => {
      progress += 1 / durationFrames;

      if (progress >= 1) {
        setArrowPos({ x: hitX, y: hitY });
        setArrowScale(0.4);
        evaluateArrowHit(hitX, hitY);
        return;
      }

      const t = progress;
      const currentX = (1 - t) * startX + t * hitX;
      const currentY = (1 - t) * startY + t * hitY;

      setArrowPos({ x: currentX, y: currentY });
      setArrowScale(1 - t * 0.6);

      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);
  };

  const evaluateArrowHit = (hitX: number, hitY: number) => {
    // Target Center Coordinates: (50%, 48%)
    const targetCenterX = 50;
    const targetCenterY = 48;
    const dist = Math.hypot(hitX - targetCenterX, hitY - targetCenterY);

    let score = 0;
    let text = '';

    if (dist <= 4.5) {
      score = 10;
      text = '🎯 TAM 12\'DEN BULLSEYE! (10 PUAN)';
    } else if (dist <= 10.0) {
      score = 9;
      text = '🟡 SARI ISABET! (9 PUAN)';
    } else if (dist <= 18.0) {
      score = 7;
      text = '🔴 KIRMIZI ISABET! (7 PUAN)';
    } else if (dist <= 27.0) {
      score = 5;
      text = '🔵 MAVİ ISABET! (5 PUAN)';
    } else if (dist <= 36.0) {
      score = 3;
      text = '⬛ SİYAH ISABET! (3 PUAN)';
    } else if (dist <= 44.0) {
      score = 1;
      text = '⚪ DIŞ HALKA ISABETİ! (1 PUAN)';
    } else {
      score = 0;
      text = '❌ KARAVANA! (Dışarı Gitti)';
    }

    setFeedback(text);

    // Save stuck arrow location
    setStuckArrows((prev) => [...prev, { x: hitX, y: hitY, id: Date.now() }]);

    if (score > 0) {
      playFanfareSound(soundEnabled);
      triggerVibration([25, 35], vibrationEnabled);
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
      setArrowPos({ x: 50, y: 88 });
      setArrowScale(1);
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

    const results = players.map((p) => ({
      playerId: p.id,
      score: playerScoresRef.current[p.id] || 0,
      stats: {
        'Toplam Okçuluk Skoru': playerScoresRef.current[p.id] || 0,
        'Atılan Ok': totalShots,
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
          <span className="font-black text-sm tracking-wide text-white">OLİMPİYAT OKÇULUK</span>
        </div>

        <div className="flex items-center gap-3 text-xs font-black">
          <span style={{ color: currentPlayer.color }} className="bg-slate-950/80 px-2.5 py-1 rounded-xl border border-slate-800">
            👤 {currentPlayer.name}
          </span>
          <span className="text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full flex items-center gap-1">
            <Trophy className="w-3.5 h-3.5" /> Skor: {playerScores[currentPlayer.id] || 0}
          </span>
          <span className="text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-3 py-1 rounded-full flex items-center gap-1">
            <Zap className="w-3.5 h-3.5" /> Atış: {currentShot} / {totalShots}
          </span>
        </div>
      </div>

      {/* Main Archery Field Pitch Arena */}
      <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className="flex-1 relative border-2 border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col justify-between cursor-crosshair"
        style={{
          background: 'linear-gradient(to bottom, #020617 0%, #064E3B 35%, #047857 70%, #065F46 100%)',
        }}
      >
        {/* Wind Status HUD Badge */}
        <div className="absolute top-4 left-4 z-40 bg-slate-950/90 border border-cyan-500/30 px-3.5 py-1.5 rounded-2xl flex items-center gap-2 text-xs font-black text-cyan-300 shadow-xl backdrop-blur">
          <Compass className="w-4 h-4 text-cyan-400 animate-spin-slow" />
          <span>{wind.label}</span>
        </div>

        {/* Feedback Banner */}
        {feedback && (
          <div className="absolute top-6 left-1/2 -translate-x-1/2 z-50 bg-slate-950/95 border-2 border-amber-400 px-6 py-2.5 rounded-full font-black text-xs text-amber-300 shadow-2xl animate-scale-up backdrop-blur">
            {feedback}
          </div>
        )}

        {/* Official 10-Ring Target Board SVG (Target Center: Y: 48%) */}
        <div className="absolute top-[48%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 flex items-center justify-center pointer-events-none z-10">
          <svg width="300" height="300" viewBox="0 0 200 200" className="drop-shadow-2xl">
            {/* Wooden Tripod Stand */}
            <line x1="40" y1="180" x2="15" y2="210" stroke="#78350F" strokeWidth="8" strokeLinecap="round" />
            <line x1="160" y1="180" x2="185" y2="210" stroke="#78350F" strokeWidth="8" strokeLinecap="round" />
            <line x1="100" y1="180" x2="100" y2="215" stroke="#78350F" strokeWidth="10" strokeLinecap="round" />

            {/* Target Outer Frame */}
            <circle cx="100" cy="100" r="98" fill="#1E293B" stroke="#0F172A" strokeWidth="4" />

            {/* Concentric Score Rings */}
            <circle cx="100" cy="100" r="94" fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="1" />
            <circle cx="100" cy="100" r="82" fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="1" />

            <circle cx="100" cy="100" r="70" fill="#0F172A" stroke="#334155" strokeWidth="1" />
            <circle cx="100" cy="100" r="58" fill="#0F172A" stroke="#334155" strokeWidth="1" />

            <circle cx="100" cy="100" r="46" fill="#2563EB" stroke="#1D4ED8" strokeWidth="1" />
            <circle cx="100" cy="100" r="34" fill="#2563EB" stroke="#1D4ED8" strokeWidth="1" />

            <circle cx="100" cy="100" r="24" fill="#DC2626" stroke="#B91C1C" strokeWidth="1" />
            <circle cx="100" cy="100" r="16" fill="#DC2626" stroke="#B91C1C" strokeWidth="1" />

            <circle cx="100" cy="100" r="10" fill="#F59E0B" stroke="#D97706" strokeWidth="1" />
            <circle cx="100" cy="100" r="4" fill="#FBBF24" stroke="#D97706" strokeWidth="1" />
            <circle cx="100" cy="100" r="1.5" fill="#020617" />
          </svg>
        </div>

        {/* Stuck Arrows History on Target */}
        {stuckArrows.map((arrow) => (
          <div
            key={arrow.id}
            style={{ left: `${arrow.x}%`, top: `${arrow.y}%` }}
            className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none z-20"
          >
            <div className="w-3 h-3 rounded-full bg-rose-500 border-2 border-white shadow-md flex items-center justify-center">
              <div className="w-1 h-1 rounded-full bg-white" />
            </div>
          </div>
        ))}

        {/* Aim Target Marker & Bowstring Guidance Line */}
        {aimTarget && (
          <div
            style={{
              left: `${aimTarget.x}%`,
              top: `${aimTarget.y}%`,
              transform: 'translate(-50%, -50%)',
            }}
            className="absolute z-50 pointer-events-none flex items-center justify-center"
          >
            <div className="w-10 h-10 rounded-full border-2 border-dashed border-amber-300 animate-spin-slow flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-amber-400" />
            </div>
          </div>
        )}

        {/* Flying Arrow Graphic */}
        <div
          style={{
            left: `${arrowPos.x}%`,
            top: `${arrowPos.y}%`,
            transform: `translate(-50%, -50%) scale(${arrowScale})`,
          }}
          className="absolute transition-transform duration-75 z-40 drop-shadow-2xl pointer-events-none"
        >
          <svg width="28" height="60" viewBox="0 0 28 60">
            {/* Arrow Shaft & Feather Fletching */}
            <line x1="14" y1="58" x2="14" y2="8" stroke="#F8FAFC" strokeWidth="3" strokeLinecap="round" />
            <polygon points="14,2 8,12 20,12" fill="#EF4444" />
            <polygon points="14,56 6,48 14,50 22,48" fill="#F59E0B" />
          </svg>
        </div>

        {/* Instruction Footer */}
        <div className="relative z-40 text-center py-2.5 mx-4 mb-3 bg-slate-950/80 border border-emerald-500/30 rounded-2xl backdrop-blur shadow-2xl">
          <p className="text-xs text-emerald-300 font-black flex items-center justify-center gap-1.5">
            🎯 Ekrana dokunup yayı gererek hedef tahtasına nişan alın ve rüzgarı hesaba katarak bırakın!
          </p>
        </div>
      </div>
    </div>
  );
};
