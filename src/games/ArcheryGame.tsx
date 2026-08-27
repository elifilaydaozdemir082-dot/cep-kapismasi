import React, { useState, useEffect, useRef } from 'react';
import { Target, Wind } from 'lucide-react';
import type { Player } from '../types/game';
import { playBeepSound, playFanfareSound, triggerVibration } from '../utils/audio';

interface ArcheryGameProps {
  mode: 'single' | 'multi';
  players: Player[];
  onFinishGame: (results: { playerId: string; score: number; stats?: Record<string, number | string> }[]) => void;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
}

interface WindConfig {
  x: number;
  y: number;
  label: string;
}

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

  const [isCharging, setIsCharging] = useState<boolean>(false);
  const [power, setPower] = useState<number>(0);
  const [wind, setWind] = useState<WindConfig>({ x: 0, y: 0, label: 'Sakin Rüzgâr' });

  const [lastArrowHit, setLastArrowHit] = useState<{ x: number; y: number } | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const isFinishedRef = useRef<boolean>(false);
  const playerScoresRef = useRef<Record<string, number>>({});

  useEffect(() => {
    const initial: Record<string, number> = {};
    players.forEach((p) => (initial[p.id] = 0));
    playerScoresRef.current = initial;
  }, [players]);

  const windsList: WindConfig[] = [
    { x: -14, y: 6, label: 'Sol Yönlü Rüzgâr' },
    { x: 18, y: -8, label: 'Sağ Yönlü Rüzgâr' },
    { x: 0, y: 14, label: 'Aşağı Doğru Rüzgâr' },
    { x: 0, y: -10, label: 'Kafa Rüzgârı' },
    { x: 8, y: 4, label: 'Hafif Meltem' },
  ];

  const currentPlayer = players[currentPlayerIdx] || players[0];

  useEffect(() => {
    const rand = windsList[Math.floor(Math.random() * windsList.length)];
    setWind(rand);
  }, [currentShot, currentPlayerIdx]);

  useEffect(() => {
    if (!isCharging) return;

    const interval = setInterval(() => {
      setPower((prev) => {
        if (prev >= 100) return 0;
        return prev + 4;
      });
    }, 25);

    return () => clearInterval(interval);
  }, [isCharging]);

  const handleStartAim = () => {
    if (isFinishedRef.current || feedback) return;
    setIsCharging(true);
    setPower(0);
    setLastArrowHit(null);
  };

  const handleReleaseAim = () => {
    if (!isCharging || isFinishedRef.current) return;
    setIsCharging(false);

    // Physics Math: Optimal power is 80-85%.
    // If power is low (<80%), gravity causes the arrow to drop significantly downwards!
    // If power is 100%, overcharge causes wobble.
    const optimalPower = 85;
    const powerDiff = (power - optimalPower) / 100;

    // Gravity vertical sag: low power drops down, high power pushes slightly high
    const gravityDropY = (1 - power / optimalPower) * 38;

    // Wind displacement scales with exposure time (lower power = more drift)
    const windEffectX = wind.x * (1 + (100 - power) / 100);
    const windEffectY = wind.y * (1 + (100 - power) / 100);

    const hitX = Math.min(95, Math.max(5, 50 + windEffectX + powerDiff * 5));
    const hitY = Math.min(95, Math.max(5, 50 + gravityDropY + windEffectY));

    setLastArrowHit({ x: hitX, y: hitY });
    evaluateArrowHit(hitX, hitY);
  };

  const evaluateArrowHit = (x: number, y: number) => {
    const targetCenterX = 50;
    const targetCenterY = 50;
    const dist = Math.hypot(x - targetCenterX, y - targetCenterY);

    let score = 0;
    let text = '';

    if (dist <= 5) {
      score = 10;
      text = '🎯 TAM 10 PUAN! SARI MERKEZ VURUŞU';
    } else if (dist <= 12) {
      score = 9;
      text = '🎯 9 PUAN! SARI HALKA';
    } else if (dist <= 22) {
      score = 7;
      text = '🔴 7 PUAN! KIRMIZI HALKA';
    } else if (dist <= 33) {
      score = 5;
      text = '🔵 5 PUAN! MAVİ HALKA';
    } else if (dist <= 44) {
      score = 3;
      text = '⚫ 3 PUAN! SİYAH HALKA';
    } else if (dist <= 50) {
      score = 1;
      text = '⚪ 1 PUAN! BEYAZ DIŞ HALKA';
    } else {
      score = 0;
      text = '❌ KARAVANA! (Tahtaya İsabet Edemedi)';
    }

    setFeedback(text);

    if (score > 0) {
      playFanfareSound(soundEnabled);
      triggerVibration([20, 30], vibrationEnabled);
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
      },
    }));

    onFinishGame(results);
  };

  return (
    <div className="relative flex-1 flex flex-col h-full w-full bg-slate-950 text-white select-none overflow-hidden touch-none p-3 space-y-2">
      {/* Header Bar */}
      <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-2xl px-4 py-2.5 shadow-md">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-amber-400" aria-hidden="true" />
          <span className="font-extrabold text-sm text-white">Okçuluk</span>
        </div>

        <div className="flex items-center gap-3 text-xs font-black">
          <span style={{ color: currentPlayer.color }}>{currentPlayer.name}</span>
          <span className="text-amber-400 bg-amber-400/10 border border-amber-400/20 px-3 py-1 rounded-full">
            Skor: {playerScores[currentPlayer.id] || 0}
          </span>
          <span className="text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-3 py-1 rounded-full">
            Atış: {currentShot} / {totalShots}
          </span>
        </div>
      </div>

      {/* Main Archery Field Pitch Arena */}
      <div className="flex-1 relative bg-gradient-to-b from-slate-950 via-slate-900 to-emerald-950/20 border-2 border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col justify-between p-4">
        {/* Feedback Banner */}
        {feedback && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-40 bg-slate-950/95 border-2 border-amber-400 px-5 py-2.5 rounded-full font-black text-xs text-amber-300 shadow-2xl animate-scale-up">
            {feedback}
          </div>
        )}

        {/* Wind Status & Power HUD */}
        <div className="flex items-center justify-between bg-slate-900/90 border border-slate-800 px-4 py-2.5 rounded-2xl text-xs font-black text-slate-300 shadow-lg">
          <div className="flex items-center gap-1.5 text-cyan-400">
            <Wind className="w-4 h-4" aria-hidden="true" /> {wind.label}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider">Güç Barı</span>
            <div className="w-28 h-3 bg-slate-950 rounded-full border border-slate-700 overflow-hidden">
              <div
                style={{ width: `${power}%` }}
                className={`h-full transition-all duration-75 ${
                  power >= 80 && power <= 90
                    ? 'bg-emerald-400 shadow-emerald-500/50 shadow-md'
                    : 'bg-amber-400'
                }`}
              />
            </div>
            <span className="text-amber-400 w-8 text-right">%{power}</span>
          </div>
        </div>

        {/* High Quality Official World Archery Target Board SVG */}
        <div className="relative w-72 h-72 mx-auto my-auto flex items-center justify-center">
          <svg width="280" height="280" viewBox="0 0 200 200" className="drop-shadow-2xl">
            {/* Target Wooden Stand Legs */}
            <line x1="40" y1="180" x2="20" y2="200" stroke="#78350F" strokeWidth="8" strokeLinecap="round" />
            <line x1="160" y1="180" x2="180" y2="200" stroke="#78350F" strokeWidth="8" strokeLinecap="round" />
            <line x1="100" y1="180" x2="100" y2="200" stroke="#78350F" strokeWidth="10" strokeLinecap="round" />

            {/* Target Outer Frame */}
            <circle cx="100" cy="100" r="98" fill="#1E293B" stroke="#0F172A" strokeWidth="4" />

            {/* Concentric Score Rings */}
            {/* White Rings 1-2 */}
            <circle cx="100" cy="100" r="94" fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="1" />
            <circle cx="100" cy="100" r="82" fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="1" />

            {/* Black Rings 3-4 */}
            <circle cx="100" cy="100" r="70" fill="#0F172A" stroke="#334155" strokeWidth="1" />
            <circle cx="100" cy="100" r="58" fill="#0F172A" stroke="#334155" strokeWidth="1" />

            {/* Blue Rings 5-6 */}
            <circle cx="100" cy="100" r="46" fill="#2563EB" stroke="#1D4ED8" strokeWidth="1" />
            <circle cx="100" cy="100" r="34" fill="#2563EB" stroke="#1D4ED8" strokeWidth="1" />

            {/* Red Rings 7-8 */}
            <circle cx="100" cy="100" r="24" fill="#DC2626" stroke="#B91C1C" strokeWidth="1" />
            <circle cx="100" cy="100" r="16" fill="#DC2626" stroke="#B91C1C" strokeWidth="1" />

            {/* Gold Rings 9-10 */}
            <circle cx="100" cy="100" r="10" fill="#F59E0B" stroke="#D97706" strokeWidth="1" />
            <circle cx="100" cy="100" r="4" fill="#FBBF24" stroke="#D97706" strokeWidth="1" />
            <circle cx="100" cy="100" r="1.5" fill="#020617" />
          </svg>

          {/* Embedded Arrow Graphic when shot */}
          {lastArrowHit && (
            <div
              style={{ left: `${lastArrowHit.x}%`, top: `${lastArrowHit.y}%` }}
              className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none z-30 animate-scale-up"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" className="drop-shadow-lg">
                <circle cx="12" cy="12" r="4" fill="#EF4444" stroke="#F8FAFC" strokeWidth="2" />
                <line x1="12" y1="12" x2="22" y2="2" stroke="#F8FAFC" strokeWidth="3" strokeLinecap="round" />
              </svg>
            </div>
          )}
        </div>

        {/* Charging & Release Control Button */}
        <button
          onPointerDown={handleStartAim}
          onPointerUp={handleReleaseAim}
          className={`w-full py-5 rounded-2xl font-black text-lg shadow-xl border-2 transition-all active:scale-95 ${
            isCharging
              ? 'bg-amber-400 border-white text-slate-950 animate-pulse'
              : 'bg-cyan-500 border-cyan-400 text-slate-950 hover:bg-cyan-400'
          }`}
        >
          {isCharging ? 'SERBEST BRAK (OKU FIRLAT!)' : 'BASILI TUT (YAYI GER & GÜÇ TOPLA)'}
        </button>
      </div>
    </div>
  );
};
