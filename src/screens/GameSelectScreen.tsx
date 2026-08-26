import React, { useState } from 'react';
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
  Play,
  Gift,
} from 'lucide-react';
import { Header } from '../components/Header';
import type { GameCategory, GameMetadata, GameType } from '../types/game';
import { GAME_REGISTRY } from '../registry/gameRegistry';

interface GameSelectScreenProps {
  onBack: () => void;
  onSelectGame: (gameType: GameType) => void;
}

export const GameSelectScreen: React.FC<GameSelectScreenProps> = ({
  onBack,
  onSelectGame,
}) => {
  const [activeCategory, setActiveCategory] = useState<GameCategory | 'all'>('all');

  const gamesList: GameMetadata[] = Object.values(GAME_REGISTRY);

  const categories: { id: GameCategory | 'all'; label: string }[] = [
    { id: 'all', label: 'Tümü' },
    { id: 'sans', label: 'Şans ve Strateji' },
    { id: 'bilgi', label: 'Bilgi Yarışması' },
    { id: 'kelime', label: 'Kelime Oyunları' },
    { id: 'spor', label: 'Spor' },
    { id: 'yaris', label: 'Yarış' },
    { id: 'refleks', label: 'Hız ve Refleks' },
    { id: 'zeka', label: 'Zekâ ve Denge' },
  ];

  const filteredGames =
    activeCategory === 'all'
      ? gamesList
      : gamesList.filter((g) => g.category === activeCategory);

  const renderGameIcon = (iconName: string) => {
    switch (iconName) {
      case 'Gift':
        return <Gift className="w-7 h-7 stroke-[2.5]" aria-hidden="true" />;
      case 'Car':
        return <Car className="w-7 h-7 stroke-[2.5]" aria-hidden="true" />;
      case 'Goal':
        return <Goal className="w-7 h-7 stroke-[2.5]" aria-hidden="true" />;
      case 'Dribble':
      case 'Target':
        return <Target className="w-7 h-7 stroke-[2.5]" aria-hidden="true" />;
      case 'ZapFast':
        return <Activity className="w-7 h-7 stroke-[2.5]" aria-hidden="true" />;
      case 'Swords':
        return <Swords className="w-7 h-7 stroke-[2.5]" aria-hidden="true" />;
      case 'Disc':
        return <Disc className="w-7 h-7 stroke-[2.5]" aria-hidden="true" />;
      case 'Layers':
        return <Layers className="w-7 h-7 stroke-[2.5]" aria-hidden="true" />;
      case 'Compass':
        return <Compass className="w-7 h-7 stroke-[2.5]" aria-hidden="true" />;
      case 'Brain':
        return <Brain className="w-7 h-7 stroke-[2.5]" aria-hidden="true" />;
      case 'BookOpen':
        return <BookOpen className="w-7 h-7 stroke-[2.5]" aria-hidden="true" />;
      case 'Bot':
        return <Bot className="w-7 h-7 stroke-[2.5]" aria-hidden="true" />;
      case 'Search':
        return <Search className="w-7 h-7 stroke-[2.5]" aria-hidden="true" />;
      case 'Grid':
        return <Grid className="w-7 h-7 stroke-[2.5]" aria-hidden="true" />;
      case 'Ban':
        return <Ban className="w-7 h-7 stroke-[2.5]" aria-hidden="true" />;
      case 'Link':
        return <LinkIcon className="w-7 h-7 stroke-[2.5]" aria-hidden="true" />;
      case 'HelpCircle':
        return <HelpCircle className="w-7 h-7 stroke-[2.5]" aria-hidden="true" />;
      default:
        return <Zap className="w-7 h-7 stroke-[2.5]" aria-hidden="true" />;
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 text-white select-none animate-fade-in">
      <Header title="Oyun Seçimi" onBack={onBack} />

      <div className="flex-1 p-4 max-w-2xl mx-auto w-full space-y-4 overflow-y-auto">
        <div className="text-center space-y-1">
          <h2 className="text-2xl font-black text-white">Mini Oyun Galerisi</h2>
          <p className="text-xs text-slate-400">21 Eğlenceli parti oyunu seçilebilir</p>
        </div>

        {/* Category Filter Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-4 py-2 rounded-xl text-xs font-black whitespace-nowrap transition-all active:scale-95 border ${
                activeCategory === cat.id
                  ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-md shadow-cyan-500/20'
                  : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Responsive Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pb-6">
          {filteredGames.map((game) => {
            const isQuizGame = game.category === 'bilgi';
            const isWordGame = game.category === 'kelime';
            const isBoxGame = game.category === 'sans';

            return (
              <div
                key={game.id}
                onClick={() => onSelectGame(game.id)}
                className={`group relative border rounded-3xl p-4 shadow-lg cursor-pointer active:scale-98 transition-all flex flex-col justify-between space-y-3 ${
                  isBoxGame
                    ? 'bg-gradient-to-br from-slate-900/90 to-amber-950/40 border-amber-500/40 hover:border-amber-400/80 shadow-amber-500/5'
                    : isQuizGame
                    ? 'bg-gradient-to-br from-slate-900/90 to-indigo-950/40 border-indigo-500/30 hover:border-indigo-400/80 shadow-indigo-500/5'
                    : isWordGame
                    ? 'bg-gradient-to-br from-slate-900/90 to-emerald-950/30 border-emerald-500/30 hover:border-emerald-400/80 shadow-emerald-500/5'
                    : 'bg-slate-900/80 border-slate-800 hover:border-cyan-500/80 shadow-cyan-500/5'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-12 h-12 rounded-2xl border flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform ${
                        isBoxGame
                          ? 'bg-amber-400/10 border-amber-400/30 text-amber-400'
                          : isQuizGame
                          ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'
                          : isWordGame
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                          : 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400'
                      }`}
                    >
                      {renderGameIcon(game.icon)}
                    </div>
                    <div>
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full font-extrabold text-[10px] uppercase tracking-wider mb-1 ${
                          isBoxGame
                            ? 'bg-amber-400/10 text-amber-400 border border-amber-400/20'
                            : isQuizGame
                            ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                            : isWordGame
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-slate-800 text-cyan-400'
                        }`}
                      >
                        {game.typeLabel}
                      </span>
                      <h3 className="text-base font-black text-white group-hover:text-indigo-300 transition-colors">
                        {game.title}
                      </h3>
                    </div>
                  </div>

                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center shadow transition-colors ${
                      isBoxGame
                        ? 'bg-amber-400 text-slate-950 group-hover:bg-amber-300'
                        : isQuizGame
                        ? 'bg-indigo-500 text-white group-hover:bg-indigo-400'
                        : isWordGame
                        ? 'bg-emerald-500 text-slate-950 group-hover:bg-emerald-400'
                        : 'bg-cyan-500 text-slate-950 group-hover:bg-cyan-400'
                    }`}
                  >
                    <Play className="w-4 h-4 fill-current ml-0.5" aria-hidden="true" />
                  </div>
                </div>

                <p className="text-xs text-slate-400 font-medium leading-relaxed">
                  {game.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
