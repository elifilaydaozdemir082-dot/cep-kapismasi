import React, { useState, useEffect } from 'react';
import { Ban, Send } from 'lucide-react';
import type { Player, WordCategory } from '../types/game';
import { wordService } from '../services/wordService';
import { TURKISH_ALPHABET, containsForbiddenLetter, sanitizeWord, toTurkishUpper } from '../utils/wordUtils';
import { playBeepSound, playFanfareSound, triggerVibration } from '../utils/audio';

interface ForbiddenLetterGameProps {
  mode: 'single' | 'multi';
  players: Player[];
  onFinishGame: (results: { playerId: string; score: number; stats?: Record<string, number | string> }[]) => void;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
}

export const ForbiddenLetterGame: React.FC<ForbiddenLetterGameProps> = ({
  mode,
  players,
  onFinishGame,
  soundEnabled,
  vibrationEnabled,
}) => {
  const [currentPlayerIdx, setCurrentPlayerIdx] = useState<number>(0);
  const [category, setCategory] = useState<{ id: WordCategory; name: string }>({
    id: 'hayvanlar',
    name: 'Hayvanlar',
  });
  const [forbiddenLetter, setForbiddenLetter] = useState<string>('A');
  const [userInput, setUserInput] = useState<string>('');
  const [usedWords, setUsedWords] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Stats
  const [score, setScore] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(mode === 'single' ? 60 : 10);
  const [, setPlayerLives] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    players.forEach((p) => (initial[p.id] = 1));
    return initial;
  });

  const categoriesList: { id: WordCategory; name: string }[] = [
    { id: 'hayvanlar', name: 'Hayvanlar' },
    { id: 'gunluk', name: 'Günlük Hayat' },
    { id: 'spor', name: 'Spor' },
    { id: 'teknoloji', name: 'Teknoloji' },
    { id: 'yiyecek', name: 'Yiyecek' },
    { id: 'meslekler', name: 'Meslekler' },
    { id: 'sehirler', name: 'Şehirler' },
    { id: 'doga', name: 'Doğa' },
  ];

  const currentPlayer = players[currentPlayerIdx] || players[0];

  useEffect(() => {
    generateNewChallenge();
  }, []);

  const generateNewChallenge = () => {
    const randCat = categoriesList[Math.floor(Math.random() * categoriesList.length)];
    const randLetter = TURKISH_ALPHABET[Math.floor(Math.random() * TURKISH_ALPHABET.length)];
    setCategory(randCat);
    setForbiddenLetter(randLetter);
    setUserInput('');
    setErrorMsg(null);
  };

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
  }, [mode, currentPlayerIdx]);

  const handleTimeOut = () => {
    if (mode === 'single') {
      finishGame();
    } else {
      handlePlayerElimination();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const sanitized = sanitizeWord(userInput);

    if (!sanitized) {
      setErrorMsg('Lütfen bir kelime yazın!');
      return;
    }

    // Check if word contains forbidden letter
    if (containsForbiddenLetter(sanitized, forbiddenLetter)) {
      playBeepSound(200, 0.3, soundEnabled);
      triggerVibration(40, vibrationEnabled);
      const msg = `HATA: Kelime '${forbiddenLetter}' harfini içeriyor!`;
      setErrorMsg(msg);

      if (mode === 'multi') {
        handlePlayerElimination();
      }
      return;
    }

    // Check repeat word
    if (usedWords.includes(sanitized)) {
      playBeepSound(200, 0.3, soundEnabled);
      triggerVibration(30, vibrationEnabled);
      const msg = 'Bu kelime daha önce kullanıldı!';
      setErrorMsg(msg);
      return;
    }

    // Check local dictionary validity
    const isValid = wordService.isValidDictionaryWord(sanitized);
    if (!isValid) {
      playBeepSound(200, 0.3, soundEnabled);
      triggerVibration(30, vibrationEnabled);
      const msg = 'Sözlükte geçerli bir kelime bulunamadı!';
      setErrorMsg(msg);
      return;
    }

    // Valid Answer!
    playFanfareSound(soundEnabled);
    triggerVibration(20, vibrationEnabled);
    setUsedWords((prev) => [...prev, sanitized]);
    setScore((s) => s + 1);

    if (mode === 'single') {
      generateNewChallenge();
    } else {
      // Next player turn
      setCurrentPlayerIdx((prev) => (prev + 1) % players.length);
      setTimeLeft(10);
      generateNewChallenge();
    }
  };

  const handlePlayerElimination = () => {
    setPlayerLives((prev) => {
      const updated = { ...prev, [currentPlayer.id]: 0 };
      const activePlayers = players.filter((p) => updated[p.id] > 0);

      if (activePlayers.length <= 1) {
        finishGame();
      } else {
        setCurrentPlayerIdx((prev) => (prev + 1) % players.length);
        setTimeLeft(10);
        generateNewChallenge();
      }
      return updated;
    });
  };

  const finishGame = () => {
    onFinishGame([
      {
        playerId: currentPlayer.id,
        score,
        stats: {
          'Geçerli Kelime': score,
        },
      },
    ]);
  };

  return (
    <div className="relative flex-1 flex flex-col h-full w-full bg-slate-950 text-white select-none overflow-hidden touch-none p-4">
      {/* Header */}
      <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3 shadow-md mb-2">
        <div className="flex items-center gap-2">
          <Ban className="w-5 h-5 text-rose-500" />
          <span className="font-extrabold text-sm text-white">Yasak Harf</span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-black text-amber-400 bg-amber-400/10 border border-amber-400/20 px-3 py-1 rounded-full">
            Süre: {timeLeft}s
          </span>
          <span className="text-xs font-black text-cyan-400">Skor: {score}</span>
        </div>
      </div>

      {/* Main Challenge Card */}
      <div className="flex-1 flex flex-col justify-around my-auto">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-center space-y-4 shadow-2xl">
          <div className="inline-block px-4 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 font-extrabold text-xs uppercase tracking-wider">
            Kategori: {category.name}
          </div>

          <div className="space-y-1">
            <span className="text-xs font-black uppercase text-slate-400 tracking-widest block">
              GÖREV
            </span>
            <p className="text-lg font-black text-white">
              Bir <span className="text-cyan-400">{category.name}</span> söyle, ancak içinde...
            </p>
          </div>

          {/* Big Forbidden Letter Badge */}
          <div className="w-24 h-24 mx-auto rounded-3xl bg-rose-500/20 border-4 border-rose-500 text-rose-400 flex items-center justify-center font-black text-5xl shadow-2xl animate-pulse">
            {forbiddenLetter}
          </div>

          <span className="text-xs font-black uppercase text-rose-400 tracking-widest block">
            HARFİ KESİNLİKLE OLMASIN!
          </span>
        </div>

        {/* Form Input */}
        <form onSubmit={handleSubmit} className="space-y-3 pt-4">
          <div className="relative">
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(toTurkishUpper(e.target.value))}
              placeholder="Cevabınızı yazın..."
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
