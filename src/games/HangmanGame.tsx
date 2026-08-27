import React, { useState, useEffect, useRef } from 'react';
import { Bot, BatteryCharging, Lightbulb, Lock, Eye, EyeOff } from 'lucide-react';
import type { Player } from '../types/game';
import { wordService } from '../services/wordService';
import { TURKISH_ALPHABET, sanitizeWord, toTurkishUpper } from '../utils/wordUtils';
import { playBeepSound, playFanfareSound, playTapSound, triggerVibration } from '../utils/audio';

interface HangmanGameProps {
  mode: 'single' | 'multi';
  players: Player[];
  onFinishGame: (results: { playerId: string; score: number; stats?: Record<string, number | string> }[]) => void;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
}

export const HangmanGame: React.FC<HangmanGameProps> = ({
  mode,
  players,
  onFinishGame,
  soundEnabled,
  vibrationEnabled,
}) => {
  const [currentPlayerIdx] = useState<number>(0);
  const [stage, setStage] = useState<'creator-input' | 'guessing' | 'round-result'>(
    mode === 'multi' ? 'creator-input' : 'guessing'
  );

  // Secret word state
  const [secretWord, setSecretWord] = useState<string>('');
  const [wordCategory, setWordCategory] = useState<string>('');
  const [wordHint, setWordHint] = useState<string>('');
  const [showSecretInput, setShowSecretInput] = useState<boolean>(false);
  const [inputError, setInputError] = useState<string | null>(null);

  // Guessing state
  const [guessedLetters, setGuessedLetters] = useState<string[]>([]);
  const [wrongLetters, setWrongLetters] = useState<string[]>([]);
  const [hintUsed, setHintUsed] = useState<boolean>(false);

  // Single player score & streak
  const [singleScore, setSingleScore] = useState<number>(0);
  const [currentStreak, setCurrentStreak] = useState<number>(0);
  const [_wordsSolved, setWordsSolved] = useState<number>(0);

  const isFinishedRef = useRef<boolean>(false);
  const singleScoreRef = useRef<number>(0);
  const currentStreakRef = useRef<number>(0);
  const wordsSolvedRef = useRef<number>(0);

  const currentPlayer = players[currentPlayerIdx] || players[0];
  const maxWrongAttempts = 6;

  // Initialize word for Single Player
  useEffect(() => {
    if (mode === 'single') {
      startNewSinglePlayerWord();
    }
  }, [mode]);

  const startNewSinglePlayerWord = () => {
    if (isFinishedRef.current) return;
    const wordItem = wordService.getRandomWord();
    if (wordItem) {
      setSecretWord(toTurkishUpper(wordItem.word));
      setWordCategory(wordItem.categoryName);
      setWordHint(wordItem.hint || 'Gizli Türkçe kelime');
    } else {
      setSecretWord('BİLGİSAYAR');
      setWordCategory('Teknoloji');
      setWordHint('Veri işleyen elektronik cihaz.');
    }
    setGuessedLetters([]);
    setWrongLetters([]);
    setHintUsed(false);
    setStage('guessing');
  };

  // Keyboard Event Support
  useEffect(() => {
    if (stage !== 'guessing' || isFinishedRef.current) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const key = toTurkishUpper(e.key);
      if (TURKISH_ALPHABET.includes(key)) {
        guessLetter(key);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [stage, secretWord, guessedLetters, wrongLetters]);

  // Handle Multi Player Creator Word Input
  const handleCreatorSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isFinishedRef.current) return;
    const sanitized = sanitizeWord(secretWord);

    if (!sanitized || sanitized.length < 2) {
      setInputError('Lütfen en az 2 harfli bir Türkçe kelime girin!');
      return;
    }
    if (!/^[A-ZÇĞİÖŞÜ]+$/.test(sanitized)) {
      setInputError('Yalnızca Türkçe harfler kullanabilirsiniz!');
      return;
    }

    setSecretWord(sanitized);
    setWordCategory('Özel Kelime');
    setWordHint('Rakibinizin yazdığı gizli kelime');
    setGuessedLetters([]);
    setWrongLetters([]);
    setInputError(null);
    setStage('guessing');
  };

  const guessLetter = (letter: string) => {
    if (stage !== 'guessing' || isFinishedRef.current || guessedLetters.includes(letter) || wrongLetters.includes(letter)) {
      return;
    }

    if (secretWord.includes(letter)) {
      playTapSound(soundEnabled);
      triggerVibration(10, vibrationEnabled);
      const updated = [...guessedLetters, letter];
      setGuessedLetters(updated);

      const isComplete = secretWord.split('').every((char) => updated.includes(char));
      if (isComplete) {
        handleWordSolved();
      }
    } else {
      playBeepSound(250, 0.2, soundEnabled);
      triggerVibration(30, vibrationEnabled);
      const updatedWrong = [...wrongLetters, letter];
      setWrongLetters(updatedWrong);

      if (updatedWrong.length >= maxWrongAttempts) {
        handleWordFailed();
      }
    }
  };

  const handleWordSolved = () => {
    playFanfareSound(soundEnabled);
    triggerVibration([20, 30, 20], vibrationEnabled);

    if (mode === 'single') {
      const basePts = hintUsed ? 5 : 10;
      const earned = basePts + currentStreakRef.current * 2;

      const newScore = singleScoreRef.current + earned;
      const newStreak = currentStreakRef.current + 1;
      const newSolved = wordsSolvedRef.current + 1;

      singleScoreRef.current = newScore;
      currentStreakRef.current = newStreak;
      wordsSolvedRef.current = newSolved;

      setSingleScore(newScore);
      setWordsSolved(newSolved);
      setCurrentStreak(newStreak);
      setStage('round-result');
    } else {
      if (isFinishedRef.current) return;
      isFinishedRef.current = true;
      onFinishGame([
        {
          playerId: currentPlayer.id,
          score: 10 - wrongLetters.length,
          stats: {
            'Kalan Enerji': `${maxWrongAttempts - wrongLetters.length}/${maxWrongAttempts}`,
          },
        },
      ]);
    }
  };

  const handleWordFailed = () => {
    playBeepSound(150, 0.4, soundEnabled);
    triggerVibration(60, vibrationEnabled);

    if (mode === 'single') {
      currentStreakRef.current = 0;
      setCurrentStreak(0);
      setStage('round-result');
    } else {
      if (isFinishedRef.current) return;
      isFinishedRef.current = true;
      onFinishGame([{ playerId: currentPlayer.id, score: 0 }]);
    }
  };

  const finishSinglePlayerGame = () => {
    if (isFinishedRef.current) return;
    isFinishedRef.current = true;

    onFinishGame([
      {
        playerId: players[0].id,
        score: singleScoreRef.current,
        stats: {
          'Çözülen Kelime': wordsSolvedRef.current,
          'En Uzun Seri': currentStreakRef.current,
        },
      },
    ]);
  };

  const batteryPercent = Math.max(0, Math.round(((maxWrongAttempts - wrongLetters.length) / maxWrongAttempts) * 100));

  return (
    <div className="relative flex-1 flex flex-col h-full w-full bg-slate-950 text-white select-none overflow-hidden touch-none p-4">
      {/* Header Bar */}
      <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3 shadow-md mb-2">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-cyan-400" aria-hidden="true" />
          <span className="font-extrabold text-sm text-white">Kelimeyi Kurtar</span>
        </div>

        {mode === 'single' && (
          <div className="flex items-center gap-3 text-xs font-black text-amber-400">
            <span>Skor: {singleScore}</span>
            <span className="bg-amber-400/10 border border-amber-400/20 px-3 py-1 rounded-full">
              Seri: x{currentStreak}
            </span>
          </div>
        )}
      </div>

      {/* 1. CREATOR INPUT (Multiplayer Secret Word Setup) */}
      {stage === 'creator-input' && (
        <div className="flex-1 flex flex-col justify-center items-center text-center p-6 space-y-5 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl animate-scale-up">
          <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Lock className="w-8 h-8" aria-hidden="true" />
          </div>

          <div className="space-y-1">
            <span className="text-xs font-black uppercase text-slate-400 tracking-widest">
              GİZLİ KELİME OLUŞTURMA
            </span>
            <h2 className="text-2xl font-black text-white">
              Sıra <span style={{ color: currentPlayer.color }}>{currentPlayer.name}</span>'da!
            </h2>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              Diğer oyunculara göstermeden gizli kelimenizi yazın.
            </p>
          </div>

          <form onSubmit={handleCreatorSubmit} className="w-full max-w-xs space-y-3">
            <div className="relative">
              <input
                type={showSecretInput ? 'text' : 'password'}
                value={secretWord}
                onChange={(e) => setSecretWord(e.target.value)}
                placeholder="Gizli Kelime..."
                className="w-full py-3.5 px-4 rounded-2xl bg-slate-950 border border-slate-700 text-white font-black text-center text-lg focus:border-cyan-500 outline-none"
              />
              <button
                type="button"
                onClick={() => setShowSecretInput(!showSecretInput)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                aria-label="Şifre Görünürlüğü"
              >
                {showSecretInput ? <EyeOff className="w-5 h-5" aria-hidden="true" /> : <Eye className="w-5 h-5" aria-hidden="true" />}
              </button>
            </div>

            {inputError && (
              <p className="text-xs font-bold text-rose-500">{inputError}</p>
            )}

            <button
              type="submit"
              className="w-full py-4 rounded-2xl bg-cyan-500 text-slate-950 font-black text-sm shadow-xl active:scale-95 transition-transform"
            >
              Kelimeyi Onayla ve Başla
            </button>
          </form>
        </div>
      )}

      {/* 2. GUESSING STAGE */}
      {stage === 'guessing' && (
        <div className="flex-1 flex flex-col justify-between space-y-3">
          {/* Positive Robot Battery HUD */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 flex items-center justify-between shadow-md">
            <div className="flex items-center gap-3">
              <Bot className="w-8 h-8 text-cyan-400 animate-pulse" aria-hidden="true" />
              <div>
                <span className="text-[10px] font-black uppercase text-slate-400 block">
                  Robot Şarj Enerjisi
                </span>
                <div className="flex items-center gap-2">
                  <div className="w-28 h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                    <div
                      style={{ width: `${batteryPercent}%` }}
                      className={`h-full transition-all duration-300 ${
                        batteryPercent > 50 ? 'bg-emerald-400' : batteryPercent > 20 ? 'bg-amber-400' : 'bg-rose-500'
                      }`}
                    />
                  </div>
                  <span className="text-xs font-black text-white">{batteryPercent}%</span>
                </div>
              </div>
            </div>

            {wordHint && !hintUsed && (
              <button
                onClick={() => setHintUsed(true)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-400/20 border border-amber-400/30 text-amber-400 text-xs font-black active:scale-95"
              >
                <Lightbulb className="w-3.5 h-3.5" aria-hidden="true" /> İpucu Al
              </button>
            )}
          </div>

          {/* Category & Hint Display */}
          <div className="text-center space-y-1">
            <span className="inline-block px-3 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-cyan-400 font-extrabold text-[10px] uppercase tracking-wider">
              Kategori: {wordCategory}
            </span>
            {hintUsed && (
              <p className="text-xs font-bold text-amber-300 animate-fade-in">
                İpucu: {wordHint}
              </p>
            )}
          </div>

          {/* Hidden Word Revealer Letters */}
          <div className="flex justify-center items-center gap-2 flex-wrap my-auto py-4">
            {secretWord.split('').map((char, idx) => {
              const isRevealed = guessedLetters.includes(char);
              return (
                <div
                  key={idx}
                  className={`w-10 h-12 rounded-xl flex items-center justify-center font-black text-2xl border-2 transition-all shadow-md ${
                    isRevealed
                      ? 'bg-slate-900 border-cyan-400 text-cyan-300 animate-scale-up'
                      : 'bg-slate-950 border-slate-800 text-transparent'
                  }`}
                >
                  {isRevealed ? char : '_'}
                </div>
              );
            })}
          </div>

          {/* Wrong Guesses Display */}
          {wrongLetters.length > 0 && (
            <div className="flex items-center justify-center gap-2 text-xs font-bold text-rose-400 bg-rose-950/30 border border-rose-500/20 px-4 py-1.5 rounded-full mx-auto">
              <span>Hatalı Harfler ({wrongLetters.length}/{maxWrongAttempts}):</span>
              <span className="font-black text-rose-300">{wrongLetters.join(', ')}</span>
            </div>
          )}

          {/* Turkish Virtual Keyboard */}
          <div className="grid grid-cols-7 gap-1.5 pt-1">
            {TURKISH_ALPHABET.map((letter) => {
              const isUsed = guessedLetters.includes(letter) || wrongLetters.includes(letter);
              const isCorrect = guessedLetters.includes(letter);

              return (
                <button
                  key={letter}
                  onClick={() => guessLetter(letter)}
                  disabled={isUsed}
                  className={`h-11 rounded-xl font-black text-sm transition-all active:scale-90 border shadow ${
                    isUsed
                      ? isCorrect
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 opacity-60'
                        : 'bg-rose-500/20 border-rose-500 text-rose-500 opacity-40'
                      : 'bg-slate-900 border-slate-800 text-white hover:border-cyan-500'
                  }`}
                >
                  {letter}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. ROUND RESULT POPUP (Single Player continuation) */}
      {stage === 'round-result' && (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-5 bg-slate-900 border border-slate-800 rounded-3xl animate-scale-up shadow-2xl">
          <BatteryCharging className="w-14 h-14 text-cyan-400" aria-hidden="true" />
          <div className="space-y-1">
            <h3 className="text-2xl font-black text-white">
              {wrongLetters.length < maxWrongAttempts ? 'Kelimeyi Kurtardın!' : 'Robotun Enerjisi Bitti!'}
            </h3>
            <p className="text-sm font-extrabold text-amber-400">Gizli Kelime: {secretWord}</p>
          </div>

          <div className="flex gap-3 w-full max-w-xs pt-2">
            <button
              onClick={finishSinglePlayerGame}
              className="flex-1 py-3.5 rounded-2xl bg-slate-800 border border-slate-700 text-white font-black text-xs"
            >
              Oyunu Bitir
            </button>
            <button
              onClick={startNewSinglePlayerWord}
              className="flex-1 py-3.5 rounded-2xl bg-cyan-500 text-slate-950 font-black text-xs shadow-lg"
            >
              Sonraki Kelime
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
