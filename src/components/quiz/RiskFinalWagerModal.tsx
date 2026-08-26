import React, { useState } from 'react';
import { Flame, ShieldAlert } from 'lucide-react';
import type { Player } from '../../types/game';

interface RiskFinalWagerModalProps {
  players: Player[];
  onConfirmWagers: (wagers: Record<string, number>) => void;
}

export const RiskFinalWagerModal: React.FC<RiskFinalWagerModalProps> = ({
  players,
  onConfirmWagers,
}) => {
  const [currentPlayerIdx, setCurrentPlayerIdx] = useState<number>(0);
  const [wagers, setWagers] = useState<Record<string, number>>({});
  const [currentInputValue, setCurrentInputValue] = useState<string>('0');
  const [error, setError] = useState<string | null>(null);

  const currentPlayer = players[currentPlayerIdx] || players[0];
  const maxWager = currentPlayer.score || 100;

  const handleNextPlayerWager = (e: React.FormEvent) => {
    e.preventDefault();
    const wagerNum = parseInt(currentInputValue, 10);

    if (isNaN(wagerNum) || wagerNum < 0 || wagerNum > maxWager) {
      setError(`Bahis 0 ile ${maxWager} arasında olmalıdır!`);
      return;
    }

    const updatedWagers = { ...wagers, [currentPlayer.id]: wagerNum };
    setWagers(updatedWagers);
    setError(null);
    setCurrentInputValue('0');

    if (currentPlayerIdx < players.length - 1) {
      setCurrentPlayerIdx((prev) => prev + 1);
    } else {
      onConfirmWagers(updatedWagers);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-fade-in select-none">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl text-center space-y-4 animate-scale-up">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-400/10 border border-amber-400/30 text-amber-400 flex items-center justify-center shadow-inner">
          <Flame className="w-8 h-8 fill-current" />
        </div>

        <div className="space-y-1">
          <span className="text-[10px] font-black uppercase text-amber-400 tracking-widest block">
            RİSKLİ FİNAL BAHİS AŞAMASI
          </span>
          <h2 className="text-2xl font-black text-white">
            Sıra <span style={{ color: currentPlayer.color }}>{currentPlayer.name}</span>'da!
          </h2>
          <p className="text-xs text-slate-400">
            Son soru öncesinde puanınızdan gizlice bahis girin.
          </p>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3 text-center space-y-1">
          <span className="text-[10px] font-black text-slate-400 uppercase">Mevcut Puanınız</span>
          <span className="text-2xl font-black text-amber-400 block">{currentPlayer.score} Puan</span>
        </div>

        <form onSubmit={handleNextPlayerWager} className="space-y-3 pt-2">
          <div className="space-y-1 text-left">
            <label className="text-xs font-bold text-slate-300 block">
              Bahis Miktarı (Max: {maxWager}):
            </label>
            <input
              type="number"
              min={0}
              max={maxWager}
              value={currentInputValue}
              onChange={(e) => setCurrentInputValue(e.target.value)}
              className="w-full py-3.5 px-4 rounded-2xl bg-slate-950 border border-slate-700 text-white font-black text-center text-xl focus:border-amber-400 outline-none"
            />
          </div>

          {error && (
            <p className="text-xs font-bold text-rose-500 flex items-center justify-center gap-1">
              <ShieldAlert className="w-4 h-4" /> {error}
            </p>
          )}

          <button
            type="submit"
            className="w-full py-4 rounded-2xl bg-amber-400 text-slate-950 font-black text-sm shadow-xl active:scale-95 transition-transform"
          >
            {currentPlayerIdx < players.length - 1 ? 'Bahsi Onayla (Sıradaki Oyuncu)' : 'Bahisleri Tamamla ve Finale Geç'}
          </button>
        </form>
      </div>
    </div>
  );
};
