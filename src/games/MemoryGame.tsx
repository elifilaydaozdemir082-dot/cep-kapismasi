import React, { useState, useEffect, useRef } from 'react';
import { Brain } from 'lucide-react';
import type { Player } from '../types/game';
import { playBeepSound, playFanfareSound, playTapSound, triggerVibration } from '../utils/audio';

interface MemoryGameProps {
  mode: 'single' | 'multi';
  players: Player[];
  onFinishGame: (results: { playerId: string; score: number; stats?: Record<string, number | string> }[]) => void;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
}

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
  const [score, setScore] = useState<number>(0);
  const [feedback, setFeedback] = useState<string | null>(null);

  const isFinishedRef = useRef<boolean>(false);
  const scoreRef = useRef<number>(0);

  const colors = [
    { id: 0, bg: 'bg-rose-500', activeBg: 'bg-rose-300' },
    { id: 1, bg: 'bg-cyan-500', activeBg: 'bg-cyan-300' },
    { id: 2, bg: 'bg-amber-400', activeBg: 'bg-amber-200' },
    { id: 3, bg: 'bg-emerald-500', activeBg: 'bg-emerald-300' },
  ];

  useEffect(() => {
    startNextTurn([]);
  }, []);

  const startNextTurn = (currentSeq: number[]) => {
    if (isFinishedRef.current) return;
    const nextBtn = Math.floor(Math.random() * 4);
    const newSeq = [...currentSeq, nextBtn];
    setSequence(newSeq);
    setUserSequence([]);
    showSequence(newSeq);
  };

  const showSequence = async (seq: number[]) => {
    setIsShowingSequence(true);
    for (let i = 0; i < seq.length; i++) {
      if (isFinishedRef.current) return;
      await new Promise((r) => setTimeout(r, 400));
      setActiveButton(seq[i]);
      playTapSound(soundEnabled);
      await new Promise((r) => setTimeout(r, 400));
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
      // Wrong sequence!
      playBeepSound(200, 0.4, soundEnabled);
      triggerVibration(60, vibrationEnabled);
      setFeedback('HATALI DİZİ!');
      setTimeout(() => finishGame(), 1200);
      return;
    }

    if (nextUserSeq.length === sequence.length) {
      // Completed round!
      playFanfareSound(soundEnabled);
      triggerVibration([20, 30], vibrationEnabled);
      const nextScore = scoreRef.current + 1;
      scoreRef.current = nextScore;
      setScore(nextScore);
      setFeedback('DOĞRU! SONRAKİ ADIM...');

      setTimeout(() => {
        setFeedback(null);
        startNextTurn(sequence);
      }, 1000);
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
          'Hafıza Adımı': scoreRef.current,
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

        <span className="text-xs font-black text-amber-400 bg-amber-400/10 border border-amber-400/20 px-3 py-1 rounded-full">
          Adım: {score}
        </span>
      </div>

      {/* Main Memory Pad Arena */}
      <div className="flex-1 relative bg-slate-900 border-2 border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col justify-between p-6">
        {/* Feedback Banner */}
        {feedback && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 bg-slate-950/95 border border-pink-500 px-5 py-2 rounded-full font-black text-xs text-amber-400 shadow-2xl animate-scale-up">
            {feedback}
          </div>
        )}

        {/* 4 Colored Memory Buttons Grid */}
        <div className="grid grid-cols-2 gap-4 my-auto aspect-square max-w-xs mx-auto w-full">
          {colors.map((c) => (
            <button
              key={c.id}
              onClick={() => handleButtonClick(c.id)}
              disabled={isShowingSequence}
              className={`rounded-3xl shadow-2xl transition-all border-4 border-slate-950 active:scale-95 ${
                activeButton === c.id ? `${c.activeBg} scale-105 ring-4 ring-white` : c.bg
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
