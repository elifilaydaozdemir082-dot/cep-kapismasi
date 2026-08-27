import React, { useState, useEffect, useRef } from 'react';
import { Grid, Lightbulb, Check, RotateCcw } from 'lucide-react';
import type { Player } from '../types/game';
import { wordService } from '../services/wordService';
import { shuffleLetters, toTurkishUpper } from '../utils/wordUtils';
import { playBeepSound, playFanfareSound, playTapSound, triggerVibration } from '../utils/audio';

interface AnagramGameProps {
  mode: 'single' | 'multi';
  players: Player[];
  onFinishGame: (results: { playerId: string; score: number; stats?: Record<string, number | string> }[]) => void;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
}

interface LetterCard {
  id: number;
  letter: string;
  isUsed: boolean;
}

export const AnagramGame: React.FC<AnagramGameProps> = ({
  players,
  onFinishGame,
  soundEnabled,
  vibrationEnabled,
}) => {
  const [currentPlayerIdx] = useState<number>(0);
  const [targetWord, setTargetWord] = useState<string>('');
  const [wordHint, setWordHint] = useState<string>('');
  const [showHint, setShowHint] = useState<boolean>(false);

  const [availableCards, setAvailableCards] = useState<LetterCard[]>([]);
  const [selectedCards, setSelectedCards] = useState<LetterCard[]>([]);

  // Timers & Stats
  const [timeLeft, setTimeLeft] = useState<number>(60);
  const [wordsSolved, setWordsSolved] = useState<number>(0);
  const [feedback, setFeedback] = useState<string | null>(null);

  const isFinishedRef = useRef<boolean>(false);
  const wordsSolvedRef = useRef<number>(0);

  const currentPlayer = players[currentPlayerIdx] || players[0];

  useEffect(() => {
    loadNewWord();
  }, [currentPlayerIdx]);

  const loadNewWord = () => {
    if (isFinishedRef.current) return;
    const item = wordService.getRandomWord();
    const word = item ? toTurkishUpper(item.word) : 'KALEM';
    setTargetWord(word);
    setWordHint(item?.hint || 'Günlük Hayat Nesnesi');
    setShowHint(false);

    const shuffled = shuffleLetters(word);
    const cards: LetterCard[] = shuffled.map((letter, idx) => ({
      id: idx + Math.random(),
      letter,
      isUsed: false,
    }));

    setAvailableCards(cards);
    setSelectedCards([]);
  };

  // Timer loop
  useEffect(() => {
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

  const handleSelectCard = (card: LetterCard) => {
    if (card.isUsed || isFinishedRef.current) return;
    playTapSound(soundEnabled);
    triggerVibration(10, vibrationEnabled);

    setAvailableCards((prev) =>
      prev.map((c) => (c.id === card.id ? { ...c, isUsed: true } : c))
    );
    setSelectedCards((prev) => [...prev, card]);
  };

  const handleDeselectCard = (card: LetterCard) => {
    if (isFinishedRef.current) return;
    playTapSound(soundEnabled);
    setSelectedCards((prev) => prev.filter((c) => c.id !== card.id));
    setAvailableCards((prev) =>
      prev.map((c) => (c.id === card.id ? { ...c, isUsed: false } : c))
    );
  };

  const handleClear = () => {
    if (isFinishedRef.current) return;
    playBeepSound(300, 0.05, soundEnabled);
    setSelectedCards([]);
    setAvailableCards((prev) => prev.map((c) => ({ ...c, isUsed: false })));
  };

  const handleCheck = () => {
    if (isFinishedRef.current) return;
    const currentAnswer = selectedCards.map((c) => c.letter).join('');

    if (currentAnswer === targetWord) {
      playFanfareSound(soundEnabled);
      triggerVibration([20, 30], vibrationEnabled);
      const nextSolved = wordsSolvedRef.current + 1;
      wordsSolvedRef.current = nextSolved;
      setWordsSolved(nextSolved);
      setFeedback('DOĞRU CEVAP!');

      setTimeout(() => {
        setFeedback(null);
        loadNewWord();
      }, 700);
    } else {
      playBeepSound(200, 0.2, soundEnabled);
      triggerVibration(40, vibrationEnabled);
      setFeedback('HATALI CEVAP!');
      setTimeout(() => setFeedback(null), 700);
    }
  };

  const finishGame = () => {
    if (isFinishedRef.current) return;
    isFinishedRef.current = true;

    onFinishGame([
      {
        playerId: currentPlayer.id,
        score: wordsSolvedRef.current,
        stats: {
          'Çözülen Kelime': wordsSolvedRef.current,
        },
      },
    ]);
  };

  return (
    <div className="relative flex-1 flex flex-col h-full w-full bg-slate-950 text-white select-none overflow-hidden touch-none p-4">
      {/* Header */}
      <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3 shadow-md mb-2">
        <div className="flex items-center gap-2">
          <Grid className="w-5 h-5 text-cyan-400" aria-hidden="true" />
          <span className="font-extrabold text-sm text-white">Karışık Harfler</span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-black text-amber-400 bg-amber-400/10 border border-amber-400/20 px-3 py-1 rounded-full">
            Süre: {timeLeft}s
          </span>
          <span className="text-xs font-black text-cyan-400">
            Çözülen: {wordsSolved}
          </span>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-40 bg-slate-950/95 border border-cyan-500 px-5 py-2 rounded-full font-black text-sm text-amber-400 shadow-2xl animate-scale-up">
          {feedback}
        </div>
      )}

      {/* Target Word Slots */}
      <div className="flex-1 flex flex-col justify-around my-auto">
        <div className="text-center space-y-2">
          {showHint ? (
            <p className="text-xs font-bold text-amber-300 animate-fade-in bg-amber-400/10 border border-amber-400/30 px-4 py-1.5 rounded-full inline-block">
              İpucu: {wordHint}
            </p>
          ) : (
            <button
              onClick={() => setShowHint(true)}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs font-bold text-cyan-400 hover:border-cyan-500 active:scale-95"
            >
              <Lightbulb className="w-4 h-4" aria-hidden="true" /> İpucu Göster
            </button>
          )}

          {/* Selected Answer Letter Slots */}
          <div className="flex justify-center items-center gap-2 flex-wrap py-4 min-h-[70px]">
            {Array.from({ length: targetWord.length }).map((_, idx) => {
              const card = selectedCards[idx];
              return (
                <button
                  key={idx}
                  onClick={() => card && handleDeselectCard(card)}
                  className={`w-12 h-14 rounded-2xl border-2 flex items-center justify-center font-black text-2xl shadow-xl transition-all ${
                    card
                      ? 'bg-cyan-500 border-white text-slate-950 animate-scale-up'
                      : 'bg-slate-950 border-slate-800 text-transparent'
                  }`}
                >
                  {card ? card.letter : ''}
                </button>
              );
            })}
          </div>
        </div>

        {/* Touchable Scrambled Letter Cards Pool */}
        <div className="flex justify-center items-center gap-2 flex-wrap max-w-xs mx-auto py-4">
          {availableCards.map((card) => (
            <button
              key={card.id}
              onClick={() => handleSelectCard(card)}
              disabled={card.isUsed}
              className={`w-12 h-14 rounded-2xl font-black text-2xl shadow-lg border-2 transition-all active:scale-90 ${
                card.isUsed
                  ? 'bg-slate-900 border-slate-800 text-slate-700 opacity-30 pointer-events-none'
                  : 'bg-slate-900 border-cyan-500/80 text-white hover:bg-slate-800'
              }`}
            >
              {card.letter}
            </button>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-2 gap-3 pt-2">
        <button
          onClick={handleClear}
          className="py-4 rounded-2xl bg-slate-800 border border-slate-700 text-white font-black text-sm flex items-center justify-center gap-2 active:scale-95 transition-all shadow-md"
        >
          <RotateCcw className="w-5 h-5" aria-hidden="true" /> Temizle
        </button>
        <button
          onClick={handleCheck}
          className="py-4 rounded-2xl bg-cyan-500 text-slate-950 font-black text-sm flex items-center justify-center gap-2 active:scale-95 transition-all shadow-xl"
        >
          <Check className="w-5 h-5 stroke-[3]" aria-hidden="true" /> Kontrol Et
        </button>
      </div>
    </div>
  );
};
