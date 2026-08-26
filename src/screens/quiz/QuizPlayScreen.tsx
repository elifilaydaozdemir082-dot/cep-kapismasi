import React, { useState, useEffect, useRef } from 'react';
import { Trophy, HelpCircle, Flame } from 'lucide-react';
import type { DifficultyLevel, Player } from '../../types/game';
import type { QuizCategoryId, QuizGameMode, QuizJokersState, ShuffledQuizQuestion } from '../../types/quiz';
import { quizService } from '../../services/quizService';
import { QuizQuestionCard } from '../../components/quiz/QuizQuestionCard';
import { QuizJokersBar } from '../../components/quiz/QuizJokersBar';
import { FastFingerBuzzer } from '../../components/quiz/FastFingerBuzzer';
import { RiskFinalWagerModal } from '../../components/quiz/RiskFinalWagerModal';
import { playBeepSound, playFanfareSound, triggerVibration } from '../../utils/audio';

interface QuizPlayScreenProps {
  mode: 'single' | 'multi';
  quizMode: QuizGameMode;
  categoryId: QuizCategoryId;
  difficulty: DifficultyLevel;
  questionCount: number;
  enableRiskFinal: boolean;
  players: Player[];
  onFinishQuiz: (results: { playerId: string; score: number; stats?: Record<string, number | string> }[]) => void;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
}

export const QuizPlayScreen: React.FC<QuizPlayScreenProps> = ({
  mode,
  quizMode,
  categoryId,
  difficulty,
  questionCount,
  enableRiskFinal,
  players,
  onFinishQuiz,
  soundEnabled,
  vibrationEnabled,
}) => {
  const [questions, setQuestions] = useState<ShuffledQuizQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(null);
  const [isAnswerLocked, setIsAnswerLocked] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<number>(15);

  // Stats
  const [playerScores, setPlayerScores] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    players.forEach((p) => (initial[p.id] = 0));
    return initial;
  });

  const [playerStats, setPlayerStats] = useState<
    Record<string, { correct: number; total: number; currentStreak: number; maxStreak: number; responseTimes: number[] }>
  >(() => {
    const initial: Record<string, any> = {};
    players.forEach((p) => {
      initial[p.id] = { correct: 0, total: 0, currentStreak: 0, maxStreak: 0, responseTimes: [] };
    });
    return initial;
  });

  // Single player Jokers
  const [jokersState, setJokersState] = useState<QuizJokersState>({
    fiftyFiftyUsed: false,
    timeFreezeUsed: false,
    swapQuestionUsed: false,
  });

  // Hızlı Parmak (Fast Finger) Multiplayer state
  const [activeBuzzerPlayerId, setActiveBuzzerPlayerId] = useState<string | null>(null);
  const [eliminatedBuzzerPlayerIds, setEliminatedBuzzerPlayerIds] = useState<string[]>([]);

  // Riskli Final State
  const [showRiskWagerModal, setShowRiskWagerModal] = useState<boolean>(false);
  const [playerWagers, setPlayerWagers] = useState<Record<string, number>>({});

  const [feedback, setFeedback] = useState<string | null>(null);
  const isFinishedRef = useRef<boolean>(false);
  const questionStartTimeRef = useRef<number>(performance.now());

  const currentPlayer = players[0];

  // Load questions on mount
  useEffect(() => {
    const loaded = quizService.getRandomQuestions(categoryId, questionCount, difficulty);
    setQuestions(loaded);
    questionStartTimeRef.current = performance.now();
  }, [categoryId, questionCount, difficulty]);

  // Question Timer loop
  useEffect(() => {
    if (isAnswerLocked || questions.length === 0 || showRiskWagerModal) return;

    const timerMs = quizMode === 'fast-finger' && activeBuzzerPlayerId ? 500 : 1000;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleTimeOut();
          return 0;
        }
        return prev - 1;
      });
    }, timerMs);

    return () => clearInterval(interval);
  }, [isAnswerLocked, questions, activeBuzzerPlayerId, quizMode, showRiskWagerModal]);

  const handleTimeOut = () => {
    if (quizMode === 'fast-finger' && activeBuzzerPlayerId) {
      playBeepSound(200, 0.2, soundEnabled);
      setEliminatedBuzzerPlayerIds((prev) => [...prev, activeBuzzerPlayerId]);
      setActiveBuzzerPlayerId(null);
      setTimeLeft(15);
    } else {
      playBeepSound(200, 0.3, soundEnabled);
      setIsAnswerLocked(true);

      setTimeout(() => advanceToNextQuestion(), 1500);
    }
  };

  const handleSelectOption = (index: number) => {
    if (isAnswerLocked || questions.length === 0) return;

    const currentQ = questions[currentIdx];
    setSelectedOptionIndex(index);
    setIsAnswerLocked(true);

    const isCorrect = index === currentQ.shuffledCorrectIndex;
    const responseTimeSec = (performance.now() - questionStartTimeRef.current) / 1000;

    const activePId = quizMode === 'fast-finger' && activeBuzzerPlayerId ? activeBuzzerPlayerId : currentPlayer.id;

    if (isCorrect) {
      playFanfareSound(soundEnabled);
      triggerVibration([20, 30], vibrationEnabled);

      const pStat = playerStats[activePId] || { correct: 0, total: 0, currentStreak: 0, maxStreak: 0, responseTimes: [] };
      const newStreak = pStat.currentStreak + 1;

      let earned = quizService.calculateSpeedBonusScore(100, timeLeft);
      if (newStreak % 5 === 0) {
        earned += 250;
        setFeedback('5 DOĞRU SERİSİ BONUSU! (+250 Puan)');
      }

      if (currentIdx === questions.length - 1 && playerWagers[activePId] !== undefined) {
        earned += playerWagers[activePId];
        setFeedback(`RİSKLİ FİNAL KAZANILDI! (+${playerWagers[activePId]} Puan)`);
      }

      setPlayerScores((prev) => ({
        ...prev,
        [activePId]: prev[activePId] + earned,
      }));

      setPlayerStats((prev) => ({
        ...prev,
        [activePId]: {
          correct: pStat.correct + 1,
          total: pStat.total + 1,
          currentStreak: newStreak,
          maxStreak: Math.max(pStat.maxStreak, newStreak),
          responseTimes: [...pStat.responseTimes, responseTimeSec],
        },
      }));
    } else {
      playBeepSound(200, 0.3, soundEnabled);
      triggerVibration(40, vibrationEnabled);

      const pStat = playerStats[activePId] || { correct: 0, total: 0, currentStreak: 0, maxStreak: 0, responseTimes: [] };

      if (currentIdx === questions.length - 1 && playerWagers[activePId] !== undefined) {
        const wager = playerWagers[activePId];
        setPlayerScores((prev) => ({
          ...prev,
          [activePId]: Math.max(0, prev[activePId] - wager),
        }));
        setFeedback(`RİSKLİ FİNAL KAYBEDİLDİ! (-${wager} Puan)`);
      }

      setPlayerStats((prev) => ({
        ...prev,
        [activePId]: {
          ...pStat,
          total: pStat.total + 1,
          currentStreak: 0,
          responseTimes: [...pStat.responseTimes, responseTimeSec],
        },
      }));

      if (quizMode === 'fast-finger') {
        setEliminatedBuzzerPlayerIds((prev) => [...prev, activePId]);
      }
    }

    setTimeout(() => {
      setFeedback(null);
      advanceToNextQuestion();
    }, 2200);
  };

  const advanceToNextQuestion = () => {
    setSelectedOptionIndex(null);
    setIsAnswerLocked(false);
    setActiveBuzzerPlayerId(null);
    setEliminatedBuzzerPlayerIds([]);
    setTimeLeft(15);
    questionStartTimeRef.current = performance.now();

    const nextIdx = currentIdx + 1;

    if (enableRiskFinal && nextIdx === questions.length - 1 && Object.keys(playerWagers).length === 0) {
      setShowRiskWagerModal(true);
      setCurrentIdx(nextIdx);
      return;
    }

    if (nextIdx < questions.length) {
      setCurrentIdx(nextIdx);
    } else {
      finishQuizGame();
    }
  };

  const handleUseFiftyFifty = () => {
    if (jokersState.fiftyFiftyUsed || questions.length === 0) return;
    setJokersState((prev) => ({ ...prev, fiftyFiftyUsed: true }));
    playBeepSound(600, 0.1, soundEnabled);

    const updatedQ = quizService.applyFiftyFiftyJoker(questions[currentIdx]);
    setQuestions((prev) => prev.map((q, idx) => (idx === currentIdx ? updatedQ : q)));
  };

  const handleUseTimeFreeze = () => {
    if (jokersState.timeFreezeUsed) return;
    setJokersState((prev) => ({ ...prev, timeFreezeUsed: true }));
    playFanfareSound(soundEnabled);
    setTimeLeft((t) => t + 5);
  };

  const handleUseSwapQuestion = () => {
    if (jokersState.swapQuestionUsed) return;
    setJokersState((prev) => ({ ...prev, swapQuestionUsed: true }));
    playBeepSound(600, 0.1, soundEnabled);

    const newQuestion = quizService.getRandomQuestions(categoryId, 1, difficulty, [questions[currentIdx].id]);
    if (newQuestion.length > 0) {
      setQuestions((prev) => prev.map((q, idx) => (idx === currentIdx ? newQuestion[0] : q)));
      setTimeLeft(15);
      questionStartTimeRef.current = performance.now();
    }
  };

  const handlePressBuzzer = (pId: string) => {
    playBeepSound(800, 0.1, soundEnabled);
    triggerVibration(15, vibrationEnabled);
    setActiveBuzzerPlayerId(pId);
    setTimeLeft(5);
  };

  const finishQuizGame = () => {
    if (isFinishedRef.current) return;
    isFinishedRef.current = true;

    const results = players.map((p) => {
      const pStat = playerStats[p.id] || { correct: 0, total: 0, responseTimes: [], maxStreak: 0 };
      const accuracy = pStat.total > 0 ? Math.round((pStat.correct / pStat.total) * 100) : 0;
      const avgTime = pStat.responseTimes.length > 0
        ? (pStat.responseTimes.reduce((a, b) => a + b, 0) / pStat.responseTimes.length).toFixed(1)
        : '0.0';

      return {
        playerId: p.id,
        score: playerScores[p.id] || 0,
        stats: {
          'Doğruluk Oranı': `${accuracy}%`,
          'Ort. Cevap Süresi': `${avgTime}s`,
          'En Uzun Seri': pStat.maxStreak,
        },
      };
    });

    onFinishQuiz(results);
  };

  const currentQuestion = questions[currentIdx];

  if (!currentQuestion) {
    return (
      <div className="flex-1 flex items-center justify-center text-slate-400 font-bold">
        Sorular Yükleniyor...
      </div>
    );
  }

  return (
    <div className="relative flex-1 flex flex-col h-full w-full bg-slate-950 text-white select-none overflow-hidden touch-none p-4">
      {/* Header Bar */}
      <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3 shadow-md mb-2">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-indigo-400" aria-hidden="true" />
          <span className="font-extrabold text-sm text-white">Bilgi Yarışması</span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-black text-amber-400 bg-amber-400/10 border border-amber-400/20 px-3 py-1 rounded-full flex items-center gap-1">
            <Trophy className="w-3.5 h-3.5" aria-hidden="true" /> Skor: {playerScores[currentPlayer.id]}
          </span>
        </div>
      </div>

      {/* Streak Badge */}
      {playerStats[currentPlayer.id]?.currentStreak > 1 && (
        <div className="flex items-center justify-center gap-1.5 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black text-xs px-4 py-1 rounded-full mx-auto mb-2 shadow-lg animate-bounce">
          <Flame className="w-4 h-4 fill-current text-slate-950" aria-hidden="true" />
          <span>{playerStats[currentPlayer.id].currentStreak} DOĞRU SERİSİ! (Hız Bonusu Katlandı)</span>
        </div>
      )}

      {/* Feedback Banner */}
      {feedback && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-40 bg-slate-950/95 border border-amber-400 px-5 py-2 rounded-full font-black text-xs text-amber-400 shadow-2xl animate-scale-up">
          {feedback}
        </div>
      )}

      {/* Risk Final Wager Modal */}
      {showRiskWagerModal && (
        <RiskFinalWagerModal
          players={players}
          onConfirmWagers={(wagers) => {
            setPlayerWagers(wagers);
            setShowRiskWagerModal(false);
          }}
        />
      )}

      {/* Question Card */}
      <QuizQuestionCard
        question={currentQuestion}
        questionNumber={currentIdx + 1}
        totalQuestions={questions.length}
        selectedOptionIndex={selectedOptionIndex}
        onSelectOption={handleSelectOption}
        isAnswerLocked={isAnswerLocked}
        timeLeft={timeLeft}
      />

      {/* Single Player Jokers Bar */}
      {mode === 'single' && quizMode === 'classic' && (
        <div className="pt-2">
          <QuizJokersBar
            jokersState={jokersState}
            onUseFiftyFifty={handleUseFiftyFifty}
            onUseTimeFreeze={handleUseTimeFreeze}
            onUseSwapQuestion={handleUseSwapQuestion}
            isAnswerLocked={isAnswerLocked}
          />
        </div>
      )}

      {/* Multiplayer Fast Finger Buzzer */}
      {mode === 'multi' && quizMode === 'fast-finger' && !isAnswerLocked && (
        <FastFingerBuzzer
          players={players}
          activeBuzzerPlayerId={activeBuzzerPlayerId}
          eliminatedPlayerIds={eliminatedBuzzerPlayerIds}
          onPressBuzzer={handlePressBuzzer}
        />
      )}
    </div>
  );
};
