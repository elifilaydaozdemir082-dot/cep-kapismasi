import React from 'react';
import { Percent, Snowflake, RefreshCw } from 'lucide-react';
import type { QuizJokersState } from '../../types/quiz';

interface QuizJokersBarProps {
  jokersState: QuizJokersState;
  onUseFiftyFifty: () => void;
  onUseTimeFreeze: () => void;
  onUseSwapQuestion: () => void;
  isAnswerLocked: boolean;
}

export const QuizJokersBar: React.FC<QuizJokersBarProps> = ({
  jokersState,
  onUseFiftyFifty,
  onUseTimeFreeze,
  onUseSwapQuestion,
  isAnswerLocked,
}) => {
  return (
    <div className="flex items-center justify-around bg-slate-900 border border-slate-800 rounded-2xl p-2 shadow-md">
      {/* 50:50 Joker */}
      <button
        onClick={onUseFiftyFifty}
        disabled={jokersState.fiftyFiftyUsed || isAnswerLocked}
        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black transition-all active:scale-95 border ${
          jokersState.fiftyFiftyUsed
            ? 'bg-slate-950 border-slate-800 text-slate-600 opacity-40 pointer-events-none'
            : 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300 hover:bg-indigo-500/30'
        }`}
      >
        <Percent className="w-4 h-4" /> %50:%50
      </button>

      {/* Freeze Time 5s Joker */}
      <button
        onClick={onUseTimeFreeze}
        disabled={jokersState.timeFreezeUsed || isAnswerLocked}
        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black transition-all active:scale-95 border ${
          jokersState.timeFreezeUsed
            ? 'bg-slate-950 border-slate-800 text-slate-600 opacity-40 pointer-events-none'
            : 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/30'
        }`}
      >
        <Snowflake className="w-4 h-4" /> Dondur (5s)
      </button>

      {/* Swap Question Joker */}
      <button
        onClick={onUseSwapQuestion}
        disabled={jokersState.swapQuestionUsed || isAnswerLocked}
        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black transition-all active:scale-95 border ${
          jokersState.swapQuestionUsed
            ? 'bg-slate-950 border-slate-800 text-slate-600 opacity-40 pointer-events-none'
            : 'bg-amber-400/20 border-amber-400/40 text-amber-300 hover:bg-amber-400/30'
        }`}
      >
        <RefreshCw className="w-4 h-4" /> Pas / Değiştir
      </button>
    </div>
  );
};
