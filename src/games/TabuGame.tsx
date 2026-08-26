import React, { useState, useEffect } from 'react';
import { BookOpen, Check, X, ShieldAlert, RotateCcw, Play } from 'lucide-react';
import type { Player, TabuCardItem } from '../types/game';
import { wordService } from '../services/wordService';
import { playBeepSound, playFanfareSound, triggerVibration } from '../utils/audio';

interface TabuGameProps {
  mode: 'single' | 'multi';
  players: Player[];
  onFinishGame: (results: { playerId: string; score: number; stats?: Record<string, number | string> }[]) => void;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
}

export const TabuGame: React.FC<TabuGameProps> = ({
  players,
  onFinishGame,
  soundEnabled,
  vibrationEnabled,
}) => {
  const [cards] = useState<TabuCardItem[]>(() => wordService.getAllTabuCards());
  const [usedCardIds, setUsedCardIds] = useState<number[]>([]);
  const [currentCard, setCurrentCard] = useState<TabuCardItem | null>(null);

  const [currentPlayerIdx, setCurrentPlayerIdx] = useState<number>(0);
  const [currentRound, setCurrentRound] = useState<number>(1);
  const [turnState, setTurnState] = useState<'privacy' | 'playing' | 'turn-summary'>('privacy');
  const [timeLeft, setTimeLeft] = useState<number>(60);

  // Stats
  const [playerScores, setPlayerScores] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    players.forEach((p) => (initial[p.id] = 0));
    return initial;
  });

  const [playerTurnStats, setPlayerTurnStats] = useState<
    Record<string, { correct: number; pass: number; tabu: number }>
  >(() => {
    const initial: Record<string, any> = {};
    players.forEach((p) => {
      initial[p.id] = { correct: 0, pass: 0, tabu: 0 };
    });
    return initial;
  });

  const [turnCurrentStats, setTurnCurrentStats] = useState<{ correct: number; pass: number; tabu: number }>({
    correct: 0,
    pass: 0,
    tabu: 0,
  });

  const currentPlayer = players[currentPlayerIdx] || players[0];

  // Pick Next Unused Card
  const pickNextCard = () => {
    const available = cards.filter((c) => !usedCardIds.includes(c.id));
    if (available.length === 0) {
      // Loop cards if ran out
      const random = cards[Math.floor(Math.random() * cards.length)];
      setCurrentCard(random);
      return;
    }
    const selected = available[Math.floor(Math.random() * available.length)];
    setUsedCardIds((prev) => [...prev, selected.id]);
    setCurrentCard(selected);
  };

  // Turn Timer Loop
  useEffect(() => {
    if (turnState !== 'playing') return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleTurnEnd();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [turnState]);

  const handleStartTurn = () => {
    pickNextCard();
    setTimeLeft(60);
    setTurnCurrentStats({ correct: 0, pass: 0, tabu: 0 });
    setTurnState('playing');
    playBeepSound(600, 0.1, soundEnabled);
  };

  const handleCorrect = () => {
    if (turnState !== 'playing') return;
    playFanfareSound(soundEnabled);
    triggerVibration(15, vibrationEnabled);

    setPlayerScores((prev) => ({
      ...prev,
      [currentPlayer.id]: prev[currentPlayer.id] + 1,
    }));

    setTurnCurrentStats((prev) => ({ ...prev, correct: prev.correct + 1 }));
    setPlayerTurnStats((prev) => ({
      ...prev,
      [currentPlayer.id]: {
        ...prev[currentPlayer.id],
        correct: prev[currentPlayer.id].correct + 1,
      },
    }));

    pickNextCard();
  };

  const handlePass = () => {
    if (turnState !== 'playing') return;
    playBeepSound(400, 0.1, soundEnabled);
    triggerVibration(10, vibrationEnabled);

    setTurnCurrentStats((prev) => ({ ...prev, pass: prev.pass + 1 }));
    setPlayerTurnStats((prev) => ({
      ...prev,
      [currentPlayer.id]: {
        ...prev[currentPlayer.id],
        pass: prev[currentPlayer.id].pass + 1,
      },
    }));

    pickNextCard();
  };

  const handleTabu = () => {
    if (turnState !== 'playing') return;
    playBeepSound(200, 0.3, soundEnabled);
    triggerVibration([30, 40], vibrationEnabled);

    setPlayerScores((prev) => ({
      ...prev,
      [currentPlayer.id]: Math.max(0, prev[currentPlayer.id] - 1),
    }));

    setTurnCurrentStats((prev) => ({ ...prev, tabu: prev.tabu + 1 }));
    setPlayerTurnStats((prev) => ({
      ...prev,
      [currentPlayer.id]: {
        ...prev[currentPlayer.id],
        tabu: prev[currentPlayer.id].tabu + 1,
      },
    }));

    pickNextCard();
  };

  const handleTurnEnd = () => {
    setTurnState('turn-summary');
    playFanfareSound(soundEnabled);
  };

  const handleNextPlayerTurn = () => {
    const isLastPlayer = currentPlayerIdx === players.length - 1;

    if (isLastPlayer) {
      const nextRound = currentRound + 1;
      if (nextRound > 3) {
        // Game ends!
        const results = players.map((p) => {
          const stats = playerTurnStats[p.id];
          return {
            playerId: p.id,
            score: playerScores[p.id],
            stats: {
              Doğru: stats.correct,
              Pas: stats.pass,
              Tabu: stats.tabu,
            },
          };
        });
        onFinishGame(results);
      } else {
        setCurrentRound(nextRound);
        setCurrentPlayerIdx(0);
        setTurnState('privacy');
      }
    } else {
      setCurrentPlayerIdx((prev) => prev + 1);
      setTurnState('privacy');
    }
  };

  return (
    <div className="relative flex-1 flex flex-col h-full w-full bg-slate-950 text-white select-none overflow-hidden touch-none p-4">
      {/* HUD Header */}
      <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3 shadow-md mb-2">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-cyan-400" />
          <span className="font-extrabold text-sm text-white">Tabu</span>
        </div>

        <div className="flex items-center gap-3 text-xs font-black">
          <span style={{ color: currentPlayer.color }} className="uppercase">
            {currentPlayer.name}
          </span>
          <span className="text-amber-400 bg-amber-400/10 border border-amber-400/20 px-3 py-1 rounded-full">
            Tur: {currentRound} / 3
          </span>
        </div>
      </div>

      {/* 1. PRIVACY / HANDOFF SCREEN */}
      {turnState === 'privacy' && (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-6 bg-slate-900/90 border border-slate-800 rounded-3xl animate-scale-up shadow-2xl">
          <div className="w-20 h-20 rounded-3xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-inner">
            <BookOpen className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <span className="text-xs font-black uppercase text-slate-400 tracking-widest">
              TELEFON EL DEĞİŞTİRİYOR
            </span>
            <h2 className="text-2xl font-black text-white">
              Sıra <span style={{ color: currentPlayer.color }}>{currentPlayer.name}</span>'da!
            </h2>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              Telefonu {currentPlayer.name}'a verin. Diğer oyuncular ekranı görmemelidir!
            </p>
          </div>

          <button
            onClick={handleStartTurn}
            className="w-full max-w-xs py-4 rounded-2xl bg-cyan-500 text-slate-950 font-black text-base shadow-xl active:scale-95 transition-transform flex items-center justify-center gap-2"
          >
            <Play className="w-5 h-5 fill-current" /> Hazırım, Kartı Aç!
          </button>
        </div>
      )}

      {/* 2. PLAYING TABU CARD SCREEN */}
      {turnState === 'playing' && currentCard && (
        <div className="flex-1 flex flex-col justify-between space-y-3">
          {/* Timer & Score Bar */}
          <div className="flex justify-between items-center bg-slate-900 border border-slate-800 px-4 py-2 rounded-2xl shadow-md">
            <div className="flex items-center gap-2 text-cyan-400 font-black text-lg">
              <span>⏱️ {timeLeft}s</span>
            </div>
            <div className="text-amber-400 font-black text-lg">
              Skor: {playerScores[currentPlayer.id]}
            </div>
          </div>

          {/* Real Tabu Game Card Frame */}
          <div className="flex-1 bg-gradient-to-b from-amber-400 via-amber-500 to-orange-500 p-1 rounded-3xl shadow-2xl flex flex-col">
            <div className="flex-1 bg-slate-950 rounded-[22px] p-6 flex flex-col justify-between text-center relative overflow-hidden border border-amber-400/40">
              {/* Category Tag */}
              <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-wider text-amber-400 border-b border-slate-800 pb-2">
                <span>Kategori: {currentCard.categoryName}</span>
                <span>Kart #{currentCard.id}</span>
              </div>

              {/* Target Word */}
              <div className="py-4 my-auto">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">
                  ANLATILACAK KELİME
                </span>
                <h3 className="text-3xl font-black text-amber-400 tracking-wider drop-shadow-md">
                  {currentCard.word}
                </h3>
              </div>

              {/* Forbidden Words Box */}
              <div className="bg-rose-950/40 border-2 border-rose-500/40 rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-center gap-1.5 text-rose-400 text-xs font-black uppercase tracking-widest">
                  <ShieldAlert className="w-4 h-4" /> YASAK KELİMELER
                </div>
                <div className="space-y-1 text-sm font-extrabold text-slate-200">
                  {currentCard.forbidden.map((word, i) => (
                    <div key={i} className="py-1 border-b border-rose-500/20 last:border-0">
                      {word}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="grid grid-cols-3 gap-2 pt-1">
            <button
              onClick={handleTabu}
              className="py-4 rounded-2xl bg-rose-600 active:bg-rose-700 text-white font-black text-xs flex flex-col items-center justify-center gap-1 shadow-lg active:scale-95 transition-transform"
            >
              <X className="w-6 h-6 stroke-[3]" /> TABU (-1)
            </button>
            <button
              onClick={handlePass}
              className="py-4 rounded-2xl bg-slate-800 active:bg-slate-700 text-amber-400 font-black text-xs flex flex-col items-center justify-center gap-1 border border-slate-700 shadow-lg active:scale-95 transition-transform"
            >
              <RotateCcw className="w-6 h-6 stroke-[3]" /> PAS
            </button>
            <button
              onClick={handleCorrect}
              className="py-4 rounded-2xl bg-emerald-500 active:bg-emerald-600 text-slate-950 font-black text-xs flex flex-col items-center justify-center gap-1 shadow-lg active:scale-95 transition-transform"
            >
              <Check className="w-6 h-6 stroke-[3]" /> DOĞRU (+1)
            </button>
          </div>
        </div>
      )}

      {/* 3. TURN SUMMARY POPUP */}
      {turnState === 'turn-summary' && (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-5 bg-slate-900 border border-slate-800 rounded-3xl animate-scale-up shadow-2xl">
          <h3 className="text-2xl font-black text-white">Tur Bitti!</h3>

          <div className="w-full max-w-xs bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-2 text-sm font-bold">
            <div className="flex justify-between text-emerald-400">
              <span>Doğru Cevaplar:</span>
              <span>+{turnCurrentStats.correct}</span>
            </div>
            <div className="flex justify-between text-amber-400">
              <span>Pas Sayısı:</span>
              <span>{turnCurrentStats.pass}</span>
            </div>
            <div className="flex justify-between text-rose-500">
              <span>Tabu Cezası:</span>
              <span>-{turnCurrentStats.tabu}</span>
            </div>
          </div>

          <button
            onClick={handleNextPlayerTurn}
            className="w-full max-w-xs py-4 rounded-2xl bg-cyan-500 text-slate-950 font-black text-base shadow-xl active:scale-95 transition-transform"
          >
            Sıradaki Oyuncuya Geç
          </button>
        </div>
      )}
    </div>
  );
};
