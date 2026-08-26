import React from 'react';
import { CheckCircle2, XCircle, HelpCircle } from 'lucide-react';
import type { ShuffledQuizQuestion } from '../../types/quiz';

interface QuizQuestionCardProps {
  question: ShuffledQuizQuestion;
  questionNumber: number;
  totalQuestions: number;
  selectedOptionIndex: number | null;
  onSelectOption: (index: number) => void;
  isAnswerLocked: boolean;
  timeLeft: number;
}

export const QuizQuestionCard: React.FC<QuizQuestionCardProps> = ({
  question,
  questionNumber,
  totalQuestions,
  selectedOptionIndex,
  onSelectOption,
  isAnswerLocked,
  timeLeft,
}) => {
  const optionLabels = ['A', 'B', 'C', 'D'];

  return (
    <div className="flex-1 flex flex-col justify-between space-y-4 select-none my-auto">
      {/* Question Header & Card */}
      <div className="bg-gradient-to-b from-slate-900 via-slate-900 to-indigo-950/40 border border-slate-800 rounded-3xl p-6 shadow-2xl text-center space-y-3 relative overflow-hidden">
        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-wider text-indigo-400 border-b border-slate-800 pb-2">
          <span>Soru {questionNumber} / {totalQuestions}</span>
          <span className={`px-3 py-1 rounded-full border ${timeLeft <= 5 ? 'bg-rose-500/20 border-rose-500 text-rose-400 animate-pulse font-black text-xs' : 'bg-slate-950 border-slate-800 text-slate-400'}`}>
            ⏱️ {timeLeft}s
          </span>
        </div>

        <h3 className="text-lg sm:text-xl font-black text-white leading-relaxed pt-2">
          {question.question}
        </h3>
      </div>

      {/* 4 Large Mobile-Friendly Touch Option Buttons */}
      <div className="grid grid-cols-1 gap-2.5">
        {question.shuffledOptions.map((optionText, idx) => {
          const isEliminated = question.eliminatedOptionIndices?.includes(idx);
          const isSelected = selectedOptionIndex === idx;
          const isCorrect = isAnswerLocked && idx === question.shuffledCorrectIndex;
          const isWrong = isAnswerLocked && isSelected && idx !== question.shuffledCorrectIndex;

          if (isEliminated) {
            return (
              <div
                key={idx}
                className="py-3.5 px-4 rounded-2xl bg-slate-950/40 border border-slate-900 text-slate-700 font-bold text-sm flex items-center gap-3 opacity-30 pointer-events-none"
              >
                <span className="w-8 h-8 rounded-xl bg-slate-900 flex items-center justify-center font-black text-xs text-slate-700">
                  {optionLabels[idx]}
                </span>
                <span>--- [YARI YARIYA ELENDİ] ---</span>
              </div>
            );
          }

          return (
            <button
              key={idx}
              onClick={() => !isAnswerLocked && onSelectOption(idx)}
              disabled={isAnswerLocked}
              className={`py-3.5 px-4 rounded-2xl font-black text-sm text-left flex items-center justify-between border shadow-lg transition-all active:scale-98 ${
                isCorrect
                  ? 'bg-emerald-500 text-slate-950 border-white ring-4 ring-emerald-500/30'
                  : isWrong
                  ? 'bg-rose-600 text-white border-white ring-4 ring-rose-600/30'
                  : isSelected
                  ? 'bg-indigo-500 text-white border-indigo-400'
                  : 'bg-slate-900 border-slate-800 text-slate-200 hover:border-indigo-500 hover:bg-slate-850'
              }`}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs shadow-inner ${
                    isCorrect
                      ? 'bg-slate-950 text-emerald-400'
                      : isWrong
                      ? 'bg-slate-950 text-rose-400'
                      : 'bg-slate-950 text-indigo-400'
                  }`}
                >
                  {optionLabels[idx]}
                </span>
                <span className="font-extrabold text-sm sm:text-base">{optionText}</span>
              </div>

              {isCorrect && <CheckCircle2 className="w-6 h-6 text-slate-950 stroke-[3]" />}
              {isWrong && <XCircle className="w-6 h-6 text-white stroke-[3]" />}
            </button>
          );
        })}
      </div>

      {/* Post-Answer Educational Explanation Banner */}
      {isAnswerLocked && question.explanation && (
        <div className="bg-indigo-950/80 border border-indigo-500/40 rounded-2xl p-4 text-left space-y-1 animate-scale-up shadow-xl">
          <div className="flex items-center gap-1.5 text-indigo-300 font-black text-xs uppercase tracking-wider">
            <HelpCircle className="w-4 h-4 text-amber-400" /> Açıklama & Bilgi
          </div>
          <p className="text-xs text-slate-200 font-medium leading-relaxed">
            {question.explanation}
          </p>
        </div>
      )}
    </div>
  );
};
