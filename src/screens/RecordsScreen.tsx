import React, { useState, useEffect } from 'react';
import { Trophy, Users, Calendar } from 'lucide-react';
import { Header } from '../components/Header';
import type { MultiPlayerRecord, SinglePlayerRecord } from '../types/game';
import { storageService } from '../services/storage';
import { GAME_REGISTRY } from '../registry/gameRegistry';

interface RecordsScreenProps {
  onBack: () => void;
}

export const RecordsScreen: React.FC<RecordsScreenProps> = ({ onBack }) => {
  const [tab, setTab] = useState<'single' | 'multi'>('single');
  const [singleRecordsMap, setSingleRecordsMap] = useState<Record<string, SinglePlayerRecord>>({});
  const [multiHistory, setMultiHistory] = useState<MultiPlayerRecord[]>([]);

  useEffect(() => {
    setSingleRecordsMap(storageService.getAllSingleHighScores());
    setMultiHistory(storageService.getMultiHistory());
  }, []);

  const singleRecordsList = Object.values(singleRecordsMap);

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 text-white select-none animate-fade-in">
      <Header title="Rekorlar & Geçmiş" onBack={onBack} />

      <div className="flex-1 flex flex-col p-4 max-w-md mx-auto w-full space-y-4 overflow-y-auto">
        {/* Tab switchers */}
        <div className="grid grid-cols-2 gap-2 bg-slate-900 p-1.5 rounded-2xl border border-slate-800">
          <button
            onClick={() => setTab('single')}
            className={`py-2.5 rounded-xl font-extrabold text-xs transition-all flex items-center justify-center gap-2 ${
              tab === 'single'
                ? 'bg-cyan-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Trophy className="w-4 h-4" />
            Tek Oyunculu
          </button>
          <button
            onClick={() => setTab('multi')}
            className={`py-2.5 rounded-xl font-extrabold text-xs transition-all flex items-center justify-center gap-2 ${
              tab === 'multi'
                ? 'bg-cyan-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            Arkadaşlarla
          </button>
        </div>

        {/* Tab Content */}
        {tab === 'single' ? (
          <div className="space-y-3 pb-6">
            {singleRecordsList.length > 0 ? (
              singleRecordsList.map((rec) => {
                const gameMeta = GAME_REGISTRY[rec.gameType];
                return (
                  <div
                    key={rec.gameType}
                    className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-2 shadow-md"
                  >
                    <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                      <span className="text-xs font-black text-cyan-400">
                        {gameMeta?.title || rec.gameType}
                      </span>
                      <div className="flex items-center gap-1 text-[10px] text-slate-500">
                        <Calendar className="w-3 h-3" />
                        <span>{rec.date}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-sm font-bold text-white">
                        Rekortmen: <strong className="text-amber-400">{rec.playerName}</strong>
                      </span>
                      <span className="text-xl font-black text-amber-400">
                        {rec.score} {rec.unit}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-12 text-slate-500 space-y-2">
                <Trophy className="w-12 h-12 mx-auto opacity-40" />
                <p className="text-sm font-semibold">Henüz bir rekor kaydedilmemiş.</p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3 pb-6">
            {multiHistory.length > 0 ? (
              multiHistory.map((item) => (
                <div
                  key={item.id}
                  className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-2 shadow-md"
                >
                  <div className="flex items-center justify-between text-xs text-slate-400 font-bold border-b border-slate-800/80 pb-2">
                    <span className="text-cyan-400">
                      {item.gameTitle || 'Parti Oyunu'} ({item.playerCount} Oyuncu)
                    </span>
                    <span>{item.date}</span>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-sm font-bold text-white">
                      Kazanan: <strong className="text-amber-400">{item.winnerName}</strong>
                    </span>
                    <span className="text-lg font-black text-cyan-400">
                      {item.winnerScore} puan
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-slate-500 space-y-2">
                <Users className="w-12 h-12 mx-auto opacity-40" />
                <p className="text-sm font-semibold">
                  Henüz arkadaşlarınla maç yapmadın.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
