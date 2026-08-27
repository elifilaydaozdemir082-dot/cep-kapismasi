import React, { useState, useRef, useEffect } from 'react';
import { Film, CheckCircle2, RotateCcw, AlertTriangle, Play, HelpCircle, Users, Award } from 'lucide-react';
import type { Player } from '../types/game';
import {
  CHARADES_CATEGORIES,
  type CharadesCategory,
  type CharadesCard,
  getCharadesCards,
} from '../data/charadesData';
import { PassDeviceScreen } from '../components/PassDeviceScreen';
import { playBeepSound, playFanfareSound, triggerVibration } from '../utils/audio';

interface CharadesGameProps {
  mode: 'single' | 'multi';
  players: Player[];
  onFinishGame: (results: { playerId: string; score: number; stats?: Record<string, number | string> }[]) => void;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
}

type SetupPhase = 'setup' | 'pass-device' | 'playing' | 'round-summary' | 'finished';

interface Team {
  id: string;
  name: string;
  color: string;
  score: number;
}

export const CharadesGame: React.FC<CharadesGameProps> = ({
  players,
  onFinishGame,
  soundEnabled,
  vibrationEnabled,
}) => {
  // Game Configuration Options
  const [gameModeType, setGameModeType] = useState<'individual' | 'team'>('individual');
  const [selectedCategory, setSelectedCategory] = useState<CharadesCategory>('karisik');
  const [roundTimeDuration, setRoundTimeDuration] = useState<number>(60); // 30, 60, 90s
  const [totalRoundsPerEntity, setTotalRoundsPerEntity] = useState<number>(2); // 1, 2, 3
  const [passLimitOption, setPassLimitOption] = useState<number>(-1); // -1: Unlimited, 3, 1

  // Setup Phase State
  const [phase, setPhase] = useState<SetupPhase>('setup');

  // Teams State (if team mode)
  const [teams] = useState<Team[]>([
    { id: 'team-a', name: 'Kırmızı Takım', color: '#EF4444', score: 0 },
    { id: 'team-b', name: 'Mavi Takım', color: '#06B6D4', score: 0 },
  ]);

  // Turn Queue State
  const [turnIndex, setTurnIndex] = useState<number>(0);
  const [currentRoundNumber, setCurrentRoundNumber] = useState<number>(1);

  // Active Card Queue State
  const [deck, setDeck] = useState<CharadesCard[]>([]);
  const [cardIndex, setCardIndex] = useState<number>(0);

  // Round Gameplay State
  const [timeLeft, setTimeLeft] = useState<number>(60);
  const [roundCorrects, setRoundCorrects] = useState<number>(0);
  const [roundPasses, setRoundPasses] = useState<number>(0);
  const [roundViolations, setRoundViolations] = useState<number>(0);
  const [passesLeft, setPassesLeft] = useState<number>(-1);

  // Action Button Anti-Double-Click Lock
  const [isProcessingAction, setIsProcessingAction] = useState<boolean>(false);

  // Cumulative Game Stats
  const [scoresMap, setScoresMap] = useState<Record<string, number>>({});
  const scoresRef = useRef<Record<string, number>>({});
  const totalCorrectsRef = useRef<number>(0);
  const totalPassesRef = useRef<number>(0);
  const totalViolationsRef = useRef<number>(0);
  const isFinishedRef = useRef<boolean>(false);

  // Entities List (either players or teams)
  const activeEntities = gameModeType === 'individual'
    ? players
    : teams.map((t) => ({ id: t.id, name: t.name, color: t.color, score: t.score }));

  const activeEntity = activeEntities[turnIndex] || activeEntities[0];

  // Start Game Setup
  const handleStartGame = () => {
    const cards = getCharadesCards(selectedCategory, 80);
    setDeck(cards);
    setCardIndex(0);

    const initialScores: Record<string, number> = {};
    activeEntities.forEach((e) => (initialScores[e.id] = 0));
    scoresRef.current = initialScores;
    setScoresMap(initialScores);

    totalCorrectsRef.current = 0;
    totalPassesRef.current = 0;
    totalViolationsRef.current = 0;
    isFinishedRef.current = false;

    setTurnIndex(0);
    setCurrentRoundNumber(1);
    setPhase('pass-device');
  };

  // Prepare Round on "Hazırım"
  const handleReadyToPlay = () => {
    setRoundCorrects(0);
    setRoundPasses(0);
    setRoundViolations(0);
    setPassesLeft(passLimitOption);
    setTimeLeft(roundTimeDuration);
    setPhase('playing');
  };

  // Timer Loop during active play
  useEffect(() => {
    if (phase !== 'playing') return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          endCurrentRound();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [phase]);

  const currentCard = deck[cardIndex % deck.length] || {
    id: 0,
    word: 'Örnek Kelime',
    categoryName: 'Karışık',
  };

  // Action Button Handlers with Debounce Lock
  const handleCorrect = () => {
    if (isProcessingAction || phase !== 'playing') return;
    setIsProcessingAction(true);

    playFanfareSound(soundEnabled);
    triggerVibration([20, 30], vibrationEnabled);

    setRoundCorrects((prev) => prev + 1);
    totalCorrectsRef.current += 1;

    setCardIndex((prev) => prev + 1);

    setTimeout(() => setIsProcessingAction(false), 250);
  };

  const handlePass = () => {
    if (isProcessingAction || phase !== 'playing') return;
    if (passesLeft === 0) return; // Pass limit reached

    setIsProcessingAction(true);
    playBeepSound(250, 0.2, soundEnabled);

    setRoundPasses((prev) => prev + 1);
    totalPassesRef.current += 1;

    if (passesLeft > 0) {
      setPassesLeft((prev) => prev - 1);
    }

    setCardIndex((prev) => prev + 1);

    setTimeout(() => setIsProcessingAction(false), 250);
  };

  const handleViolation = () => {
    if (isProcessingAction || phase !== 'playing') return;
    setIsProcessingAction(true);

    playBeepSound(150, 0.3, soundEnabled);
    triggerVibration(40, vibrationEnabled);

    setRoundViolations((prev) => prev + 1);
    totalViolationsRef.current += 1;

    setCardIndex((prev) => prev + 1);

    setTimeout(() => setIsProcessingAction(false), 250);
  };

  const endCurrentRound = () => {
    if (phase !== 'playing') return;

    // Net Round Score: Corrects - Violations (min 0 per round)
    const netRoundPoints = Math.max(0, roundCorrects - roundViolations);
    const updatedEntityScore = (scoresRef.current[activeEntity.id] || 0) + netRoundPoints;
    scoresRef.current[activeEntity.id] = updatedEntityScore;

    setScoresMap({ ...scoresRef.current });
    setPhase('round-summary');
  };

  const handleNextTurn = () => {
    const nextTurnIndex = (turnIndex + 1) % activeEntities.length;

    if (nextTurnIndex === 0) {
      // Completed full cycle across all players/teams
      if (currentRoundNumber < totalRoundsPerEntity) {
        setCurrentRoundNumber((r) => r + 1);
        setTurnIndex(0);
        setPhase('pass-device');
      } else {
        // Game Complete
        setPhase('finished');
        finishWholeGame();
      }
    } else {
      setTurnIndex(nextTurnIndex);
      setPhase('pass-device');
    }
  };

  const finishWholeGame = () => {
    if (isFinishedRef.current) return;
    isFinishedRef.current = true;

    if (gameModeType === 'individual') {
      const results = players.map((p) => ({
        playerId: p.id,
        score: scoresRef.current[p.id] || 0,
        stats: {
          'Doğru Anlatım': totalCorrectsRef.current,
          'Pas Sayısı': totalPassesRef.current,
          'Kural İhlali': totalViolationsRef.current,
        },
      }));
      onFinishGame(results);
    } else {
      // Team mode mapping back to players
      const teamAScore = scoresRef.current['team-a'] || 0;
      const teamBScore = scoresRef.current['team-b'] || 0;

      const results = players.map((p, idx) => ({
        playerId: p.id,
        score: idx % 2 === 0 ? teamAScore : teamBScore,
        stats: {
          'Doğru Anlatım': totalCorrectsRef.current,
          'Pas Sayısı': totalPassesRef.current,
          'Kural İhlali': totalViolationsRef.current,
        },
      }));
      onFinishGame(results);
    }
  };

  // RENDER PHASE 1: Setup Options
  if (phase === 'setup') {
    return (
      <div className="flex-1 flex flex-col h-full bg-slate-950 text-white p-4 select-none overflow-y-auto space-y-4 animate-fade-in">
        <div className="text-center space-y-1 my-2">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-inner">
            <Film className="w-8 h-8 stroke-[2.5]" />
          </div>
          <h2 className="text-2xl font-black text-white">Sessiz Sinema</h2>
          <p className="text-xs text-slate-400 font-medium">Oyun Seçeneklerini Belirleyin</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 space-y-4 shadow-xl">
          {/* Game Mode Choice */}
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Users className="w-4 h-4 text-cyan-400" /> Oyun Modu
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setGameModeType('individual')}
                className={`py-2.5 px-3 rounded-xl text-xs font-black border transition-all ${
                  gameModeType === 'individual'
                    ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-md shadow-cyan-500/20'
                    : 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800'
                }`}
              >
                Bireysel ({players.length} Oyuncu)
              </button>
              <button
                onClick={() => setGameModeType('team')}
                className={`py-2.5 px-3 rounded-xl text-xs font-black border transition-all ${
                  gameModeType === 'team'
                    ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-md shadow-cyan-500/20'
                    : 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800'
                }`}
              >
                2 Takım (2v2)
              </button>
            </div>
          </div>

          {/* Category Choice */}
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-300 uppercase tracking-wider">Kategori</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {CHARADES_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition-all truncate ${
                    selectedCategory === cat.id
                      ? 'bg-amber-400 text-slate-950 border-amber-300 font-black shadow-md'
                      : 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Duration Choice */}
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-300 uppercase tracking-wider">Tur Süresi</label>
            <div className="grid grid-cols-3 gap-2">
              {[30, 60, 90].map((sec) => (
                <button
                  key={sec}
                  onClick={() => setRoundTimeDuration(sec)}
                  className={`py-2 rounded-xl text-xs font-black border transition-all ${
                    roundTimeDuration === sec
                      ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md'
                      : 'bg-slate-950 text-slate-300 border-slate-800'
                  }`}
                >
                  {sec} saniye
                </button>
              ))}
            </div>
          </div>

          {/* Rounds per Player/Team Choice */}
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-300 uppercase tracking-wider">Tur Sayısı</label>
            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3].map((r) => (
                <button
                  key={r}
                  onClick={() => setTotalRoundsPerEntity(r)}
                  className={`py-2 rounded-xl text-xs font-black border transition-all ${
                    totalRoundsPerEntity === r
                      ? 'bg-purple-500 text-slate-950 border-purple-400 shadow-md'
                      : 'bg-slate-950 text-slate-300 border-slate-800'
                  }`}
                >
                  {r} Tur
                </button>
              ))}
            </div>
          </div>

          {/* Pass Limit Choice */}
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-300 uppercase tracking-wider">Pas Hakkı</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { val: -1, label: 'Sınırsız' },
                { val: 3, label: '3 Pas' },
                { val: 1, label: '1 Pas' },
              ].map((opt) => (
                <button
                  key={opt.val}
                  onClick={() => setPassLimitOption(opt.val)}
                  className={`py-2 rounded-xl text-xs font-black border transition-all ${
                    passLimitOption === opt.val
                      ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-md'
                      : 'bg-slate-950 text-slate-300 border-slate-800'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button
          onClick={handleStartGame}
          className="w-full py-4 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-base shadow-xl shadow-cyan-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          <Play className="w-5 h-5 fill-current" />
          <span>Oyunu Başlat</span>
        </button>
      </div>
    );
  }

  // RENDER PHASE 2: Pass Device Screen
  if (phase === 'pass-device') {
    return (
      <PassDeviceScreen
        activeName={activeEntity.name}
        activeColor={activeEntity.color}
        roundInfo={`Tur ${currentRoundNumber}/${totalRoundsPerEntity}`}
        onReady={handleReadyToPlay}
      />
    );
  }

  // RENDER PHASE 3: Active Gameplay
  if (phase === 'playing') {
    return (
      <div className="flex-1 flex flex-col h-full bg-slate-950 text-white p-4 select-none overflow-hidden space-y-3">
        {/* Header Navigation Bar */}
        <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-2xl px-4 py-2.5 shadow-md">
          <div className="flex items-center gap-2">
            <span
              style={{ backgroundColor: activeEntity.color }}
              className="w-3 h-3 rounded-full animate-pulse"
            />
            <span style={{ color: activeEntity.color }} className="font-extrabold text-xs">
              {activeEntity.name}
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs font-black">
            <span className="text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
              Doğru: {roundCorrects}
            </span>
            <span className={`px-2.5 py-0.5 rounded-full border ${timeLeft <= 10 ? 'bg-rose-500/20 text-rose-400 border-rose-500/30 animate-ping' : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'}`}>
              ⏱️ {timeLeft}s
            </span>
          </div>
        </div>

        {/* Main Charades Card Box */}
        <div className="flex-1 bg-gradient-to-b from-slate-900 via-slate-900/90 to-slate-950 border-2 border-slate-800 rounded-3xl p-6 flex flex-col items-center justify-between shadow-2xl relative">
          <div className="text-center space-y-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-800/80 px-3 py-1 rounded-full border border-slate-700">
              {currentCard.categoryName}
            </span>
          </div>

          {/* Central Secret Word Display */}
          <div className="text-center space-y-3 my-auto">
            <h1 className="text-3xl sm:text-4xl font-black text-white leading-tight drop-shadow-lg animate-scale-up">
              {currentCard.word}
            </h1>
            <p className="text-xs text-amber-400 font-bold flex items-center justify-center gap-1">
              <HelpCircle className="w-4 h-4" /> Ses çıkarmadan ve konuşmadan anlatın!
            </p>
          </div>

          {/* Action Buttons */}
          <div className="w-full grid grid-cols-3 gap-3">
            <button
              onClick={handleViolation}
              disabled={isProcessingAction}
              className="py-4 rounded-2xl bg-rose-950/80 border border-rose-500/40 text-rose-300 font-black text-xs hover:bg-rose-900/90 active:scale-95 transition-all flex flex-col items-center justify-center gap-1 shadow-lg"
            >
              <AlertTriangle className="w-5 h-5 text-rose-400" />
              <span>Kural İhlali (-1)</span>
            </button>

            <button
              onClick={handlePass}
              disabled={isProcessingAction || passesLeft === 0}
              className={`py-4 rounded-2xl border text-xs font-black flex flex-col items-center justify-center gap-1 shadow-lg transition-all active:scale-95 ${
                passesLeft === 0
                  ? 'bg-slate-900 text-slate-600 border-slate-800 cursor-not-allowed'
                  : 'bg-amber-950/80 border-amber-500/40 text-amber-300 hover:bg-amber-900/90'
              }`}
            >
              <RotateCcw className="w-5 h-5 text-amber-400" />
              <span>Pas ({passesLeft < 0 ? '∞' : passesLeft})</span>
            </button>

            <button
              onClick={handleCorrect}
              disabled={isProcessingAction}
              className="py-4 rounded-2xl bg-emerald-950/90 border-2 border-emerald-400 text-emerald-300 font-black text-xs hover:bg-emerald-900 active:scale-95 transition-all flex flex-col items-center justify-center gap-1 shadow-xl shadow-emerald-500/20"
            >
              <CheckCircle2 className="w-6 h-6 text-emerald-400" />
              <span>Doğru (+1)</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // RENDER PHASE 4: Round Summary
  if (phase === 'round-summary') {
    const netPoints = Math.max(0, roundCorrects - roundViolations);

    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-slate-950 text-white select-none animate-fade-in space-y-6">
        <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 text-center space-y-6 shadow-2xl">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-inner">
            <Award className="w-8 h-8 stroke-[2.5]" />
          </div>

          <div className="space-y-1">
            <h3 className="text-xl font-black text-white">Tur Tamamlandı!</h3>
            <p style={{ color: activeEntity.color }} className="text-sm font-black">
              {activeEntity.name}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 bg-slate-950 border border-slate-800 rounded-2xl p-3 text-center">
            <div>
              <p className="text-[10px] font-extrabold text-slate-400 uppercase">Doğru</p>
              <p className="text-lg font-black text-emerald-400">{roundCorrects}</p>
            </div>
            <div>
              <p className="text-[10px] font-extrabold text-slate-400 uppercase">Pas</p>
              <p className="text-lg font-black text-amber-400">{roundPasses}</p>
            </div>
            <div>
              <p className="text-[10px] font-extrabold text-slate-400 uppercase">İhlal</p>
              <p className="text-lg font-black text-rose-400">{roundViolations}</p>
            </div>
          </div>

          <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-2xl p-3">
            <p className="text-xs text-slate-300 font-bold">
              Kazanılan Tur Puanı: <span className="text-cyan-400 font-black text-base">+{netPoints}</span>
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Toplam Skor: <span className="text-white font-black">{scoresMap[activeEntity.id] || 0} Puan</span>
            </p>
          </div>

          <button
            onClick={handleNextTurn}
            className="w-full py-4 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-base shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <span>Sıradaki Tura Geç</span>
          </button>
        </div>
      </div>
    );
  }

  return null;
};
