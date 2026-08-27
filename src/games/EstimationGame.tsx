import React, { useState, useRef } from 'react';
import { Target, CheckCircle2, Award, Eye } from 'lucide-react';
import type { Player } from '../types/game';
import {
  ESTIMATION_CATEGORIES,
  type EstimationCategory,
  type EstimationQuestion,
  getEstimationQuestions,
} from '../data/estimationData';
import { PassDeviceScreen } from '../components/PassDeviceScreen';
import { playBeepSound, playFanfareSound, triggerVibration } from '../utils/audio';

interface EstimationGameProps {
  mode: 'single' | 'multi';
  players: Player[];
  onFinishGame: (results: { playerId: string; score: number; stats?: Record<string, number | string> }[]) => void;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
}

type Phase = 'setup' | 'pass-device' | 'guessing' | 'reveal' | 'finished';

interface PlayerGuess {
  playerId: string;
  guessValue: number;
  absDiff: number;
  errorPercent: number;
  pointsEarned: number;
  isClosest: boolean;
}

export const EstimationGame: React.FC<EstimationGameProps> = ({
  players,
  onFinishGame,
  soundEnabled,
  vibrationEnabled,
}) => {
  // Setup Options
  const [selectedCategory, setSelectedCategory] = useState<EstimationCategory>('karisik');

  // Phase State
  const [phase, setPhase] = useState<Phase>('setup');

  // Turn / Question Index State
  const [questionIndex, setQuestionIndex] = useState<number>(0);
  const [turnIndex, setTurnIndex] = useState<number>(0);
  const [questions, setQuestions] = useState<EstimationQuestion[]>([]);

  // Current Guess Input State
  const [inputValue, setInputValue] = useState<string>('');

  // Round Guesses Map & Evaluation State
  const [roundGuesses, setRoundGuesses] = useState<Record<string, number>>({});
  const [evaluatedGuesses, setEvaluatedGuesses] = useState<PlayerGuess[]>([]);

  // Scores & Cumulative Stats Refs
  const scoresRef = useRef<Record<string, number>>({});
  const exactHitsRef = useRef<Record<string, number>>({});
  const closestWinsRef = useRef<Record<string, number>>({});
  const isFinishedRef = useRef<boolean>(false);

  const totalQuestions = 10;
  const currentPlayer = players[turnIndex] || players[0];

  const handleStartGame = () => {
    const qList = getEstimationQuestions(selectedCategory, totalQuestions);
    setQuestions(qList);

    const initScores: Record<string, number> = {};
    const initHits: Record<string, number> = {};
    const initClosest: Record<string, number> = {};

    players.forEach((p) => {
      initScores[p.id] = 0;
      initHits[p.id] = 0;
      initClosest[p.id] = 0;
    });

    scoresRef.current = initScores;
    exactHitsRef.current = initHits;
    closestWinsRef.current = initClosest;
    isFinishedRef.current = false;

    setQuestionIndex(0);
    setTurnIndex(0);

    loadQuestion(qList[0]);
    setPhase('pass-device');
  };

  const loadQuestion = (q: EstimationQuestion) => {
    if (!q) return;
    setInputValue('');
    setRoundGuesses({});
    setEvaluatedGuesses([]);
  };

  const handleKeypadPress = (val: string) => {
    playBeepSound(500, 0.05, soundEnabled);
    if (val === 'backspace') {
      setInputValue((prev) => prev.slice(0, -1));
      return;
    }
    if (val === '.') {
      if (inputValue.includes('.')) return;
      setInputValue((prev) => (prev === '' ? '0.' : prev + '.'));
      return;
    }
    if (inputValue.length >= 12) return; // Prevent number overflow
    setInputValue((prev) => prev + val);
  };

  // Submit Current Player's Secret Guess
  const handleSubmitGuess = () => {
    if (!inputValue.trim() || isNaN(Number(inputValue))) return;

    const num = Number(inputValue);
    const updatedGuesses = { ...roundGuesses, [currentPlayer.id]: num };
    setRoundGuesses(updatedGuesses);
    setInputValue('');

    const nextTurnIdx = turnIndex + 1;

    if (nextTurnIdx < players.length) {
      setTurnIndex(nextTurnIdx);
      setPhase('pass-device');
    } else {
      // All players answered! Reveal & Evaluate
      evaluateRoundResults(updatedGuesses);
    }
  };

  // Evaluate Round Guesses strictly
  const evaluateRoundResults = (guessesMap: Record<string, number>) => {
    const currentQ = questions[questionIndex];
    const correct = currentQ.correctValue;

    // Calculate diffs and error percentages for all players
    const resultsList: PlayerGuess[] = players.map((p) => {
      const g = guessesMap[p.id] || 0;
      const absDiff = Math.abs(g - correct);

      let errorPercent = 0;
      if (correct === 0) {
        errorPercent = absDiff === 0 ? 0 : 100;
      } else {
        errorPercent = (absDiff / Math.abs(correct)) * 100;
      }

      // Base Score Tiers
      let pts = 50; // Participation minimum
      if (absDiff === 0) {
        pts = 1000;
        exactHitsRef.current[p.id] = (exactHitsRef.current[p.id] || 0) + 1;
      } else if (errorPercent <= 1) {
        pts = 800;
      } else if (errorPercent <= 5) {
        pts = 600;
      } else if (errorPercent <= 10) {
        pts = 400;
      } else if (errorPercent <= 25) {
        pts = 200;
      }

      return {
        playerId: p.id,
        guessValue: g,
        absDiff,
        errorPercent,
        pointsEarned: pts,
        isClosest: false,
      };
    });

    // Determine smallest difference for Closest Bonus (+200 pts)
    const minDiff = Math.min(...resultsList.map((r) => r.absDiff));

    const finalEvaluated = resultsList.map((r) => {
      const isClosest = r.absDiff === minDiff;
      const finalPts = r.pointsEarned + (isClosest ? 200 : 0);

      if (isClosest) {
        closestWinsRef.current[r.playerId] = (closestWinsRef.current[r.playerId] || 0) + 1;
      }

      scoresRef.current[r.playerId] = (scoresRef.current[r.playerId] || 0) + finalPts;

      return {
        ...r,
        pointsEarned: finalPts,
        isClosest,
      };
    });

    setEvaluatedGuesses(finalEvaluated);
    setPhase('reveal');

    playFanfareSound(soundEnabled);
    triggerVibration([20, 30], vibrationEnabled);
  };

  const handleNextQuestion = () => {
    if (questionIndex < questions.length - 1) {
      const nextQIdx = questionIndex + 1;
      setQuestionIndex(nextQIdx);
      setTurnIndex(0);
      loadQuestion(questions[nextQIdx]);
      setPhase('pass-device');
    } else {
      setPhase('finished');
      finishWholeGame();
    }
  };

  const finishWholeGame = () => {
    if (isFinishedRef.current) return;
    isFinishedRef.current = true;

    const results = players.map((p) => ({
      playerId: p.id,
      score: scoresRef.current[p.id] || 0,
      stats: {
        'En Yakın Tahmin': `${closestWinsRef.current[p.id] || 0} Raund`,
        'Tam İsabet': exactHitsRef.current[p.id] || 0,
        'Toplam Puan': scoresRef.current[p.id] || 0,
      },
    }));

    onFinishGame(results);
  };

  // RENDER SETUP
  if (phase === 'setup') {
    return (
      <div className="flex-1 flex flex-col h-full bg-slate-950 text-white p-4 select-none overflow-y-auto space-y-4 animate-fade-in">
        <div className="text-center space-y-1 my-2">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-inner">
            <Target className="w-8 h-8 stroke-[2.5]" />
          </div>
          <h2 className="text-2xl font-black text-white">Hangisi Daha Yakın?</h2>
          <p className="text-xs text-slate-400 font-medium">Sayısal Tahmin ve Mesafe Kapışması</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 space-y-4 shadow-xl">
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-300 uppercase tracking-wider">Kategori Seçin</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {ESTIMATION_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition-all truncate ${
                    selectedCategory === cat.id
                      ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-black shadow-md'
                      : 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button
          onClick={handleStartGame}
          className="w-full py-4 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-base shadow-xl shadow-cyan-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          <span>Tahmin Maratonunu Başlat</span>
        </button>
      </div>
    );
  }

  // RENDER PASS DEVICE
  if (phase === 'pass-device') {
    return (
      <PassDeviceScreen
        activeName={currentPlayer.name}
        activeColor={currentPlayer.color}
        roundInfo={`Soru ${questionIndex + 1}/${totalQuestions}`}
        onReady={() => setPhase('guessing')}
      />
    );
  }

  const currentQ = questions[questionIndex];

  // RENDER GUESSING
  if (phase === 'guessing') {
    return (
      <div className="flex-1 flex flex-col h-full bg-slate-950 text-white p-4 select-none overflow-hidden space-y-3">
        {/* Header Info Bar */}
        <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-2xl px-4 py-2.5 shadow-md">
          <div className="flex items-center gap-2">
            <span style={{ backgroundColor: currentPlayer.color }} className="w-3 h-3 rounded-full" />
            <span style={{ color: currentPlayer.color }} className="font-extrabold text-xs">
              {currentPlayer.name} Tahmin Yapıyor
            </span>
          </div>
          <span className="text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-0.5 rounded-full text-xs font-black">
            Soru {questionIndex + 1} / {totalQuestions}
          </span>
        </div>

        {/* Question Prompt Box */}
        <div className="flex-1 bg-gradient-to-b from-slate-900 via-slate-900/90 to-slate-950 border-2 border-slate-800 rounded-3xl p-4 flex flex-col justify-between shadow-2xl space-y-3">
          <div className="text-center space-y-2 bg-slate-950/80 border border-slate-800 rounded-2xl p-4 my-auto">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-800 px-3 py-1 rounded-full border border-slate-700">
              {currentQ?.categoryName}
            </span>
            <h3 className="text-lg sm:text-xl font-black text-amber-300 leading-snug">
              {currentQ?.question}
            </h3>
          </div>

          {/* Secret Guess Input Display */}
          <div className="bg-slate-950 border-2 border-cyan-500/40 rounded-2xl p-3 flex items-center justify-between shadow-inner">
            <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Tahmininiz:</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-cyan-400 tracking-wider">
                {inputValue || '0'}
              </span>
              <span className="text-xs font-black text-slate-300">{currentQ?.unit}</span>
            </div>
          </div>

          {/* On-screen Numeric Keypad */}
          <div className="grid grid-cols-3 gap-2">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'backspace'].map((key) => (
              <button
                key={key}
                onClick={() => handleKeypadPress(key)}
                className="py-3 bg-slate-800 hover:bg-slate-750 active:scale-95 border border-slate-700 rounded-xl font-black text-base text-white flex items-center justify-center transition-all shadow-md"
              >
                {key === 'backspace' ? '⌫' : key}
              </button>
            ))}
          </div>

          <button
            onClick={handleSubmitGuess}
            disabled={!inputValue.trim()}
            className="w-full py-3.5 rounded-2xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-slate-950 font-black text-sm shadow-xl shadow-cyan-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
            <span>Tahmini Gönder (Gizli)</span>
          </button>
        </div>
      </div>
    );
  }

  // RENDER REVEAL
  if (phase === 'reveal') {
    return (
      <div className="flex-1 flex flex-col h-full bg-slate-950 text-white p-4 select-none overflow-hidden space-y-3 animate-fade-in">
        {/* Header Bar */}
        <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-2xl px-4 py-2.5 shadow-md">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-cyan-400" />
            <span className="font-extrabold text-xs text-white">Raund Sonuçları</span>
          </div>
          <span className="text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-0.5 rounded-full text-xs font-black">
            Soru {questionIndex + 1} / {totalQuestions}
          </span>
        </div>

        <div className="flex-1 bg-gradient-to-b from-slate-900 via-slate-900/90 to-slate-950 border-2 border-slate-800 rounded-3xl p-4 flex flex-col justify-between shadow-2xl overflow-y-auto space-y-3">
          {/* Question & Correct Value Reveal Box */}
          <div className="text-center space-y-2 bg-slate-950 border border-slate-800 rounded-2xl p-4">
            <h4 className="text-xs font-bold text-slate-300">{currentQ?.question}</h4>
            <div className="pt-1">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">GERÇEK CEVAP</span>
              <span className="text-3xl font-black text-amber-400 drop-shadow">
                {currentQ?.correctValue.toLocaleString('tr-TR')} {currentQ?.unit}
              </span>
            </div>
            {currentQ?.explanation && (
              <p className="text-[11px] text-slate-400 leading-relaxed border-t border-slate-800/80 pt-2 mt-2">
                {currentQ.explanation}
              </p>
            )}
          </div>

          {/* Players Guesses Leaderboard */}
          <div className="space-y-2 my-auto">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block text-center">
              OYUNCU TAHMİNLERİ & PUANLAR
            </span>

            {evaluatedGuesses.map((res) => {
              const playerObj = players.find((p) => p.id === res.playerId) || players[0];
              return (
                <div
                  key={res.playerId}
                  className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                    res.isClosest
                      ? 'bg-amber-950/40 border-amber-500/60 shadow-lg'
                      : 'bg-slate-950 border-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span style={{ backgroundColor: playerObj.color }} className="w-3 h-3 rounded-full" />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span style={{ color: playerObj.color }} className="font-extrabold text-xs">
                          {playerObj.name}
                        </span>
                        {res.isClosest && (
                          <span className="bg-amber-400/20 text-amber-300 border border-amber-400/40 text-[9px] font-black px-1.5 py-0.5 rounded-full flex items-center gap-1">
                            <Award className="w-3 h-3" /> EN YAKIN
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Tahmin: <span className="text-white font-bold">{res.guessValue.toLocaleString('tr-TR')} {currentQ.unit}</span> (Fark: {res.absDiff.toLocaleString('tr-TR')})
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-emerald-400 font-black text-sm block">+{res.pointsEarned} P</span>
                    <span className="text-[10px] font-bold text-slate-400">
                      Hata: %{res.errorPercent.toFixed(1)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <button
            onClick={handleNextQuestion}
            className="w-full py-3.5 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-sm shadow-xl shadow-cyan-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <span>Sıradaki Soruya Geç</span>
          </button>
        </div>
      </div>
    );
  }

  return null;
};
