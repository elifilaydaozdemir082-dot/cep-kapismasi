import React from 'react';
import {
  Zap,
  Car,
  Goal,
  Target,
  Swords,
  Activity,
  Disc,
  Layers,
  Compass,
  Brain,
  BookOpen,
  Bot,
  Search,
  Grid,
  Ban,
  Link as LinkIcon,
  HelpCircle,
  Award,
  Play,
  Gift,
} from 'lucide-react';
import type { DifficultyLevel, GameMetadata, GameMode } from '../types/game';
import { Header } from './Header';
import { playTapSound, triggerVibration } from '../utils/audio';

interface RulesModalProps {
  game: GameMetadata;
  mode: GameMode;
  difficulty: DifficultyLevel;
  onSelectDifficulty: (diff: DifficultyLevel) => void;
  isOpen: boolean;
  onStartGame: () => void;
  onBack: () => void;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
}

export const RulesModal: React.FC<RulesModalProps> = ({
  game,
  mode,
  difficulty,
  onSelectDifficulty,
  isOpen,
  onStartGame,
  onBack,
  soundEnabled,
  vibrationEnabled,
}) => {
  if (!isOpen) return null;

  const thresholds = game.medals[difficulty];

  const handleStart = () => {
    playTapSound(soundEnabled);
    triggerVibration(20, vibrationEnabled);
    onStartGame();
  };

  const renderIcon = () => {
    switch (game.icon) {
      case 'Gift':
        return <Gift className="w-8 h-8 text-amber-400 stroke-[2.5]" aria-hidden="true" />;
      case 'Car':
        return <Car className="w-8 h-8 text-cyan-400 stroke-[2.5]" aria-hidden="true" />;
      case 'Goal':
        return <Goal className="w-8 h-8 text-emerald-400 stroke-[2.5]" aria-hidden="true" />;
      case 'Dribble':
      case 'Target':
        return <Target className="w-8 h-8 text-amber-400 stroke-[2.5]" aria-hidden="true" />;
      case 'ZapFast':
        return <Activity className="w-8 h-8 text-rose-500 stroke-[2.5]" aria-hidden="true" />;
      case 'Swords':
        return <Swords className="w-8 h-8 text-purple-400 stroke-[2.5]" aria-hidden="true" />;
      case 'Disc':
        return <Disc className="w-8 h-8 text-blue-400 stroke-[2.5]" aria-hidden="true" />;
      case 'Layers':
        return <Layers className="w-8 h-8 text-cyan-400 stroke-[2.5]" aria-hidden="true" />;
      case 'Compass':
        return <Compass className="w-8 h-8 text-indigo-400 stroke-[2.5]" aria-hidden="true" />;
      case 'Brain':
        return <Brain className="w-8 h-8 text-pink-400 stroke-[2.5]" aria-hidden="true" />;
      case 'BookOpen':
        return <BookOpen className="w-8 h-8 text-amber-400 stroke-[2.5]" aria-hidden="true" />;
      case 'Bot':
        return <Bot className="w-8 h-8 text-cyan-400 stroke-[2.5]" aria-hidden="true" />;
      case 'Search':
        return <Search className="w-8 h-8 text-emerald-400 stroke-[2.5]" aria-hidden="true" />;
      case 'Grid':
        return <Grid className="w-8 h-8 text-indigo-400 stroke-[2.5]" aria-hidden="true" />;
      case 'Ban':
        return <Ban className="w-8 h-8 text-rose-500 stroke-[2.5]" aria-hidden="true" />;
      case 'Link':
        return <LinkIcon className="w-8 h-8 text-amber-400 stroke-[2.5]" aria-hidden="true" />;
      case 'HelpCircle':
        return <HelpCircle className="w-8 h-8 text-indigo-400 stroke-[2.5]" aria-hidden="true" />;
      default:
        return <Zap className="w-8 h-8 text-cyan-400 stroke-[2.5]" aria-hidden="true" />;
    }
  };

  return (
    <div className="fixed inset-0 z-40 bg-slate-950 flex flex-col h-full w-full select-none animate-fade-in">
      <Header title="Kurallar & Hazırlık" onBack={onBack} />

      <div className="flex-1 p-4 max-w-lg mx-auto w-full flex flex-col justify-between overflow-y-auto space-y-4">
        {/* Game Title & Category Badge */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl text-center space-y-3">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center shadow-inner">
            {renderIcon()}
          </div>

          <div className="space-y-1">
            <span className="inline-block px-3 py-1 rounded-full bg-slate-950 border border-slate-800 text-cyan-400 font-extrabold text-[10px] uppercase tracking-wider">
              {game.categoryLabel}
            </span>
            <h2 className="text-2xl font-black text-white">{game.title}</h2>
          </div>

          <p className="text-xs text-slate-300 font-medium leading-relaxed">
            {game.description}
          </p>
        </div>

        {/* Difficulty Selector (Single Player) */}
        {mode === 'single' && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 shadow-xl space-y-2">
            <label className="text-xs font-bold text-slate-300 block text-center">
              Zorluk Seviyesi Seçin:
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['easy', 'normal', 'hard'] as DifficultyLevel[]).map((d) => (
                <button
                  key={d}
                  onClick={() => onSelectDifficulty(d)}
                  className={`py-2.5 rounded-2xl font-black text-xs transition-all active:scale-95 border ${
                    difficulty === d
                      ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-md'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-900'
                  }`}
                >
                  {d === 'easy' ? 'Kolay' : d === 'normal' ? 'Normal' : 'Zor'}
                </button>
              ))}
            </div>

            {/* Medal Thresholds */}
            <div className="flex justify-around items-center pt-2 text-[11px] font-black border-t border-slate-800/80">
              <span className="flex items-center gap-1 text-amber-600">
                <Award className="w-3.5 h-3.5" aria-hidden="true" /> Bronz: {thresholds.bronz} {game.unit}
              </span>
              <span className="flex items-center gap-1 text-slate-300">
                <Award className="w-3.5 h-3.5" aria-hidden="true" /> Gümüş: {thresholds.gümüş} {game.unit}
              </span>
              <span className="flex items-center gap-1 text-amber-400">
                <Award className="w-3.5 h-3.5" aria-hidden="true" /> Altın: {thresholds.altın} {game.unit}
              </span>
            </div>
          </div>
        )}

        {/* Rules List */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 text-center">
            NASIL OYNANIR?
          </h3>
          <ul className="space-y-2.5">
            {game.rules.map((rule, idx) => (
              <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-200 font-medium">
                <span className="w-5 h-5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-black text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <span>{rule}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Start Button */}
        <button
          onClick={handleStart}
          className="w-full py-4 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-base shadow-xl shadow-cyan-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          <Play className="w-5 h-5 fill-current" aria-hidden="true" /> BAŞLA
        </button>
      </div>
    </div>
  );
};
