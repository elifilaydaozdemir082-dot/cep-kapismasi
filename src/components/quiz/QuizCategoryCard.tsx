import React from 'react';
import { HelpCircle, Trophy, AlertTriangle } from 'lucide-react';
import type { QuizCategoryInfo } from '../../types/quiz';
import { quizService } from '../../services/quizService';
import { storageService } from '../../services/storage';

interface QuizCategoryCardProps {
  category: QuizCategoryInfo;
  onSelect: (categoryId: QuizCategoryInfo['id']) => void;
}

export const QuizCategoryCard: React.FC<QuizCategoryCardProps> = ({
  category,
  onSelect,
}) => {
  const count = quizService.getAvailableCount(category.id);
  const isOutdated = quizService.isCategoryOutdated(category.id);
  const record = storageService.getSingleHighScore('quiz-classic', 'normal');

  return (
    <div
      onClick={() => !isOutdated && onSelect(category.id)}
      className={`group relative border rounded-3xl p-4 shadow-lg flex flex-col justify-between space-y-3 transition-all ${
        isOutdated
          ? 'bg-slate-900/50 border-rose-900/50 opacity-60 pointer-events-none'
          : 'bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/40 border-indigo-500/30 hover:border-indigo-400/80 cursor-pointer active:scale-98 shadow-indigo-500/5'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform">
            <HelpCircle className="w-7 h-7 stroke-[2.5]" />
          </div>
          <div>
            <h3 className="text-base font-black text-white group-hover:text-indigo-300 transition-colors">
              {category.title}
            </h3>
            <p className="text-[11px] text-slate-400 font-medium">
              {category.description}
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-slate-800/80 pt-2.5 text-xs font-black">
        {isOutdated ? (
          <span className="flex items-center gap-1 text-rose-400 bg-rose-500/10 border border-rose-500/20 px-3 py-1 rounded-full text-[10px]">
            <AlertTriangle className="w-3.5 h-3.5" /> Güncellenmesi gerekiyor
          </span>
        ) : (
          <span className="text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-3 py-0.5 rounded-full text-[10px] uppercase">
            {count} Soru Hazır
          </span>
        )}

        {record && (
          <span className="flex items-center gap-1 text-amber-400 text-[10px]">
            <Trophy className="w-3.5 h-3.5" /> Rekor: {record.score}
          </span>
        )}
      </div>
    </div>
  );
};
