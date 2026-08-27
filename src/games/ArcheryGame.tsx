import React, { useState, useEffect, useRef } from 'react';
import { Target, Compass, Trophy, Zap } from 'lucide-react';
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
  speed: number; // m/s
  angle: number; // degrees
  label: string;
}

const WIND_PRESETS: WindVector[] = [
  { speed: 1.2, angle: 45, label: '↗️ 1.2 m/s Kuzeydoğu Meltemi' },
  { speed: 2.5, angle: 180, label: '⬇️ 2.5 m/s Güney Rüzgârı' },
  { speed: 3.2, angle: 270, label: '⬅️ 3.2 m/s Batı Fırtınası' },
  { speed: 0.9, angle: 90, label: '➡️ 0.9 m/s Doğu Rüzgârı' },
  { speed: 3.8, angle: 315, label: '↖️ 3.8 m/s Şiddetli Rüzgâr' },
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

  // Target SVG Coordinate Space (viewBox 0 0 200 200, Center is (100, 100))
  const [aimSvg, setAimSvg] = useState<{ x: number; y: number } | null>(null);
  const [isShooting, setIsShooting] = useState<boolean>(false);
  const [wind, setWind] = useState<WindVector>(WIND_PRESETS[0]);

  // Arrow Flight & Impact in SVG Coordinates
  const [arrowSvg, setArrowSvg] = useState<{ x: number; y: number }>({ x: 100, y: 240 });
  const [arrowScale, setArrowScale] = useState<number>(1.8);
  const [stuckArrows, setStuckArrows] = useState<{ x: number; y: number; id: number }[]>([]);

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

  useEffect(() => {
    const randWind = WIND_PRESETS[Math.floor(Math.random() * WIND_PRESETS.length)];
    setWind(randWind);
  }, [currentShot, currentPlayerIdx]);

  // Convert pointer screen position directly into SVG (0..200) coordinates
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

    const rawSvg = { ...aimSvg };
    setAimSvg(null);
    setIsShooting(true);

    // Calculate Wind Drift directly in SVG units
    const rad = (wind.angle * Math.PI) / 180;
    const driftX = Math.cos(rad) * wind.speed * 4.5;
    const driftY = Math.sin(rad) * wind.speed * 4.5;

    const hitSvgX = Math.min(195, Math.max(5, rawSvg.x + driftX));
    const hitSvgY = Math.min(195, Math.max(5, rawSvg.y + driftY));

    // Launch Flight Animation inside SVG
    launchArrowFlight(hitSvgX, hitSvgY);
  };

  const launchArrowFlight = (hitX: number, hitY: number) => {
    const startX = 100;
    const startY = 250;

    let progress = 0;
    const durationFrames = 22; // 360ms flight

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

  const evaluateArrowHit = (hitX: number, hitY: number) => {
    // Target Center in SVG is EXACTLY (100, 100)
    const targetCenterX = 100;
    const targetCenterY = 100;
    const radius = Math.hypot(hitX - targetCenterX, hitY - targetCenterY);

    let score = 0;
    let text = '';

    // Exact radii matching SVG circles 100% precisely:
    // Gold Center: r <= 10
    // Yellow Ring: 10 < r <= 16
    // Red Ring: 16 < r <= 34
    // Blue Ring: 34 < r <= 58
    // Black Ring: 58 < r <= 82
    // White Ring: 82 < r <= 98
    // Miss: r > 98

    if (radius <= 10.0) {
      score = 10;
      text = '🎯 TAM 12\'DEN BULLSEYE! (10 PUAN)';
    } else if (radius <= 16.0) {
      score = 9;
      text = '🟡 SARI ISABET! (9 PUAN)';
    } else if (radius <= 34.0) {
      score = 7;
      text = '🔴 KIRMIZI ISABET! (7 PUAN)';
    } else if (radius <= 58.0) {
      score = 5;
      text = '🔵 MAVİ ISABET! (5 PUAN)';
    } else if (radius <= 82.0) {
      score = 3;
      text = '⬛ SİYAH ISABET! (3 PUAN)';
    } else if (radius <= 98.0) {
      score = 1;
      text = '⚪ BEYAZ DIŞ HALKA! (1 PUAN)';
    } else {
      score = 0;
      text = '❌ KARAVANA! (Tahtaya İsabet Edemedi)';
    }

    setFeedback(text);

    // Save stuck arrow inside SVG coordinates
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
          <span className="text-amber-400 bg-amber-500/10 border border-amber-400/20 px-3 py-1 rounded-full flex items-center gap-1">
            <Trophy className="w-3.5 h-3.5" /> Skor: {playerScores[currentPlayer.id] || 0}
          </span>
          <span className="text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-3 py-1 rounded-full flex items-center gap-1">
            <Zap className="w-3.5 h-3.5" /> Atış: {currentShot} / {totalShots}
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

        {/* Unified Target SVG Canvas Container */}
        <div className="relative w-80 h-80 mx-auto my-auto flex items-center justify-center cursor-crosshair">
          <svg
            ref={targetSvgRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            width="320"
            height="320"
            viewBox="0 0 200 200"
            className="drop-shadow-2xl overflow-visible select-none"
          >
            {/* Wooden Tripod Stand */}
            <line x1="40" y1="180" x2="15" y2="215" stroke="#78350F" strokeWidth="8" strokeLinecap="round" />
            <line x1="160" y1="180" x2="185" y2="215" stroke="#78350F" strokeWidth="8" strokeLinecap="round" />
            <line x1="100" y1="180" x2="100" y2="220" stroke="#78350F" strokeWidth="10" strokeLinecap="round" />

            {/* Target Outer Frame */}
            <circle cx="100" cy="100" r="98" fill="#1E293B" stroke="#0F172A" strokeWidth="4" />

            {/* Concentric Score Rings */}
            {/* White Rings 1-2 (r = 98 & 82) */}
            <circle cx="100" cy="100" r="98" fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="1" />
            <circle cx="100" cy="100" r="82" fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="1" />

            {/* Black Rings 3-4 (r = 82 & 58) */}
            <circle cx="100" cy="100" r="82" fill="#0F172A" stroke="#334155" strokeWidth="1" />
            <circle cx="100" cy="100" r="58" fill="#0F172A" stroke="#334155" strokeWidth="1" />

            {/* Blue Rings 5-6 (r = 58 & 34) */}
            <circle cx="100" cy="100" r="58" fill="#2563EB" stroke="#1D4ED8" strokeWidth="1" />
            <circle cx="100" cy="100" r="34" fill="#2563EB" stroke="#1D4ED8" strokeWidth="1" />

            {/* Red Rings 7-8 (r = 34 & 16) */}
            <circle cx="100" cy="100" r="34" fill="#DC2626" stroke="#B91C1C" strokeWidth="1" />
            <circle cx="100" cy="100" r="16" fill="#DC2626" stroke="#B91C1C" strokeWidth="1" />

            {/* Gold Rings 9-10 (r = 16 & 10) */}
            <circle cx="100" cy="100" r="16" fill="#F59E0B" stroke="#D97706" strokeWidth="1" />
            <circle cx="100" cy="100" r="10" fill="#FBBF24" stroke="#D97706" strokeWidth="1" />
            <circle cx="100" cy="100" r="2" fill="#020617" />

            {/* Stuck Arrows Rendered Directly Inside SVG Canvas */}
            {stuckArrows.map((arrow) => (
              <g key={arrow.id} transform={`translate(${arrow.x}, ${arrow.y})`}>
                <circle cx="0" cy="0" r="3.5" fill="#EF4444" stroke="#FFFFFF" strokeWidth="1.2" />
                <line x1="0" y1="0" x2="8" y2="-12" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />
              </g>
            ))}

            {/* Aim Reticle Indicator */}
            {aimSvg && (
              <g transform={`translate(${aimSvg.x}, ${aimSvg.y})`}>
                <circle cx="0" cy="0" r="8" fill="none" stroke="#F59E0B" strokeWidth="2" strokeDasharray="3 3" />
                <circle cx="0" cy="0" r="2.5" fill="#F59E0B" />
              </g>
            )}

            {/* Flying Arrow inside SVG Canvas */}
            <g transform={`translate(${arrowSvg.x}, ${arrowSvg.y}) scale(${arrowScale})`}>
              <line x1="0" y1="12" x2="0" y2="-12" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" />
              <polygon points="0,-16 -4,-8 4,-8" fill="#EF4444" />
              <polygon points="0,14 -4,8 0,9 4,8" fill="#F59E0B" />
            </g>
          </svg>
        </div>

        {/* Instruction Footer */}
        <div className="relative z-40 text-center py-2.5 mx-4 mb-3 bg-slate-950/80 border border-emerald-500/30 rounded-2xl backdrop-blur shadow-2xl">
          <p className="text-xs text-emerald-300 font-black flex items-center justify-center gap-1.5">
            🎯 Hedef tahtasına dokunarak nişan alın ve rüzgar sapmasını hesaba katarak bırakın!
          </p>
        </div>
      </div>
    </div>
  );
};
