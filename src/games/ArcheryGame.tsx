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

  const [aimPos, setAimPos] = useState<{ x: number; y: number }>({ x: 50, y: 50 });
  const [isCharging, setIsCharging] = useState<boolean>(false);
  const [power, setPower] = useState<number>(0);
  const [wind, setWind] = useState<WindConfig>({ x: 0, y: 0, label: 'Sakin Rüzgâr' });

  const [feedback, setFeedback] = useState<string | null>(null);

  const isFinishedRef = useRef<boolean>(false);
  const playerScoresRef = useRef<Record<string, number>>({});

  useEffect(() => {
    const initial: Record<string, number> = {};
    players.forEach((p) => (initial[p.id] = 0));
    playerScoresRef.current = initial;
  }, [players]);

  const windsList: WindConfig[] = [
    { x: -15, y: 0, label: 'Sol Yönlü Rüzgâr' },
    { x: 22, y: -8, label: 'Sağ Yönlü Rüzgâr' },
    { x: 0, y: -15, label: 'Kafa Rüzgârı' },
    { x: 0, y: 0, label: 'Sakin Rüzgâr' },
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
        return prev + 5;
      });
    }, 30);

    return () => clearInterval(interval);
  }, [isCharging]);

  const handleStartAim = () => {
    if (isFinishedRef.current) return;
    setIsCharging(true);
    setPower(0);
  };

  const handleReleaseAim = () => {
    if (!isCharging || isFinishedRef.current) return;
    setIsCharging(false);

    const finalX = Math.min(95, Math.max(5, aimPos.x + wind.x * (power / 100)));
    const finalY = Math.min(95, Math.max(5, aimPos.y + wind.y * (power / 100)));

    evaluateArrowHit(finalX, finalY);
  };

  const evaluateArrowHit = (x: number, y: number) => {
    const targetCenterX = 50;
    const targetCenterY = 50;
    const dist = Math.hypot(x - targetCenterX, y - targetCenterY);

    let score = 0;
    let text = '';

    if (dist < 6) {
      score = 10;
      text = 'TAM 10 PUANLIK MERKEZ VURUŞU!';
    } else if (dist < 14) {
      score = 8;
      text = 'İÇ HALKA! (+8 PUAN)';
    } else if (dist < 25) {
      score = 5;
      text = 'ORTA HALKA! (+5 PUAN)';
    } else if (dist < 38) {
      score = 2;
      text = 'DIŞ HALKA! (+2 PUAN)';
    } else {
      score = 0;
      text = 'KARAVANA! (İsabet Sağlanamadı)';
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
      setAimPos({ x: 50, y: 50 });

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
        'Toplam Puan': playerScoresRef.current[p.id] || 0,
      },
    }));

    onFinishGame(results);
  };

  return (
    <div className="relative flex-1 flex flex-col h-full w-full bg-slate-950 text-white select-none overflow-hidden touch-none p-3 space-y-2">
      {/* Header Bar */}
      <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3 shadow-md">
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

      {/* Main Target Pitch Arena */}
      <div className="flex-1 relative bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border-2 border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col justify-between p-4">
        {/* Feedback Banner */}
        {feedback && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-40 bg-slate-950/95 border border-amber-400 px-5 py-2 rounded-full font-black text-xs text-amber-400 shadow-2xl animate-scale-up">
            {feedback}
          </div>
        )}

        {/* Wind Status HUD */}
        <div className="flex items-center justify-between bg-slate-900/80 border border-slate-800 px-4 py-2 rounded-2xl text-xs font-black text-slate-300">
          <div className="flex items-center gap-1.5 text-cyan-400">
            <Wind className="w-4 h-4" aria-hidden="true" /> {wind.label}
          </div>
          <span>Güç: %{power}</span>
        </div>

        {/* Archery Target Concentric Rings */}
        <div className="relative w-64 h-64 mx-auto my-auto rounded-full border-4 border-slate-950 shadow-2xl flex items-center justify-center overflow-hidden">
          <div className="w-full h-full rounded-full bg-slate-200 flex items-center justify-center">
            <div className="w-4/5 h-4/5 rounded-full bg-slate-900 flex items-center justify-center">
              <div className="w-3/5 h-3/5 rounded-full bg-blue-600 flex items-center justify-center">
                <div className="w-2/5 h-2/5 rounded-full bg-rose-600 flex items-center justify-center">
                  <div className="w-2/5 h-2/5 rounded-full bg-amber-400 border border-amber-300 shadow-inner flex items-center justify-center text-slate-950 font-black text-xs">
                    +10
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div
            style={{ left: `${aimPos.x}%`, top: `${aimPos.y}%` }}
            className="absolute -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full border-2 border-cyan-400 bg-cyan-400/20 flex items-center justify-center pointer-events-none z-30"
          >
            <div className="w-2 h-2 rounded-full bg-cyan-400" />
          </div>
        </div>

        {/* Aim & Release Button */}
        <button
          onPointerDown={handleStartAim}
          onPointerUp={handleReleaseAim}
          className={`w-full py-5 rounded-2xl font-black text-lg shadow-xl border-2 transition-all active:scale-95 ${
            isCharging
              ? 'bg-amber-400 border-white text-slate-950 animate-pulse'
              : 'bg-cyan-500 border-cyan-400 text-slate-950 hover:bg-cyan-400'
          }`}
        >
          {isCharging ? 'BIRAŞ VE ATIŞ YAP!' : 'BASILI TUT (GÜÇ TOPLA)'}
        </button>
      </div>
    </div>
  );
};
