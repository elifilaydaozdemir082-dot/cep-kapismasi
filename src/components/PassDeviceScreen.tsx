import React from 'react';
import { Smartphone, CheckCircle2, ShieldAlert } from 'lucide-react';

interface PassDeviceScreenProps {
  activeName: string;
  activeColor?: string;
  roundInfo?: string;
  onReady: () => void;
}

export const PassDeviceScreen: React.FC<PassDeviceScreenProps> = ({
  activeName,
  activeColor = '#38BDF8',
  roundInfo,
  onReady,
}) => {
  return (
    <div className="flex-1 flex flex-col items-center justify-between p-6 bg-slate-950 text-white select-none animate-fade-in">
      {/* Top Banner */}
      <div className="w-full flex items-center justify-between bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3 shadow-md">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-amber-400" />
          <span className="font-extrabold text-xs text-white">Gizlilik Ekranı</span>
        </div>
        {roundInfo && (
          <span className="text-xs font-black text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-3 py-1 rounded-full">
            {roundInfo}
          </span>
        )}
      </div>

      {/* Main Pass Device Card */}
      <div className="w-full max-w-sm bg-gradient-to-b from-slate-900 via-slate-900/90 to-slate-950 border-2 border-slate-800 rounded-3xl p-6 text-center space-y-6 shadow-2xl flex flex-col items-center my-auto">
        <div className="w-20 h-20 rounded-3xl bg-cyan-500/10 border-2 border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-inner animate-pulse">
          <Smartphone className="w-10 h-10 stroke-[2.5]" aria-hidden="true" />
        </div>

        <div className="space-y-2">
          <p className="text-xs text-slate-400 font-extrabold uppercase tracking-wider">
            Sıradaki Oyuncu / Takım
          </p>
          <h2
            style={{ color: activeColor }}
            className="text-2xl font-black drop-shadow-md"
          >
            {activeName}
          </h2>
        </div>

        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 space-y-1">
          <p className="text-xs text-slate-300 font-bold leading-relaxed">
            Sıra <span style={{ color: activeColor }} className="font-black">{activeName}</span> tarafında.
          </p>
          <p className="text-[11px] text-slate-400">
            Telefonu ilgili oyuncuya verin. Gizli içerik buton ile açılacaktır.
          </p>
        </div>

        <button
          onClick={onReady}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-base shadow-xl shadow-cyan-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
          <span>Hazırım, Başlat!</span>
        </button>
      </div>
    </div>
  );
};
