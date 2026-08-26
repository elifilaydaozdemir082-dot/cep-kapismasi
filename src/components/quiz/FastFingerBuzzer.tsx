import React from 'react';
import { Zap } from 'lucide-react';
import type { Player } from '../../types/game';

interface FastFingerBuzzerProps {
  players: Player[];
  activeBuzzerPlayerId: string | null;
  eliminatedPlayerIds: string[];
  onPressBuzzer: (playerId: string) => void;
}

export const FastFingerBuzzer: React.FC<FastFingerBuzzerProps> = ({
  players,
  activeBuzzerPlayerId,
  eliminatedPlayerIds,
  onPressBuzzer,
}) => {
  return (
    <div
      className={`grid gap-3 pt-2 ${
        players.length === 2
          ? 'grid-cols-2'
          : players.length === 3
          ? 'grid-cols-3'
          : 'grid-cols-2 grid-rows-2'
      }`}
    >
      {players.map((p) => {
        const isBuzzed = activeBuzzerPlayerId === p.id;
        const isEliminated = eliminatedPlayerIds.includes(p.id);

        return (
          <button
            key={p.id}
            onClick={() => !activeBuzzerPlayerId && !isEliminated && onPressBuzzer(p.id)}
            disabled={!!activeBuzzerPlayerId || isEliminated}
            style={{ backgroundColor: isEliminated ? '#334155' : p.color }}
            className={`py-4 px-3 rounded-2xl flex flex-col items-center justify-center font-black text-white shadow-xl transition-all border-2 border-white/20 select-none touch-none ${
              isBuzzed
                ? 'scale-105 ring-8 ring-white animate-bounce'
                : isEliminated
                ? 'opacity-30 pointer-events-none'
                : 'active:scale-95 hover:brightness-110'
            }`}
          >
            <Zap className="w-6 h-6 fill-current mb-1" />
            <span className="text-xs uppercase drop-shadow">{p.name}</span>
            <span className="text-sm font-black drop-shadow">
              {isBuzzed ? 'SIRA SİZDE!' : isEliminated ? 'ELENDİ' : 'BASTIM!'}
            </span>
          </button>
        );
      })}
    </div>
  );
};
