import React, { useState, useEffect } from 'react';
import { Link as LinkIcon, Send, Heart } from 'lucide-react';
import type { Player } from '../types/game';
import { wordService } from '../services/wordService';
import { sanitizeWord, toTurkishUpper } from '../utils/wordUtils';
import { playBeepSound, playFanfareSound, triggerVibration } from '../utils/audio';

interface WordChainGameProps {
  mode: 'single' | 'multi';
  players: Player[];
  onFinishGame: (results: { playerId: string; score: number; stats?: Record<string, number | string> }[]) => void;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
}

export const WordChainGame: React.FC<WordChainGameProps> = ({
  mode,
  players,
  onFinishGame,
  soundEnabled,
  vibrationEnabled,
}) => {
  const [currentPlayerIdx, setCurrentPlayerIdx] = useState<number>(0);
  const [chainWords, setChainWords] = useState<string[]>([]);
  const [userInput, setUserInput] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [timeLeft, setTimeLeft] = useState<number>(10);
  const [playerLives, setPlayerLives] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    players.forEach((p) => (initial[p.id] = 3));
    return initial;
  });

  const [chainLength, setChainLength] = useState<number>(0);
  const currentPlayer = players[currentPlayerIdx] || players[0];

  // Initialize chain with random start word
  useEffect(() => {
    const startItem = wordService.getRandomWord();
    const startWord = startItem ? toTurkishUpper(startItem.word) : 'KALEM';
    setChainWords([startWord]);
    setChainLength(1);
  }, []);

  // Timer loop
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleTimeOut();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [currentPlayerIdx]);

  const handleTimeOut = () => {
    handleInvalidAnswer();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const sanitized = sanitizeWord(userInput);
    setErrorMsg(null);

    if (!sanitized) {
      setErrorMsg('Lütfen bir kelime yazın!');
      return;
    }

    const lastWord = chainWords[chainWords.length - 1];
    const requiredLetter = lastWord[lastWord.length - 1];
    const firstLetter = sanitized[0];

    // Check first letter matches last letter of previous word
    if (firstLetter !== requiredLetter) {
      playBeepSound(200, 0.3, soundEnabled);
      triggerVibration(30, vibrationEnabled);
      const msg = `Kelimeniz '${requiredLetter}' harfi ile başlamalıdır!`;
      setErrorMsg(msg);
      if (mode === 'multi') handleInvalidAnswer();
      return;
    }

    // Check repeat word
    if (chainWords.includes(sanitized)) {
      playBeepSound(200, 0.3, soundEnabled);
      triggerVibration(30, vibrationEnabled);
      const msg = 'Bu kelime zincirde daha önce kullanıldı!';
      setErrorMsg(msg);
      if (mode === 'multi') handleInvalidAnswer();
      return;
    }

    // Check local dictionary validity
    const isValid = wordService.isValidDictionaryWord(sanitized);
    if (!isValid) {
      playBeepSound(200, 0.3, soundEnabled);
      triggerVibration(30, vibrationEnabled);
      const msg = 'Geçerli bir Türkçe kelime bulunamadı!';
      setErrorMsg(msg);
      if (mode === 'multi') handleInvalidAnswer();
      return;
    }

    // Valid Answer!
    playFanfareSound(soundEnabled);
    triggerVibration(15, vibrationEnabled);
    const nextChain = [...chainWords, sanitized];
    setChainWords(nextChain);
    setChainLength((l) => l + 1);
    setUserInput('');
    setTimeLeft(10);

    if (mode === 'single') {
      setTimeout(() => processAITurn(sanitized, nextChain), 800);
    } else {
      setCurrentPlayerIdx((prev) => (prev + 1) % players.length);
    }
  };

  // AI turn generator for Single Player mode
  const processAITurn = (userWord: string, currentChain: string[]) => {
    const reqLetter = userWord[userWord.length - 1];
    const allWords = wordService.getAllWords().map((w) => toTurkishUpper(w.word));
    const aiCandidate = allWords.find(
      (w) => w[0] === reqLetter && !currentChain.includes(w)
    );

    if (aiCandidate) {
      playBeepSound(500, 0.1, soundEnabled);
      setChainWords([...currentChain, aiCandidate]);
      setChainLength((l) => l + 1);
      setTimeLeft(10);
    } else {
      finishGame();
    }
  };

  const handleInvalidAnswer = () => {
    playBeepSound(200, 0.4, soundEnabled);
    triggerVibration(50, vibrationEnabled);

    if (mode === 'single') {
      finishGame();
    } else {
      setPlayerLives((prev) => {
        const nextLives = Math.max(0, (prev[currentPlayer.id] || 3) - 1);
        const updated = { ...prev, [currentPlayer.id]: nextLives };

        const aliveCount = players.filter((p) => updated[p.id] > 0).length;
        if (aliveCount <= 1) {
          finishGame();
        } else {
          setCurrentPlayerIdx((prev) => (prev + 1) % players.length);
          setTimeLeft(10);
          setUserInput('');
        }
        return updated;
      });
    }
  };

  const finishGame = () => {
    onFinishGame([
      {
        playerId: currentPlayer.id,
        score: chainLength,
        stats: {
          'Zincir Uzunluğu': chainLength,
        },
      },
    ]);
  };

  const lastWord = chainWords[chainWords.length - 1] || 'KALEM';
  const targetLetter = lastWord[lastWord.length - 1];

  return (
    <div className="relative flex-1 flex flex-col h-full w-full bg-slate-950 text-white select-none overflow-hidden touch-none p-4">
      {/* Header */}
      <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3 shadow-md mb-2">
        <div className="flex items-center gap-2">
          <LinkIcon className="w-5 h-5 text-cyan-400" />
          <span className="font-extrabold text-sm text-white">Kelime Zinciri</span>
        </div>

        <div className="flex items-center gap-3">
          {mode === 'multi' && (
            <div className="flex items-center gap-1 text-rose-500">
              {Array.from({ length: 3 }).map((_, i) => (
                <Heart
                  key={i}
                  className={`w-4 h-4 ${
                    i < (playerLives[currentPlayer.id] || 3) ? 'fill-current' : 'opacity-20'
                  }`}
                />
              ))}
            </div>
          )}
          <span className="text-xs font-black text-amber-400 bg-amber-400/10 border border-amber-400/20 px-3 py-1 rounded-full">
            Süre: {timeLeft}s
          </span>
        </div>
      </div>

      {/* Main Chain Arena */}
      <div className="flex-1 flex flex-col justify-between my-auto">
        {/* Previous Word Display */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-center space-y-3 shadow-2xl my-auto">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">
            SON KELİME
          </span>
          <h2 className="text-3xl font-black text-cyan-400 tracking-wider drop-shadow-md">
            {lastWord}
          </h2>

          <div className="pt-2">
            <span className="text-xs text-slate-300 font-extrabold block">
              Sıradaki kelime şu harfle başlamalı:
            </span>
            <div className="w-14 h-14 mx-auto mt-2 rounded-2xl bg-amber-400 text-slate-950 font-black text-3xl flex items-center justify-center shadow-xl animate-bounce">
              {targetLetter}
            </div>
          </div>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="space-y-3 pt-2">
          <div className="relative">
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(toTurkishUpper(e.target.value))}
              placeholder={`${targetLetter}... ile başlayan kelime`}
              className="w-full py-4 px-4 pr-14 rounded-2xl bg-slate-900 border-2 border-slate-700 text-white font-black text-center text-xl focus:border-cyan-500 outline-none uppercase shadow-inner"
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 rounded-xl bg-cyan-500 text-slate-950 font-black shadow active:scale-95 transition-transform"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>

          {errorMsg && (
            <p className="text-xs font-black text-rose-500 text-center animate-shake">
              {errorMsg}
            </p>
          )}
        </form>
      </div>
    </div>
  );
};
