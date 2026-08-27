import React, { useState, useEffect, useRef } from 'react';
import { Brain, Trophy, Flame } from 'lucide-react';
import type { Player } from '../types/game';
import { playBeepSound, playFanfareSound, playTapSound, triggerVibration } from '../utils/audio';

interface MemoryGameProps {
  mode: 'single' | 'multi';
  players: Player[];
  onFinishGame: (results: { playerId: string; score: number; stats?: Record<string, number | string> }[]) => void;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
}

interface MemoryColor {
  id: number;
  name: string;
  bg: string;
  activeBg: string;
}

const ALL_COLORS: MemoryColor[] = [
  { id: 0, name: 'Kırmızı', bg: 'bg-rose-500', activeBg: 'bg-rose-300' },
  { id: 1, name: 'Mavi', bg: 'bg-cyan-500', activeBg: 'bg-cyan-300' },
  { id: 2, name: 'Sarı', bg: 'bg-amber-400', activeBg: 'bg-amber-200' },
  { id: 3, name: 'Yeşil', bg: 'bg-emerald-500', activeBg: 'bg-emerald-300' },
  { id: 4, name: 'Mor', bg: 'bg-purple-600', activeBg: 'bg-purple-300' },
  { id: 5, name: 'Turuncu', bg: 'bg-orange-500', activeBg: 'bg-orange-300' },
  { id: 6, name: 'Pembe', bg: 'bg-pink-500', activeBg: 'bg-pink-300' },
  { id: 7, name: 'Teal', bg: 'bg-teal-500', activeBg: 'bg-teal-300' },
  { id: 8, name: 'Fuşya', bg: 'bg-fuchsia-600', activeBg: 'bg-fuchsia-300' },
  { id: 9, name: 'Viyole', bg: 'bg-violet-600', activeBg: 'bg-violet-300' },
  { id: 10, name: 'Limon', bg: 'bg-lime-500', activeBg: 'bg-lime-300' },
  { id: 11, name: 'Çivit', bg: 'bg-indigo-600', activeBg: 'bg-indigo-300' },
];

export const MemoryGame: React.FC<MemoryGameProps> = ({
  players,
  onFinishGame,
  soundEnabled,
  vibrationEnabled,
}) => {
  const [sequence, setSequence] = useState<number[]>([]);
  const [userSequence, setUserSequence] = useState<number[]>([]);
  const [activeButton, setActiveButton] = useState<number | null>(null);
  const [isShowingSequence, setIsShowingSequence] = useState<boolean>(false);
  const [level, setLevel] = useState<number>(1);
  const [score, setScore] = useState<number>(0);
  const [feedback, setFeedback] = useState<string | null>(null);

  const isFinishedRef = useRef<boolean>(false);
  const scoreRef = useRef<number>(0);
  const levelRef = useRef<number>(1);

  // Calculate active color count based on level
  // Level 1-4: 4 colors (2x2)
  // Level 5-7: 6 colors (3x2)
  // Level 8-10: 9 colors (3x3)
  // Level 11+: 12 colors (4x3)
  const getActiveColorCount = (lvl: number) => {
    if (lvl <= 4) return 4;
    if (lvl <= 7) return 6;
    if (lvl <= 10) return 9;
    return 12;
  };

  const activeColorCount = getActiveColorCount(level);
  const activeColors = ALL_COLORS.slice(0, activeColorCount);

  // Dynamic Tailwind grid column class
  const getGridClass = (count: number) => {
    if (count <= 4) return 'grid-cols-2 max-w-xs';
    if (count <= 6) return 'grid-cols-3 max-w-sm';
    if (count <= 9) return 'grid-cols-3 max-w-sm';
    return 'grid-cols-4 max-w-md';
  };

  useEffect(() => {
    startNextLevel([]);
  }, []);

  const startNextLevel = (currentSeq: number[]) => {
    if (isFinishedRef.current) return;
    const currentCount = getActiveColorCount(levelRef.current);

    // Filter existing sequence items to ensure valid indices if colors count expanded
    const validSeq = currentSeq.map((id) => id % currentCount);
    const nextBtn = Math.floor(Math.random() * currentCount);
    const newSeq = [...validSeq, nextBtn];

    setSequence(newSeq);
    setUserSequence([]);
    showSequence(newSeq);
  };

  const showSequence = async (seq: number[]) => {
    setIsShowingSequence(true);

    // Sequence playback speeds up progressively with level
    const flashDelay = Math.max(180, 400 - levelRef.current * 18);

    for (let i = 0; i < seq.length; i++) {
      if (isFinishedRef.current) return;
      await new Promise((r) => setTimeout(r, flashDelay));
      setActiveButton(seq[i]);
      playTapSound(soundEnabled);
      await new Promise((r) => setTimeout(r, flashDelay));
      setActiveButton(null);
    }
    setIsShowingSequence(false);
  };

  const handleButtonClick = (btnId: number) => {
    if (isShowingSequence || isFinishedRef.current) return;

    playTapSound(soundEnabled);
    triggerVibration(10, vibrationEnabled);

    const nextUserSeq = [...userSequence, btnId];
    setUserSequence(nextUserSeq);

    const currentStep = nextUserSeq.length - 1;
    if (nextUserSeq[currentStep] !== sequence[currentStep]) {
      // Wrong sequence! Game Over!
      playBeepSound(150, 0.4, soundEnabled);
      triggerVibration(60, vibrationEnabled);
      setFeedback('❌ HATALI DIZILIM! OYUN BİTTİ');
      setTimeout(() => finishGame(), 1400);
      return;
    }

    if (nextUserSeq.length === sequence.length) {
      // Level Completed!
      playFanfareSound(soundEnabled);
      triggerVibration([20, 30], vibrationEnabled);

      const prevCount = getActiveColorCount(levelRef.current);
      const nextLevel = levelRef.current + 1;
      const newCount = getActiveColorCount(nextLevel);

      const nextScore = scoreRef.current + sequence.length * 15;

      levelRef.current = nextLevel;
      scoreRef.current = nextScore;

      setLevel(nextLevel);
      setScore(nextScore);

      let feedbackMsg = `✨ SEVİYE ${nextLevel} GEÇİLDİ!`;
      if (newCount > prevCount) {
        feedbackMsg = `🔥 YENİ RENKLER EKLENDİ! (${newCount} RENKLİ IZGARA!)`;
      }

      setFeedback(feedbackMsg);

      setTimeout(() => {
        setFeedback(null);
        startNextLevel(sequence);
      }, 1200);
    }
  };

  const finishGame = () => {
    if (isFinishedRef.current) return;
    isFinishedRef.current = true;

    onFinishGame([
      {
        playerId: players[0].id,
        score: scoreRef.current,
        stats: {
          'Ulaşılan Seviye': `Seviye ${levelRef.current}`,
          'Renk Sayısı': `${activeColorCount} Renk`,
          'Toplam Puan': scoreRef.current,
        },
      },
    ]);
  };

  return (
    <div className="relative flex-1 flex flex-col h-full w-full bg-slate-950 text-white select-none overflow-hidden touch-none p-3 space-y-2">
      {/* Header Bar */}
      <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3 shadow-md">
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-pink-400" aria-hidden="true" />
          <span className="font-extrabold text-sm text-white">Hafıza Rotası</span>
        </div>

        <div className="flex items-center gap-2 text-xs font-black">
          {activeColorCount > 4 && (
            <span className="text-amber-300 bg-amber-500/20 border border-amber-500/30 px-2.5 py-1 rounded-full flex items-center gap-1 animate-pulse">
              <Flame className="w-3.5 h-3.5" /> {activeColorCount} Renk
            </span>
          )}
          <span className="text-pink-400 bg-pink-500/10 border border-pink-500/20 px-3 py-1 rounded-full flex items-center gap-1">
            <Trophy className="w-3.5 h-3.5" /> Seviye {level}
          </span>
          <span className="text-amber-400 bg-amber-400/10 border border-amber-400/20 px-3 py-1 rounded-full">
            Skor: {score}
          </span>
        </div>
      </div>

      {/* Main Memory Pad Arena */}
      <div className="flex-1 relative bg-gradient-to-b from-slate-950 via-slate-900 to-pink-950/20 border-2 border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col justify-between p-6">
        {/* Feedback Banner */}
        {feedback && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 bg-slate-950/95 border-2 border-pink-500 px-6 py-2.5 rounded-full font-black text-xs text-amber-300 shadow-2xl animate-scale-up backdrop-blur">
            {feedback}
          </div>
        )}

        {/* Status Hint */}
        <div className="text-center space-y-1">
          <p className="text-xs font-black text-slate-300">
            {isShowingSequence
              ? '👀 IŞIK DİZİLİMİNİ İZLEYİN...'
              : `🎯 SEVİYE ${level}: ${sequence.length} ADIMLI (${activeColorCount} RENKLİ) DİZİYİ TEKRAR EDİN`}
          </p>
        </div>

        {/* Dynamic Multi-Color Memory Buttons Grid */}
        <div className={`grid gap-3.5 my-auto mx-auto w-full transition-all duration-500 ${getGridClass(activeColorCount)}`}>
          {activeColors.map((c) => (
            <button
              key={c.id}
              onClick={() => handleButtonClick(c.id)}
              disabled={isShowingSequence}
              className={`rounded-2xl shadow-2xl transition-all border-4 border-slate-950 active:scale-95 ${
                activeColorCount > 6 ? 'h-20' : 'h-28'
              } ${
                activeButton === c.id ? `${c.activeBg} scale-105 ring-4 ring-white shadow-[0_0_20px_#FFF]` : c.bg
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
