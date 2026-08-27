import React, { useState, useEffect, useRef } from 'react';
import { Layers, CheckCircle2, ArrowUp, ArrowDown, HelpCircle, Award } from 'lucide-react';
import type { Player } from '../types/game';
import {
  ORDERING_CATEGORIES,
  type OrderingCategory,
  type OrderingQuestion,
  type OrderingItem,
  getOrderingQuestions,
} from '../data/orderingData';
import { PassDeviceScreen } from '../components/PassDeviceScreen';
import { playBeepSound, playFanfareSound, triggerVibration } from '../utils/audio';

interface OrderingGameProps {
  mode: 'single' | 'multi';
  players: Player[];
  onFinishGame: (results: { playerId: string; score: number; stats?: Record<string, number | string> }[]) => void;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
}

type Phase = 'setup' | 'pass-device' | 'playing' | 'explanation' | 'finished';

export const OrderingGame: React.FC<OrderingGameProps> = ({
  mode,
  players,
  onFinishGame,
  soundEnabled,
  vibrationEnabled,
}) => {
  // Setup Options
  const [selectedCategory, setSelectedCategory] = useState<OrderingCategory>('karisik');

  // Game Phase
  const [phase, setPhase] = useState<Phase>('setup');

  // Player / Turn Management
  const [turnIndex, setTurnIndex] = useState<number>(0);
  const [questionIndex, setQuestionIndex] = useState<number>(0);

  // Questions Queue
  const [questions, setQuestions] = useState<OrderingQuestion[]>([]);
  const [currentOrder, setCurrentOrder] = useState<OrderingItem[]>([]);

  // Timer & Evaluation State
  const [timeLeft, setTimeLeft] = useState<number>(30);
  const [isChecked, setIsChecked] = useState<boolean>(false);
  const [isCorrect, setIsCorrect] = useState<boolean>(false);
  const [streakCount, setStreakCount] = useState<number>(0);

  // Drag & Drop State
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);

  // Score Tracking Refs
  const scoresRef = useRef<Record<string, number>>({});
  const correctCountRef = useRef<Record<string, number>>({});
  const isFinishedRef = useRef<boolean>(false);

  const totalQuestions = 10;
  const currentPlayer = players[turnIndex] || players[0];

  const handleStartGame = () => {
    const qList = getOrderingQuestions(selectedCategory, totalQuestions);
    setQuestions(qList);

    const initScores: Record<string, number> = {};
    const initCorrects: Record<string, number> = {};
    players.forEach((p) => {
      initScores[p.id] = 0;
      initCorrects[p.id] = 0;
    });

    scoresRef.current = initScores;
    correctCountRef.current = initCorrects;
    isFinishedRef.current = false;

    setQuestionIndex(0);
    setTurnIndex(0);
    setStreakCount(0);

    loadQuestion(qList[0]);

    if (mode === 'multi') {
      setPhase('pass-device');
    } else {
      setPhase('playing');
    }
  };

  const loadQuestion = (q: OrderingQuestion) => {
    if (!q) return;
    // Shuffle initial items
    const shuffled = [...q.items].sort(() => Math.random() - 0.5);
    setCurrentOrder(shuffled);
    setTimeLeft(30);
    setIsChecked(false);
    setIsCorrect(false);
  };

  // Timer Loop
  useEffect(() => {
    if (phase !== 'playing' || isChecked) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          evaluateOrder(true); // Auto evaluate on timeout
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [phase, isChecked]);

  // Reorder controls (Up / Down buttons)
  const moveItem = (index: number, direction: 'up' | 'down') => {
    if (isChecked || phase !== 'playing') return;

    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= currentOrder.length) return;

    const updated = [...currentOrder];
    const temp = updated[index];
    updated[index] = updated[targetIdx];
    updated[targetIdx] = temp;

    setCurrentOrder(updated);
    playBeepSound(400, 0.1, soundEnabled);
  };

  // Drag and Drop handlers
  const handleDragStart = (idx: number) => {
    if (isChecked || phase !== 'playing') return;
    setDraggedIdx(idx);
  };

  const handleDragOver = (e: React.DragEvent, targetIdx: number) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === targetIdx || isChecked) return;

    const updated = [...currentOrder];
    const itemToMove = updated[draggedIdx];
    updated.splice(draggedIdx, 1);
    updated.splice(targetIdx, 0, itemToMove);

    setDraggedIdx(targetIdx);
    setCurrentOrder(updated);
  };

  const handleDragEnd = () => {
    setDraggedIdx(null);
  };

  // Evaluate Answer ONCE
  const evaluateOrder = (isTimeout: boolean = false) => {
    if (isChecked || phase !== 'playing') return;
    setIsChecked(true);

    const currentQ = questions[questionIndex];
    const userLabels = currentOrder.map((item) => item.label);
    const targetLabels = currentQ.correctOrder;

    const checkResult = userLabels.every((val, idx) => val === targetLabels[idx]);
    setIsCorrect(checkResult);

    if (checkResult && !isTimeout) {
      playFanfareSound(soundEnabled);
      triggerVibration([20, 30], vibrationEnabled);

      let pts = 100; // Base score
      const speedBonus = timeLeft * 2; // Speed bonus (+2 pts/sec)
      pts += speedBonus;

      const newStreak = streakCount + 1;
      setStreakCount(newStreak);
      if (newStreak % 3 === 0) {
        pts += 100; // Flawless streak bonus
      }

      scoresRef.current[currentPlayer.id] = (scoresRef.current[currentPlayer.id] || 0) + pts;
      correctCountRef.current[currentPlayer.id] = (correctCountRef.current[currentPlayer.id] || 0) + 1;
    } else {
      playBeepSound(150, 0.3, soundEnabled);
      triggerVibration(40, vibrationEnabled);
      setStreakCount(0);
    }

    setPhase('explanation');
  };

  const handleNextQuestion = () => {
    if (mode === 'single') {
      if (questionIndex < questions.length - 1) {
        const nextQIdx = questionIndex + 1;
        setQuestionIndex(nextQIdx);
        loadQuestion(questions[nextQIdx]);
        setPhase('playing');
      } else {
        setPhase('finished');
        finishWholeGame();
      }
    } else {
      // Multiplayer Mode: Switch player or advance question
      const nextTurnIdx = (turnIndex + 1) % players.length;
      if (nextTurnIdx === 0) {
        // Full round done
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
      } else {
        setTurnIndex(nextTurnIdx);
        loadQuestion(questions[questionIndex]);
        setPhase('pass-device');
      }
    }
  };

  const finishWholeGame = () => {
    if (isFinishedRef.current) return;
    isFinishedRef.current = true;

    const results = players.map((p) => ({
      playerId: p.id,
      score: scoresRef.current[p.id] || 0,
      stats: {
        'Doğru Sıralama': `${correctCountRef.current[p.id] || 0} / ${totalQuestions}`,
        'Toplam Skor': scoresRef.current[p.id] || 0,
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
            <Layers className="w-8 h-8 stroke-[2.5]" />
          </div>
          <h2 className="text-2xl font-black text-white">Doğru Sıraya Koy</h2>
          <p className="text-xs text-slate-400 font-medium">Tarih, Boyut ve Miktar Sıralaması</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 space-y-4 shadow-xl">
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-300 uppercase tracking-wider">Kategori Seçin</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {ORDERING_CATEGORIES.map((cat) => (
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
          <span>Yarışmayı Başlat</span>
        </button>
      </div>
    );
  }

  // RENDER PASS DEVICE (Multiplayer)
  if (phase === 'pass-device') {
    return (
      <PassDeviceScreen
        activeName={currentPlayer.name}
        activeColor={currentPlayer.color}
        roundInfo={`Soru ${questionIndex + 1}/${totalQuestions}`}
        onReady={() => setPhase('playing')}
      />
    );
  }

  // RENDER PLAYING / EXPLANATION
  const currentQ = questions[questionIndex];

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 text-white p-4 select-none overflow-hidden space-y-3">
      {/* Header Info Bar */}
      <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-2xl px-4 py-2.5 shadow-md">
        <div className="flex items-center gap-2">
          <span style={{ backgroundColor: currentPlayer.color }} className="w-3 h-3 rounded-full" />
          <span style={{ color: currentPlayer.color }} className="font-extrabold text-xs">
            {currentPlayer.name} (Puan: {scoresRef.current[currentPlayer.id] || 0})
          </span>
        </div>

        <div className="flex items-center gap-3 text-xs font-black">
          <span className="text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-0.5 rounded-full">
            Soru: {questionIndex + 1} / {totalQuestions}
          </span>
          <span className={`px-2.5 py-0.5 rounded-full border ${timeLeft <= 5 ? 'bg-rose-500/20 text-rose-400 border-rose-500/30' : 'bg-slate-800 text-cyan-400 border-slate-700'}`}>
            ⏱️ {timeLeft}s
          </span>
        </div>
      </div>

      {/* Main Pitch Question Box */}
      <div className="flex-1 bg-gradient-to-b from-slate-900 via-slate-900/90 to-slate-950 border-2 border-slate-800 rounded-3xl p-4 flex flex-col justify-between shadow-2xl overflow-y-auto space-y-3">
        {/* Question Prompt Header */}
        <div className="text-center space-y-1 bg-slate-950/80 border border-slate-800 rounded-2xl p-3">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-800 px-2.5 py-0.5 rounded-full border border-slate-700">
            {currentQ?.categoryName}
          </span>
          <h3 className="text-sm sm:text-base font-black text-amber-300 leading-snug">
            {currentQ?.prompt}
          </h3>
        </div>

        {/* Orderable Items Cards List */}
        <div className="space-y-2 my-auto">
          {currentOrder.map((item, idx) => (
            <div
              key={item.id}
              draggable={!isChecked}
              onDragStart={() => handleDragStart(idx)}
              onDragOver={(e) => handleDragOver(e, idx)}
              onDragEnd={handleDragEnd}
              className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                isChecked
                  ? isCorrect
                    ? 'bg-emerald-950/60 border-emerald-500/60 text-emerald-300'
                    : 'bg-slate-900 border-slate-800 text-slate-300'
                  : 'bg-slate-900 hover:bg-slate-850 border-slate-800 text-white cursor-grab active:cursor-grabbing'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center font-black text-xs text-cyan-400">
                  {idx + 1}
                </span>
                <span className="font-bold text-xs sm:text-sm">{item.label}</span>
              </div>

              {!isChecked && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => moveItem(idx, 'up')}
                    disabled={idx === 0}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-300"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => moveItem(idx, 'down')}
                    disabled={idx === currentOrder.length - 1}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-300"
                  >
                    <ArrowDown className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Explanation Card after check */}
        {phase === 'explanation' && (
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3 space-y-2 animate-scale-up">
            <div className="flex items-center gap-2 font-black text-xs">
              {isCorrect ? (
                <span className="text-emerald-400 flex items-center gap-1">
                  <Award className="w-4 h-4" /> TEBRİKLER! DOĞRU SIRALAMA
                </span>
              ) : (
                <span className="text-rose-400 flex items-center gap-1">
                  <HelpCircle className="w-4 h-4" /> YANLIŞ SIRALAMA
                </span>
              )}
            </div>

            <p className="text-xs text-slate-300 font-medium leading-relaxed">
              {currentQ.explanation}
            </p>
          </div>
        )}

        {/* Action Button */}
        {phase === 'playing' ? (
          <button
            onClick={() => evaluateOrder(false)}
            className="w-full py-3.5 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-sm shadow-xl shadow-cyan-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
            <span>Kontrol Et</span>
          </button>
        ) : (
          <button
            onClick={handleNextQuestion}
            className="w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <span>Sıradaki Soruya Geç</span>
          </button>
        )}
      </div>
    </div>
  );
};
