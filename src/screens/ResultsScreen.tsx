import React from 'react';
import { Trophy, Award, RotateCcw, LayoutGrid, Home } from 'lucide-react';
import type { DifficultyLevel, GameMode, GameType, MedalType, Player, SinglePlayerRecord } from '../types/game';
import { getMultiFeedbackMessage, getSingleFeedbackMessage } from '../utils/feedback';
import { calculatePlayerRankings } from '../utils/score';
import { playFanfareSound, triggerVibration } from '../utils/audio';

interface ResultsScreenProps {
  mode: GameMode;
  gameType: GameType;
  gameTitle: string;
  gameUnit: string;
  difficulty: DifficultyLevel;
  earnedMedal: MedalType;
  isLowerScoreBetter?: boolean;
  singleScore?: number;
  singleStats?: Record<string, number | string>;
  isNewRecord?: boolean;
  singleRecord?: SinglePlayerRecord | null;
  multiPlayers?: Player[];
  onPlayAgain: () => void;
  onGameSelect: () => void;
  onMainMenu: () => void;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
}

export const ResultsScreen: React.FC<ResultsScreenProps> = ({
  mode,
  gameTitle,
  gameUnit,
  earnedMedal,
  isLowerScoreBetter,
  singleScore = 0,
  singleStats,
  isNewRecord = false,
  multiPlayers = [],
  onPlayAgain,
  onGameSelect,
  onMainMenu,
  soundEnabled,
  vibrationEnabled,
}) => {
  React.useEffect(() => {
    playFanfareSound(soundEnabled);
    triggerVibration([20, 30, 20], vibrationEnabled);
  }, []);

  const rankedMulti = calculatePlayerRankings(multiPlayers, isLowerScoreBetter);
  const winner = rankedMulti[0];

  const feedback =
    mode === 'single'
      ? getSingleFeedbackMessage(singleScore, isNewRecord, earnedMedal)
      : getMultiFeedbackMessage(winner?.isTieForWinner || false, winner?.name || 'Oyuncu');

  return (
    <div className="flex-1 flex flex-col justify-between h-full w-full bg-slate-950 text-white p-6 select-none animate-fade-in overflow-y-auto">
      {/* Top Banner */}
      <div className="text-center space-y-2 pt-4">
        <div className="w-20 h-20 mx-auto rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-center shadow-2xl animate-bounce">
          <Trophy className="w-10 h-10 text-amber-400 stroke-[2.5]" aria-hidden="true" />
        </div>

        <span className="inline-block px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-cyan-400 font-extrabold text-[10px] uppercase tracking-wider">
          {gameTitle} Sonuçları
        </span>

        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
          {feedback.title}
        </h1>
        <p className="text-xs text-slate-400 max-w-xs mx-auto font-medium">
          {feedback.subtitle}
        </p>
      </div>

      {/* SINGLE PLAYER RESULTS CARD */}
      {mode === 'single' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl text-center space-y-4 my-auto">
          {earnedMedal !== 'none' && (
            <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-400 font-black text-xs">
              <Award className="w-4 h-4" aria-hidden="true" /> {earnedMedal.toUpperCase()} MADALYA KAZANILDl!
            </div>
          )}

          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest block">
              TOPLAM SKOR
            </span>
            <div className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400">
              {singleScore} <span className="text-lg font-bold text-slate-400">{gameUnit}</span>
            </div>
          </div>

          {singleStats && Object.keys(singleStats).length > 0 && (
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80">
              {Object.entries(singleStats).map(([key, val]) => (
                <div key={key} className="bg-slate-950 border border-slate-800/60 rounded-2xl p-2.5 text-center">
                  <span className="text-[10px] font-extrabold text-slate-400 block">{key}</span>
                  <span className="text-sm font-black text-white">{val}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MULTIPLAYER RESULTS CARD */}
      {mode === 'multi' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-3 my-auto">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 text-center">
            GENEL SIRALAMA
          </h3>

          <div className="space-y-2">
            {rankedMulti.map((player) => (
              <div
                key={player.id}
                style={{ borderColor: player.rank === 1 ? player.color : undefined }}
                className={`p-3.5 rounded-2xl flex items-center justify-between border transition-all ${
                  player.rank === 1
                    ? 'bg-slate-950 border-2 shadow-lg ring-2 ring-amber-400/20'
                    : 'bg-slate-950/60 border-slate-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`w-7 h-7 rounded-xl flex items-center justify-center font-black text-xs ${
                      player.rank === 1 ? 'bg-amber-400 text-slate-950' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {player.rank}
                  </span>
                  <span className="font-black text-sm text-white" style={{ color: player.color }}>
                    {player.name}
                  </span>
                </div>

                <div className="text-right">
                  <span className="font-black text-base text-white">{player.score}</span>
                  <span className="text-[10px] font-bold text-slate-400 ml-1">{gameUnit}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ACTION BUTTONS */}
      <div className="flex flex-col gap-2.5 pt-4">
        <button
          onClick={onPlayAgain}
          className="w-full py-4 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-sm shadow-xl shadow-cyan-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          <RotateCcw className="w-5 h-5 stroke-[2.5]" aria-hidden="true" /> Tekrar Oyna
        </button>

        <div className="grid grid-cols-2 gap-2.5">
          <button
            onClick={onGameSelect}
            className="py-3.5 rounded-2xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 font-black text-xs active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <LayoutGrid className="w-4 h-4" aria-hidden="true" /> Oyun Seçimi
          </button>
          <button
            onClick={onMainMenu}
            className="py-3.5 rounded-2xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 font-black text-xs active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4 text-cyan-400" aria-hidden="true" /> Ana Sayfa
          </button>
        </div>
      </div>
    </div>
  );
};
