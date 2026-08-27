import React, { useState, useEffect, useRef } from 'react';
import { Car, Trophy, Play, Zap } from 'lucide-react';
import type { Player } from '../types/game';
import {
  createPRNG,
  validateAndGenerateObstacle,
  validateAndGeneratePowerup,
  checkCollision,
  checkNearMiss,
  calculateInGameSpeedKmh,
  DIFFICULTY_CONFIGS,
} from '../utils/carRaceEngine';
import type {
  RaceDifficulty,
  RaceGameMode,
  RaceObstacle,
  RacePowerup,
  RaceCoin,
} from '../utils/carRaceEngine';
import { PlayerCarSVG, ObstacleSVG, PowerupSVG, HeartSVG } from '../components/game/CarSVGs';
import { playBeepSound, playFanfareSound, playTapSound, triggerVibration } from '../utils/audio';

interface CarRaceGameProps {
  mode: 'single' | 'multi';
  players: Player[];
  difficulty?: RaceDifficulty;
  onFinishGame: (results: { playerId: string; score: number; stats?: Record<string, number | string> }[]) => void;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
}

export const CarRaceGame: React.FC<CarRaceGameProps> = ({
  mode,
  players,
  difficulty: initialDifficulty = 'normal',
  onFinishGame,
  soundEnabled,
  vibrationEnabled,
}) => {
  // Setup / Menu State
  const [selectedGameMode, setSelectedGameMode] = useState<RaceGameMode>('time-attack');
  const [selectedDifficulty, setSelectedDifficulty] = useState<RaceDifficulty>(initialDifficulty);
  const [isGameStarted, setIsGameStarted] = useState<boolean>(false);
  const [controlMethod, setControlMethod] = useState<'buttons' | 'swipe'>('buttons');

  // In-Game State
  const [playerLane, setPlayerLane] = useState<number>(1); // 0, 1, 2, 3
  const [distance, setDistance] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [lives, setLives] = useState<number>(3);
  const [timeLeft, setTimeLeft] = useState<number>(60);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);

  // Powerups & Effects
  const [hasShield, setHasShield] = useState<boolean>(false);
  const [isNitro, setIsNitro] = useState<boolean>(false);
  const [isDoublePoints, setIsDoublePoints] = useState<boolean>(false);
  const [_isMagnetActive, setIsMagnetActive] = useState<boolean>(false);
  const [isInvincible, setIsInvincible] = useState<boolean>(false);
  const [_isOilSlipping, setIsOilSlipping] = useState<boolean>(false);
  const [screenShake, setScreenShake] = useState<boolean>(false);

  // Stats & Streaks
  const [_streakCount, setStreakCount] = useState<number>(0);
  const [streakMultiplier, setStreakMultiplier] = useState<number>(1);
  const [bestStreak, setBestStreak] = useState<number>(1);
  const [avoidedCount, setAvoidedCount] = useState<number>(0);
  const [collisionCount, setCollisionCount] = useState<number>(0);
  const [nearMissCount, setNearMissCount] = useState<number>(0);
  const [powerupsCollected, setPowerupsCollected] = useState<number>(0);
  const [maxSpeedKmh, setMaxSpeedKmh] = useState<number>(0);

  // Notifications
  const [feedbackText, setFeedbackText] = useState<string | null>(null);
  const [milestoneText, setMilestoneText] = useState<string | null>(null);

  // Game Objects
  const [obstacles, setObstacles] = useState<RaceObstacle[]>([]);
  const [powerups, setPowerups] = useState<RacePowerup[]>([]);
  const [_coins, setCoins] = useState<RaceCoin[]>([]);
  const [roadLineOffset, setRoadLineOffset] = useState<number>(0);

  // Persistent Refs across render cycles
  const animFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(performance.now());
  const lastSpawnTimeRef = useRef<number>(0);
  const secondsCounterTimeRef = useRef<number>(0);
  const isFinishedRef = useRef<boolean>(false);
  const prngRef = useRef<() => number>(Math.random);

  const playerLaneRef = useRef<number>(1);
  const distanceRef = useRef<number>(0);
  const scoreRef = useRef<number>(0);
  const livesRef = useRef<number>(3);
  const isInvincibleRef = useRef<boolean>(false);
  const isOilSlippingRef = useRef<boolean>(false);
  const obstaclesRef = useRef<RaceObstacle[]>([]);
  const powerupsRef = useRef<RacePowerup[]>([]);
  const elapsedSecondsRef = useRef<number>(0);

  const nextMilestoneRef = useRef<number>(500);

  // Touch Swipe Handling
  const touchStartXRef = useRef<number | null>(null);

  const currentPlayer = players[0];

  useEffect(() => {
    obstaclesRef.current = obstacles;
  }, [obstacles]);

  useEffect(() => {
    powerupsRef.current = powerups;
  }, [powerups]);

  useEffect(() => {
    elapsedSecondsRef.current = elapsedSeconds;
  }, [elapsedSeconds]);

  // Synchronize ref on lane change
  const changeLane = (direction: -1 | 1) => {
    if (isFinishedRef.current || !isGameStarted) return;
    if (isOilSlippingRef.current) {
      triggerVibration(30, vibrationEnabled);
      return;
    }
    setPlayerLane((prev) => {
      const next = Math.max(0, Math.min(3, prev + direction));
      playerLaneRef.current = next;
      return next;
    });
    playTapSound(soundEnabled);
  };

  // Keyboard Controls Listener
  useEffect(() => {
    if (!isGameStarted || isFinishedRef.current) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        changeLane(-1);
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        changeLane(1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isGameStarted]);

  // Touch Swipe Event Handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null) return;
    const diffX = e.changedTouches[0].clientX - touchStartXRef.current;
    if (Math.abs(diffX) > 30) {
      if (diffX > 0) changeLane(1);
      else changeLane(-1);
    }
    touchStartXRef.current = null;
  };

  const startGame = () => {
    const seed = mode === 'multi' ? 987654321 : Date.now();
    prngRef.current = createPRNG(seed);

    setPlayerLane(1);
    playerLaneRef.current = 1;
    setDistance(0);
    distanceRef.current = 0;
    setScore(0);
    scoreRef.current = 0;
    setLives(3);
    livesRef.current = 3;
    setTimeLeft(60);
    setElapsedSeconds(0);
    elapsedSecondsRef.current = 0;
    setObstacles([]);
    obstaclesRef.current = [];
    setPowerups([]);
    powerupsRef.current = [];
    setCoins([]);
    setHasShield(false);
    setIsNitro(false);
    setIsDoublePoints(false);
    setIsMagnetActive(false);
    setIsInvincible(false);
    isInvincibleRef.current = false;
    setStreakCount(0);
    setStreakMultiplier(1);
    setBestStreak(1);
    setAvoidedCount(0);
    setCollisionCount(0);
    setNearMissCount(0);
    setPowerupsCollected(0);
    setMaxSpeedKmh(0);
    setFeedbackText(null);
    setMilestoneText(null);
    nextMilestoneRef.current = 500;
    isFinishedRef.current = false;

    const now = performance.now();
    lastTimeRef.current = now;
    lastSpawnTimeRef.current = now;
    secondsCounterTimeRef.current = now;

    setIsGameStarted(true);
  };

  // Main Game Animation Loop
  useEffect(() => {
    if (!isGameStarted || isFinishedRef.current) return;

    const config = DIFFICULTY_CONFIGS[selectedDifficulty];

    const gameLoop = (now: number) => {
      const dt = Math.min(100, now - lastTimeRef.current);
      lastTimeRef.current = now;

      // Calculate Speed & Modifiers
      const speedFactor = isNitro ? 1.8 : 1.0;
      const speedScale = config.baseSpeed * speedFactor;
      const currentSpeedKmh = calculateInGameSpeedKmh(config.baseSpeed, speedFactor, elapsedSecondsRef.current);

      setMaxSpeedKmh((prev) => Math.max(prev, currentSpeedKmh));

      // Update Road Markings
      setRoadLineOffset((prev) => (prev + currentSpeedKmh * (dt / 16)) % 40);

      // 1. Update Elapsed Seconds & Timer
      if (now - secondsCounterTimeRef.current >= 1000) {
        secondsCounterTimeRef.current = now;
        setElapsedSeconds((sec) => {
          const nextSec = sec + 1;
          elapsedSecondsRef.current = nextSec;

          if (selectedGameMode === 'time-attack') {
            setTimeLeft((t) => {
              if (t <= 1) {
                finishGame();
                return 0;
              }
              return t - 1;
            });
          }
          return nextSec;
        });
      }

      // 2. Update Distance & Score
      const distDelta = speedScale * (dt / 16) * 1.5;
      const nextDist = Math.round(distanceRef.current + distDelta);
      distanceRef.current = nextDist;
      setDistance(nextDist);

      // Milestone Check
      if (nextDist >= nextMilestoneRef.current) {
        const milestone = nextMilestoneRef.current;
        nextMilestoneRef.current += 500;
        setMilestoneText(`🏁 ROTA AŞAMASI: ${milestone} METRE GEÇİLDİ!`);
        playFanfareSound(soundEnabled);
        setTimeout(() => setMilestoneText(null), 2000);
      }

      // Survival Score addition
      const pointsDelta = (distDelta / 10) * (isDoublePoints ? 2 : 1) * streakMultiplier;
      const nextScore = Math.round(scoreRef.current + pointsDelta);
      scoreRef.current = nextScore;
      setScore(nextScore);

      // 3. Move & Update Obstacles
      setObstacles((prev) => {
        const updated: RaceObstacle[] = [];

        prev.forEach((obs) => {
          const newY = obs.y + speedScale * (dt / 16) * (1 + obs.speedMultiplier);

          let newLane = obs.lane;
          let swerveTimer = obs.swerveTimer || 0;
          let swerveDir = obs.swerveDirection || 1;

          if (obs.swerving && newY > 15 && newY < 70) {
            swerveTimer += dt;
            if (swerveTimer > 1200) {
              swerveTimer = 0;
              if (newLane + swerveDir >= 0 && newLane + swerveDir <= 3) {
                newLane += swerveDir;
              } else {
                swerveDir = (swerveDir * -1) as 1 | -1;
              }
            }
          }

          // Check Collision
          if (!isInvincibleRef.current && checkCollision(playerLaneRef.current, 80, { ...obs, y: newY, lane: newLane })) {
            handleCollision(obs);
            return;
          }

          // Check Near Miss
          if (!obs.hasBeenNearMissed && checkNearMiss(playerLaneRef.current, 80, { ...obs, y: newY, lane: newLane })) {
            obs.hasBeenNearMissed = true;
            handleNearMiss();
          }

          if (newY < 110) {
            updated.push({
              ...obs,
              y: newY,
              lane: newLane,
              swerveTimer,
              swerveDirection: swerveDir,
            });
          } else {
            setAvoidedCount((c) => c + 1);
          }
        });

        return updated;
      });

      // 4. Move & Update Powerups
      setPowerups((prev) => {
        const updated: RacePowerup[] = [];
        prev.forEach((p) => {
          const newY = p.y + speedScale * (dt / 16);

          if (newY >= 72 && newY <= 88 && p.lane === playerLaneRef.current) {
            handlePowerupCollect(p);
            return;
          }

          if (newY < 110) {
            updated.push({ ...p, y: newY });
          }
        });
        return updated;
      });

      // 5. Spawn Logic (Checked using lastSpawnTimeRef!)
      if (now - lastSpawnTimeRef.current >= config.spawnIntervalMs) {
        lastSpawnTimeRef.current = now;

        const newObs = validateAndGenerateObstacle({
          existingObstacles: obstaclesRef.current,
          existingPowerups: powerupsRef.current,
          elapsedSeconds: elapsedSecondsRef.current,
          difficulty: selectedDifficulty,
          randomFn: prngRef.current,
        });

        if (newObs) {
          setObstacles((prev) => [...prev, newObs]);
        }

        if (prngRef.current() < config.powerupChance) {
          const newP = validateAndGeneratePowerup(
            obstaclesRef.current,
            powerupsRef.current,
            livesRef.current,
            prngRef.current
          );
          if (newP) {
            setPowerups((prev) => [...prev, newP]);
          }
        }
      }

      if (!isFinishedRef.current) {
        animFrameRef.current = requestAnimationFrame(gameLoop);
      }
    };

    animFrameRef.current = requestAnimationFrame(gameLoop);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isGameStarted, selectedDifficulty, selectedGameMode, isNitro, isDoublePoints, streakMultiplier]);

  // Handle Collisions
  const handleCollision = (obs: RaceObstacle) => {
    if (isInvincibleRef.current) return;

    if (hasShield) {
      setHasShield(false);
      setFeedbackText('🛡️ KALKAN BARKERİ KORUDU!');
      playFanfareSound(soundEnabled);
      setTimeout(() => setFeedbackText(null), 1200);
      return;
    }

    if (obs.type === 'oil') {
      setIsOilSlipping(true);
      isOilSlippingRef.current = true;
      setFeedbackText('⚠️ YAĞ BİRİKİNTİSİ! KAYMA YAŞANDI!');
      triggerVibration(40, vibrationEnabled);
      playBeepSound(250, 0.2, soundEnabled);
      setTimeout(() => {
        setIsOilSlipping(false);
        isOilSlippingRef.current = false;
        setFeedbackText(null);
      }, 1000);
      return;
    }

    if (obs.type === 'pothole') {
      setScreenShake(true);
      setFeedbackText('🕳️ YOL ÇUKURU! HIZ DÜŞTÜ!');
      triggerVibration(30, vibrationEnabled);
      playBeepSound(200, 0.2, soundEnabled);
      setTimeout(() => {
        setScreenShake(false);
        setFeedbackText(null);
      }, 600);
      return;
    }

    // Normal Collision Hit
    setCollisionCount((c) => c + 1);
    setStreakCount(0);
    setStreakMultiplier(1);
    setScreenShake(true);
    setFeedbackText('💥 HASAR ALINDI!');
    playBeepSound(150, 0.3, soundEnabled);
    triggerVibration(60, vibrationEnabled);

    // Temporary invincibility (1.2s)
    setIsInvincible(true);
    isInvincibleRef.current = true;
    setTimeout(() => {
      setIsInvincible(false);
      isInvincibleRef.current = false;
    }, 1200);

    setTimeout(() => setScreenShake(false), 500);
    setTimeout(() => setFeedbackText(null), 1200);

    const nextLives = livesRef.current - 1;
    livesRef.current = nextLives;
    setLives(nextLives);

    if (nextLives <= 0) {
      finishGame();
    }
  };

  // Handle Near Miss
  const handleNearMiss = () => {
    setNearMissCount((c) => c + 1);

    setStreakCount((prev) => {
      const next = prev + 1;
      setBestStreak((b) => Math.max(b, next));
      if (next >= 5) setStreakMultiplier(3);
      else if (next >= 3) setStreakMultiplier(2);
      return next;
    });

    const nearBonus = 50 * streakMultiplier;
    setScore((s) => {
      const next = s + nearBonus;
      scoreRef.current = next;
      return next;
    });

    setFeedbackText(`⚡ YAKIN GEÇİŞ! (+${nearBonus} PUAN)`);
    playFanfareSound(soundEnabled);
    triggerVibration([15, 20], vibrationEnabled);
    setTimeout(() => setFeedbackText(null), 1000);
  };

  // Handle Powerup Collection
  const handlePowerupCollect = (powerup: RacePowerup) => {
    setPowerupsCollected((c) => c + 1);
    playFanfareSound(soundEnabled);
    triggerVibration([20, 30], vibrationEnabled);

    switch (powerup.type) {
      case 'shield':
        setHasShield(true);
        setFeedbackText('🛡️ KALKAN AKTİF!');
        break;
      case 'nitro':
        setIsNitro(true);
        setFeedbackText('🚀 NİTRO HIZLANMASI!');
        setTimeout(() => setIsNitro(false), 4000);
        break;
      case 'double-points':
        setIsDoublePoints(true);
        setFeedbackText('⭐ 2X ÇİFT PUAN!');
        setTimeout(() => setIsDoublePoints(false), 6000);
        break;
      case 'repair':
        if (livesRef.current < 3) {
          const next = livesRef.current + 1;
          livesRef.current = next;
          setLives(next);
          setFeedbackText('❤️ EKSTRA CAN KAZANILDI!');
        }
        break;
      case 'magnet':
        setIsMagnetActive(true);
        setFeedbackText('🧲 MIKNATIS AKTİF!');
        setTimeout(() => setIsMagnetActive(false), 5000);
        break;
    }

    setTimeout(() => setFeedbackText(null), 1500);
  };

  // Finish Game & Record Score
  const finishGame = () => {
    if (isFinishedRef.current) return;
    isFinishedRef.current = true;

    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }

    const finalDistance = distanceRef.current;
    const finalScore = scoreRef.current;

    const results = [
      {
        playerId: currentPlayer.id,
        score: finalScore,
        stats: {
          'Kat Edilen Mesafe': `${finalDistance} m`,
          'Toplam Skor': `${finalScore} Puan`,
          'Maksimum Hız': `${maxSpeedKmh} km/h`,
          'Yakın Geçiş': nearMissCount,
          'Atlatılan Engel': avoidedCount,
          'Çarpışma': collisionCount,
          'Toplanan Güçlendirme': powerupsCollected,
          'En İyi Seri': `${bestStreak}x`,
        },
      },
    ];

    onFinishGame(results);
  };

  // Setup / Mode Selection Menu Screen
  if (!isGameStarted) {
    return (
      <div className="relative flex-1 flex flex-col h-full w-full bg-slate-950 text-white select-none p-4 space-y-4 justify-center overflow-y-auto">
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-3xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 mb-2">
            <Car className="w-10 h-10" />
          </div>
          <h1 className="text-2xl font-black tracking-wider uppercase text-white">
            Mini Araba Yarışı
          </h1>
          <p className="text-xs text-slate-400 max-w-sm mx-auto font-bold">
            Otoyolda engellerden kaç, yakın geçişler yap ve rekor skora ulaş!
          </p>
        </div>

        {/* Mode Selector */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 space-y-3 max-w-md mx-auto w-full shadow-2xl">
          <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest block text-center">
            YARIŞ MODU SEÇİMİ
          </span>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setSelectedGameMode('time-attack')}
              className={`py-4 px-3 rounded-2xl border font-black text-xs flex flex-col items-center gap-1 transition-all active:scale-95 ${
                selectedGameMode === 'time-attack'
                  ? 'bg-cyan-500 text-slate-950 border-white ring-4 ring-cyan-500/20'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'
              }`}
            >
              <Zap className="w-5 h-5" />
              <span>Zamana Karşı</span>
              <span className="text-[9px] opacity-80 font-normal">60s Normal Süre + 3 Can</span>
            </button>

            <button
              onClick={() => setSelectedGameMode('endless')}
              className={`py-4 px-3 rounded-2xl border font-black text-xs flex flex-col items-center gap-1 transition-all active:scale-95 ${
                selectedGameMode === 'endless'
                  ? 'bg-cyan-500 text-slate-950 border-white ring-4 ring-cyan-500/20'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'
              }`}
            >
              <Trophy className="w-5 h-5" />
              <span>Sonsuz Yarış</span>
              <span className="text-[9px] opacity-80 font-normal">Süresiz + Rekor Rekabeti</span>
            </button>
          </div>
        </div>

        {/* Difficulty Selector */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 space-y-3 max-w-md mx-auto w-full shadow-2xl">
          <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest block text-center">
            ZORLUK SEVİYESİ
          </span>
          <div className="grid grid-cols-3 gap-2">
            {(['easy', 'normal', 'hard'] as RaceDifficulty[]).map((d) => (
              <button
                key={d}
                onClick={() => setSelectedDifficulty(d)}
                className={`py-3 rounded-2xl border font-black text-xs uppercase transition-all active:scale-95 ${
                  selectedDifficulty === d
                    ? 'bg-amber-400 text-slate-950 border-white ring-4 ring-amber-400/20'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'
                }`}
              >
                {d === 'easy' ? 'Kolay' : d === 'normal' ? 'Normal' : 'Zor'}
              </button>
            ))}
          </div>
        </div>

        {/* Controls Option Selector */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-3 max-w-md mx-auto w-full flex items-center justify-between text-xs font-bold text-slate-300">
          <span>Mobil Kontrol Türü:</span>
          <div className="flex gap-2">
            <button
              onClick={() => setControlMethod('buttons')}
              className={`px-3 py-1.5 rounded-xl border text-[11px] font-black ${
                controlMethod === 'buttons' ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300' : 'border-slate-800 text-slate-500'
              }`}
            >
              Butonlar
            </button>
            <button
              onClick={() => setControlMethod('swipe')}
              className={`px-3 py-1.5 rounded-xl border text-[11px] font-black ${
                controlMethod === 'swipe' ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300' : 'border-slate-800 text-slate-500'
              }`}
            >
              Kaydırma
            </button>
          </div>
        </div>

        {/* Start Game Button */}
        <div className="max-w-md mx-auto w-full pt-2">
          <button
            onClick={startGame}
            className="w-full py-4 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-base shadow-xl shadow-cyan-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <Play className="w-6 h-6 stroke-[3] fill-current" /> Yarışı Başlat!
          </button>
        </div>
      </div>
    );
  }

  // Active In-Game Arena Screen
  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className={`relative flex-1 flex flex-col h-full w-full bg-slate-950 text-white select-none overflow-hidden touch-none p-3 space-y-2 ${
        screenShake ? 'animate-shake' : ''
      }`}
    >
      {/* Top Header Panel */}
      <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-2xl px-4 py-2.5 shadow-md">
        <div className="flex items-center gap-2">
          <Car className="w-5 h-5 text-cyan-400" />
          <span className="font-extrabold text-xs text-white">
            {selectedGameMode === 'time-attack' ? 'Zamana Karşı' : 'Sonsuz Yarış'} ({selectedDifficulty.toUpperCase()})
          </span>
        </div>

        <div className="flex items-center gap-3 text-xs font-black">
          {/* Hearts */}
          <div className="flex items-center gap-1">
            {Array.from({ length: 3 }).map((_, i) => (
              <HeartSVG key={i} active={i < lives} />
            ))}
          </div>

          {/* Points Score */}
          <span className="text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full text-[11px]">
            🏆 {score} Puan
          </span>

          {/* Meter Distance */}
          <span className="text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-0.5 rounded-full text-[11px]">
            📍 {distance} m
          </span>

          {/* Timer if Time-Attack */}
          {selectedGameMode === 'time-attack' && (
            <span
              className={`px-2.5 py-0.5 rounded-full border text-[11px] ${
                timeLeft <= 10
                  ? 'bg-rose-500/20 border-rose-500 text-rose-400 animate-pulse'
                  : 'bg-slate-950 border-slate-800 text-slate-300'
              }`}
            >
              ⏱️ {timeLeft}s
            </span>
          )}
        </div>
      </div>

      {/* Main 4-Lane Highway Track Arena */}
      <div className="flex-1 relative bg-slate-900 border-2 border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col justify-between">
        {/* Background Scenery & Horizon Line */}
        <div className="absolute top-0 inset-x-0 h-6 bg-gradient-to-b from-indigo-950/80 to-transparent z-10 pointer-events-none" />

        {/* 4 Highway Lanes Dividers */}
        <div className="absolute inset-0 grid grid-cols-4 pointer-events-none">
          {[0, 1, 2].map((laneIdx) => (
            <div
              key={laneIdx}
              style={{
                backgroundPositionY: `${roadLineOffset}px`,
              }}
              className="border-r-2 border-dashed border-slate-700/60 h-full"
            />
          ))}
          <div />
        </div>

        {/* Side Road Barriers with Reflectors */}
        <div className="absolute inset-y-0 left-0 w-2.5 bg-slate-800 border-r border-slate-700 flex flex-col justify-around py-4 z-10">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="w-1.5 h-3 bg-amber-400 rounded-sm shadow-[0_0_5px_#F59E0B]" />
          ))}
        </div>
        <div className="absolute inset-y-0 right-0 w-2.5 bg-slate-800 border-l border-slate-700 flex flex-col justify-around py-4 z-10">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="w-1.5 h-3 bg-rose-500 rounded-sm shadow-[0_0_5px_#EF4444]" />
          ))}
        </div>

        {/* Feedback Banners */}
        {feedbackText && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 bg-slate-950/95 border border-cyan-500 px-4 py-1.5 rounded-full font-black text-xs text-amber-400 shadow-2xl animate-scale-up">
            {feedbackText}
          </div>
        )}

        {milestoneText && (
          <div className="absolute top-14 left-1/2 -translate-x-1/2 z-40 bg-indigo-950/95 border border-amber-400 px-5 py-2 rounded-full font-black text-xs text-amber-300 shadow-2xl animate-bounce">
            {milestoneText}
          </div>
        )}

        {/* Render Obstacles */}
        {obstacles.map((obs) => (
          <div
            key={obs.id}
            style={{
              top: `${obs.y}%`,
              left: `${obs.lane * 25 + 2}%`,
              width: `${obs.widthLanes * 21}%`,
              height: '11%',
            }}
            className="absolute transition-all duration-75 z-20"
          >
            <ObstacleSVG type={obs.type} color={obs.color} swerving={obs.swerving} widthLanes={obs.widthLanes} />
          </div>
        ))}

        {/* Render Powerups */}
        {powerups.map((p) => (
          <div
            key={p.id}
            style={{
              top: `${p.y}%`,
              left: `${p.lane * 25 + 8}%`,
            }}
            className="absolute w-9 h-9 flex items-center justify-center z-20"
          >
            <PowerupSVG type={p.type} />
          </div>
        ))}

        {/* Player Car */}
        <div
          style={{
            left: `${playerLane * 25 + 2}%`,
            bottom: '8%',
            width: '21%',
            height: '12%',
          }}
          className="absolute transition-all duration-150 ease-out z-30"
        >
          <PlayerCarSVG hasShield={hasShield} isNitro={isNitro} isBlinking={isInvincible} />
        </div>

        {/* Mobile Control Touch Buttons */}
        {controlMethod === 'buttons' && (
          <div className="absolute bottom-3 inset-x-3 z-40 grid grid-cols-2 gap-4">
            <button
              onClick={() => changeLane(-1)}
              className="py-4 rounded-2xl bg-slate-950/80 border border-slate-700 text-white font-black text-sm active:scale-95 transition-all shadow-2xl backdrop-blur"
            >
              ⬅️ SOL
            </button>
            <button
              onClick={() => changeLane(1)}
              className="py-4 rounded-2xl bg-slate-950/80 border border-slate-700 text-white font-black text-sm active:scale-95 transition-all shadow-2xl backdrop-blur"
            >
              SAĞ ➡️
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
