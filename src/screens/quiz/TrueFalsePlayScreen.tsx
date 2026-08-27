import React, { useState, useEffect, useRef } from 'react';
import { HelpCircle, CheckCircle2, XCircle } from 'lucide-react';
import type { Player } from '../../types/game';
import type { QuizCategoryId, ShuffledQuizQuestion } from '../../types/quiz';
import { quizService } from '../../services/quizService';
import { playBeepSound, playFanfareSound, triggerVibration } from '../../utils/audio';

interface TrueFalsePlayScreenProps {
  mode: 'single' | 'multi';
  categoryId: QuizCategoryId;
  players: Player[];
  onFinishQuiz: (results: { playerId: string; score: number; stats?: Record<string, number | string> }[]) => void;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
}

export const TrueFalsePlayScreen: React.FC<TrueFalsePlayScreenProps> = ({
  mode,
  categoryId,
  players,
  onFinishQuiz,
  soundEnabled,
  vibrationEnabled,
}) => {
  const [questions, setQuestions] = useState<ShuffledQuizQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(30);
  const [selectedOption, setSelectedOption] = useState<'Doğru' | 'Yanlış' | null>(null);
  const [isAnswerLocked, setIsAnswerLocked] = useState<boolean>(false);

  // Multi player secret selection state
  const [multiSelections, setMultiSelections] = useState<Record<string, 'Doğru' | 'Yanlış' | null>>({});

  const [playerScores, setPlayerScores] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    players.forEach((p) => (initial[p.id] = 0));
    return initial;
  });

  const [correctCount, setCorrectCount] = useState<number>(0);
  const [totalCount, setTotalCount] = useState<number>(0);

  const isFinishedRef = useRef<boolean>(false);
  const playerScoresRef = useRef<Record<string, number>>({});
  const correctCountRef = useRef<number>(0);
  const totalCountRef = useRef<number>(0);

  useEffect(() => {
    const initial: Record<string, number> = {};
    players.forEach((p) => (initial[p.id] = 0));
    playerScoresRef.current = initial;
  }, [players]);

  useEffect(() => {
    const loaded = quizService.getRandomQuestions(categoryId, 20);
    setQuestions(loaded);
  }, [categoryId]);

  // Timer Loop (Single Player 30s)
  useEffect(() => {
    if (isFinishedRef.current) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          finishGame();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleSelectTrueFalse = (choice: 'Doğru' | 'Yanlış', playerId?: string) => {
    if (isAnswerLocked || questions.length === 0 || isFinishedRef.current) return;

    const currentQ = questions[currentIdx];
    const isCorrectOptionIndex = currentQ.shuffledCorrectIndex;
    const correctText = currentQ.shuffledOptions[isCorrectOptionIndex];

    const isStatementTrue = correctText.toLowerCase().includes('doğru') || isCorrectOptionIndex === 0;
    const userIsCorrect = (choice === 'Doğru' && isStatementTrue) || (choice === 'Yanlış' && !isStatementTrue);

    if (mode === 'single') {
      setSelectedOption(choice);
      setIsAnswerLocked(true);
      const nextTotal = totalCountRef.current + 1;
      totalCountRef.current = nextTotal;
      setTotalCount(nextTotal);

      if (userIsCorrect) {
        playFanfareSound(soundEnabled);
        triggerVibration([20, 30], vibrationEnabled);
        const nextCorrect = correctCountRef.current + 1;
        correctCountRef.current = nextCorrect;
        setCorrectCount(nextCorrect);

        const newScore = (playerScoresRef.current[players[0].id] || 0) + 100;
        playerScoresRef.current[players[0].id] = newScore;
        setPlayerScores((prev) => ({ ...prev, [players[0].id]: newScore }));
      } else {
        playBeepSound(200, 0.3, soundEnabled);
        triggerVibration(40, vibrationEnabled);
      }

      setTimeout(() => {
        setSelectedOption(null);
        setIsAnswerLocked(false);
        setCurrentIdx((prev) => (prev + 1) % questions.length);
      }, 1200);
    } else if (playerId) {
      const updated = { ...multiSelections, [playerId]: choice };
      setMultiSelections(updated);

      if (Object.keys(updated).length >= players.length) {
        setIsAnswerLocked(true);
        playFanfareSound(soundEnabled);

        players.forEach((p) => {
          const pChoice = updated[p.id];
          const pIsCorrect = (pChoice === 'Doğru' && isStatementTrue) || (pChoice === 'Yanlış' && !isStatementTrue);
          if (pIsCorrect) {
            const newScore = (playerScoresRef.current[p.id] || 0) + 100;
            playerScoresRef.current[p.id] = newScore;
            setPlayerScores((prev) => ({ ...prev, [p.id]: newScore }));
          }
        });

        setTimeout(() => {
          setMultiSelections({});
          setIsAnswerLocked(false);
          setCurrentIdx((prev) => (prev + 1) % questions.length);
        }, 2000);
      }
    }
  };

  const finishGame = () => {
    if (isFinishedRef.current) return;
    isFinishedRef.current = true;

    const results = players.map((p) => {
      const accuracy = totalCountRef.current > 0 ? Math.round((correctCountRef.current / totalCountRef.current) * 100) : 0;
      return {
        playerId: p.id,
        score: playerScoresRef.current[p.id] || 0,
        stats: {
          'Doğru Sayısı': correctCountRef.current,
          'Doğruluk Oranı': `%${accuracy}`,
        },
      };
    });

    onFinishQuiz(results);
  };

  const currentQuestion = questions[currentIdx];

  if (!currentQuestion) return null;

  return (
    <div className="relative flex-1 flex flex-col h-full w-full bg-slate-950 text-white select-none overflow-hidden touch-none p-4">
      {/* Header */}
      <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3 shadow-md mb-2">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-emerald-400" aria-hidden="true" />
          <span className="font-extrabold text-sm text-white">Doğru mu, Yanlış mı?</span>
        </div>

        <div className="flex items-center gap-3 text-xs font-black">
          <span className="text-emerald-400">
            Doğru: {correctCount}/{totalCount} (Skor: {playerScores[players[0]?.id] || 0})
          </span>
          <span className="text-amber-400 bg-amber-400/10 border border-amber-400/20 px-3 py-1 rounded-full">
            Süre: {timeLeft}s
          </span>
        </div>
      </div>

      {/* Main Statement Card */}
      <div className="flex-1 flex flex-col justify-around my-auto">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-center space-y-4 shadow-2xl my-auto">
          <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 block">
            BİLGİ CÜMLESİ
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-white leading-relaxed">
            "{currentQuestion.question}"
          </h2>
        </div>

        {/* Action Buttons */}
        {mode === 'single' ? (
          <div className="grid grid-cols-2 gap-4 pt-2">
            <button
              onClick={() => handleSelectTrueFalse('Yanlış')}
              disabled={isAnswerLocked}
              className={`py-5 rounded-2xl font-black text-lg flex items-center justify-center gap-2 shadow-xl border transition-all active:scale-95 ${
                selectedOption === 'Yanlış'
                  ? 'bg-rose-600 border-white text-white'
                  : 'bg-rose-600/20 border-rose-500 text-rose-400 hover:bg-rose-600/30'
              }`}
            >
              <XCircle className="w-6 h-6 stroke-[3]" aria-hidden="true" /> YANLIŞ
            </button>
            <button
              onClick={() => handleSelectTrueFalse('Doğru')}
              disabled={isAnswerLocked}
              className={`py-5 rounded-2xl font-black text-lg flex items-center justify-center gap-2 shadow-xl border transition-all active:scale-95 ${
                selectedOption === 'Doğru'
                  ? 'bg-emerald-500 border-white text-slate-950'
                  : 'bg-emerald-500/20 border-emerald-500 text-emerald-400 hover:bg-emerald-500/30'
              }`}
            >
              <CheckCircle2 className="w-6 h-6 stroke-[3]" aria-hidden="true" /> DOĞRU
            </button>
          </div>
        ) : (
          /* Multiplayer secret buttons */
          <div className="space-y-2 pt-2">
            <span className="text-xs text-slate-400 font-bold block text-center">
              Gizli Seçim Yapın:
            </span>
            <div className="grid grid-cols-2 gap-2">
              {players.map((p) => (
                <div key={p.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-3 text-center space-y-2">
                  <span className="text-xs font-black" style={{ color: p.color }}>
                    {p.name}
                  </span>
                  <div className="grid grid-cols-2 gap-1">
                    <button
                      onClick={() => handleSelectTrueFalse('Yanlış', p.id)}
                      disabled={isAnswerLocked || multiSelections[p.id] !== undefined}
                      className="py-2.5 rounded-xl bg-rose-600/20 border border-rose-500/40 text-rose-400 text-xs font-black active:scale-95 disabled:opacity-40"
                    >
                      Y
                    </button>
                    <button
                      onClick={() => handleSelectTrueFalse('Doğru', p.id)}
                      disabled={isAnswerLocked || multiSelections[p.id] !== undefined}
                      className="py-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-xs font-black active:scale-95 disabled:opacity-40"
                    >
                      D
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
