import React, { useState, useEffect } from 'react';
import {
  Gift,
  CheckCircle2,
  Trophy,
  Lock,
  ArrowRightLeft,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import type { Player } from '../types/game';
import type { BoxItem } from '../types/boxDeal';
import {
  LARGE_BOX_VALUES,
  SMALL_BOX_VALUES,
  calculateBankerOffer,
  calculateRiskLevel,
  formatPointValue,
  getTargetBoxesToOpenForRound,
  initializeShuffledBoxes,
} from '../utils/boxDealUtils';
import { playBeepSound, playFanfareSound, playTapSound, triggerVibration } from '../utils/audio';
import { storageService } from '../services/storage';

interface BoxDealGameProps {
  mode: 'single' | 'multi';
  players: Player[];
  onFinishGame: (results: { playerId: string; score: number; stats?: Record<string, number | string> }[]) => void;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
}

export const BoxDealGame: React.FC<BoxDealGameProps> = ({
  mode,
  players,
  onFinishGame,
  soundEnabled,
  vibrationEnabled,
}) => {
  const [currentPlayerIdx, setCurrentPlayerIdx] = useState<number>(0);
  const [stage, setStage] = useState<'handoff' | 'selecting-personal' | 'opening-boxes' | 'banker-offer' | 'swap-choice' | 'summary'>(
    mode === 'multi' ? 'handoff' : 'selecting-personal'
  );

  // Game Board State
  const [boxes, setBoxes] = useState<BoxItem[]>([]);
  const [personalBoxId, setPersonalBoxId] = useState<number | null>(null);
  const [openedBoxAnimValue, setOpenedBoxAnimValue] = useState<{ id: number; value: number } | null>(null);

  // Rounds & Offers State
  const [currentRound, setCurrentRound] = useState<number>(1);
  const [boxesToOpenInRound, setBoxesToOpenInRound] = useState<number>(5);
  const [boxesOpenedInRound, setBoxesOpenedInRound] = useState<number>(0);

  const [currentOffer, setCurrentOffer] = useState<number | null>(null);
  const [previousOffer, setPreviousOffer] = useState<number | null>(null);
  const [highestRejectedOffer, setHighestRejectedOffer] = useState<number>(0);

  // Multi player scores store
  const [multiPlayerScores, setMultiPlayerScores] = useState<Record<string, { score: number; openedCount: number }>>({});

  const currentPlayer = players[currentPlayerIdx] || players[0];

  useEffect(() => {
    startNewPlayerGame();
  }, [currentPlayerIdx]);

  const startNewPlayerGame = () => {
    const freshBoxes = initializeShuffledBoxes();
    setBoxes(freshBoxes);
    setPersonalBoxId(null);
    setCurrentRound(1);
    setBoxesToOpenInRound(5);
    setBoxesOpenedInRound(0);
    setCurrentOffer(null);
    setPreviousOffer(null);
    setHighestRejectedOffer(0);
    setOpenedBoxAnimValue(null);

    if (mode === 'multi') {
      setStage('handoff');
    } else {
      setStage('selecting-personal');
    }
  };

  const handleSelectPersonalBox = (boxId: number) => {
    playFanfareSound(soundEnabled);
    triggerVibration([20, 30], vibrationEnabled);

    setPersonalBoxId(boxId);
    setBoxes((prev) =>
      prev.map((b) => (b.id === boxId ? { ...b, isPersonal: true } : b))
    );
    setStage('opening-boxes');
  };

  const handleOpenBox = (box: BoxItem) => {
    if (stage !== 'opening-boxes' || box.isOpen || box.isPersonal || openedBoxAnimValue) {
      return;
    }

    if (box.value >= 50000) {
      playBeepSound(200, 0.4, soundEnabled);
    } else {
      playTapSound(soundEnabled);
    }
    triggerVibration(15, vibrationEnabled);

    setOpenedBoxAnimValue({ id: box.id, value: box.value });

    setBoxes((prev) =>
      prev.map((b) => (b.id === box.id ? { ...b, isOpen: true } : b))
    );

    const nextOpenedInRound = boxesOpenedInRound + 1;
    setBoxesOpenedInRound(nextOpenedInRound);

    setTimeout(() => {
      setOpenedBoxAnimValue(null);

      if (nextOpenedInRound >= boxesToOpenInRound) {
        const remainingUnopened = boxes.filter(
          (b) => !b.isOpen && b.id !== box.id
        );

        if (remainingUnopened.length === 2) {
          setStage('swap-choice');
        } else if (remainingUnopened.length > 2) {
          const offer = calculateBankerOffer(remainingUnopened, currentRound);
          setPreviousOffer(currentOffer);
          setCurrentOffer(offer);
          setStage('banker-offer');
        } else {
          finishPlayerGame(false);
        }
      }
    }, 1400);
  };

  const handleAcceptOffer = () => {
    if (!currentOffer) return;
    playFanfareSound(soundEnabled);
    triggerVibration([30, 40], vibrationEnabled);
    finishPlayerGame(true);
  };

  const handleRejectOffer = () => {
    playBeepSound(500, 0.1, soundEnabled);
    triggerVibration(20, vibrationEnabled);

    if (currentOffer && currentOffer > highestRejectedOffer) {
      setHighestRejectedOffer(currentOffer);
    }

    const nextRound = currentRound + 1;
    setCurrentRound(nextRound);
    setBoxesToOpenInRound(getTargetBoxesToOpenForRound(nextRound));
    setBoxesOpenedInRound(0);
    setStage('opening-boxes');
  };

  const handleSwapChoice = (swap: boolean) => {
    playFanfareSound(soundEnabled);
    triggerVibration([20, 30], vibrationEnabled);

    if (swap) {
      const remainingUnopenedOther = boxes.find(
        (b) => !b.isOpen && !b.isPersonal
      );
      if (remainingUnopenedOther && personalBoxId) {
        setBoxes((prev) =>
          prev.map((b) => {
            if (b.id === personalBoxId) return { ...b, isPersonal: false };
            if (b.id === remainingUnopenedOther.id) return { ...b, isPersonal: true };
            return b;
          })
        );
      }
    }

    finishPlayerGame(false);
  };

  const finishPlayerGame = (accepted: boolean) => {
    const personalBox = boxes.find((b) => b.isPersonal) || boxes[0];
    const personalValue = personalBox ? personalBox.value : 0;
    const finalScore = accepted && currentOffer ? currentOffer : personalValue;

    if (mode === 'single') {
      storageService.saveSingleScore(
        'box-deal',
        'normal',
        currentPlayer.name,
        finalScore,
        'puan',
        false
      );

      const decisionImpact = accepted && currentOffer ? currentOffer - personalValue : personalValue - (highestRejectedOffer || 0);

      onFinishGame([
        {
          playerId: currentPlayer.id,
          score: finalScore,
          stats: {
            'Kazanılan Puan': `${formatPointValue(finalScore)} puan`,
            'Kendi Kutusu': `${formatPointValue(personalValue)} puan`,
            'Kabul Edilen Teklif': accepted && currentOffer ? `${formatPointValue(currentOffer)} puan` : 'Reddedildi',
            'En Yüksek Reddedilen': highestRejectedOffer > 0 ? `${formatPointValue(highestRejectedOffer)} puan` : 'Yok',
            'Karar Etkisi': `${decisionImpact >= 0 ? '+' : ''}${formatPointValue(decisionImpact)} puan`,
          },
        },
      ]);
    } else {
      const openedCount = boxes.filter((b) => b.isOpen).length;
      const updatedScores = {
        ...multiPlayerScores,
        [currentPlayer.id]: { score: finalScore, openedCount },
      };
      setMultiPlayerScores(updatedScores);

      if (currentPlayerIdx < players.length - 1) {
        setCurrentPlayerIdx((prev) => prev + 1);
      } else {
        const results = players.map((p) => ({
          playerId: p.id,
          score: updatedScores[p.id]?.score || 0,
          stats: {
            'Açılan Kutu': updatedScores[p.id]?.openedCount || 0,
          },
        }));
        onFinishGame(results);
      }
    }
  };

  const remainingUnopenedBoxes = boxes.filter((b) => !b.isOpen);
  const remainingValues = remainingUnopenedBoxes.map((b) => b.value);
  const maxRemainingValue = remainingValues.length > 0 ? Math.max(...remainingValues) : 0;
  const avgRemainingValue = remainingValues.length > 0 ? Math.round(remainingValues.reduce((a, b) => a + b, 0) / remainingValues.length) : 0;
  const riskInfo = calculateRiskLevel(remainingUnopenedBoxes);

  const personalBox = boxes.find((b) => b.isPersonal);

  return (
    <div className="relative flex-1 flex flex-col h-full w-full bg-slate-950 text-white select-none overflow-hidden touch-none p-3 space-y-2">
      {/* 1. MULTIPLAYER PRIVACY HANDOFF SCREEN */}
      {stage === 'handoff' && (
        <div className="flex-1 flex flex-col justify-center items-center text-center p-6 space-y-5 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl animate-scale-up my-auto">
          <div className="w-16 h-16 rounded-2xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400">
            <Lock className="w-8 h-8 stroke-[2.5]" aria-hidden="true" />
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest block">
              SIRA DEĞİŞİMİ
            </span>
            <h2 className="text-2xl font-black text-white">
              Sıra <span style={{ color: currentPlayer.color }}>{currentPlayer.name}</span>'da!
            </h2>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              Telefonu {currentPlayer.name} isimli oyuncuya verin. Hazır olduğunda butonuna basın.
            </p>
          </div>

          <button
            onClick={() => setStage('selecting-personal')}
            className="w-full max-w-xs py-4 rounded-2xl bg-amber-400 text-slate-950 font-black text-sm shadow-xl active:scale-95 transition-transform"
          >
            Hazırım, Kutumu Seçeyim!
          </button>
        </div>
      )}

      {/* 2. GAME ARENA */}
      {stage !== 'handoff' && stage !== 'summary' && (
        <>
          {/* Top Status & Risk Header Panel */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 shadow-md space-y-2">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <Gift className="w-5 h-5 text-amber-400" aria-hidden="true" />
                <span className="font-extrabold text-sm text-white">Kutunu Seç</span>
              </div>

              <div className="flex items-center gap-2 text-xs font-black">
                {stage === 'selecting-personal' ? (
                  <span className="text-amber-400 animate-pulse">Kendi Kutunu Seç!</span>
                ) : (
                  <span className="text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-3 py-1 rounded-full">
                    Tur {currentRound} (Kalan: {boxesToOpenInRound - boxesOpenedInRound} Kutu)
                  </span>
                )}
              </div>
            </div>

            {/* Risk Indicators Bar */}
            {stage === 'opening-boxes' && (
              <div className="grid grid-cols-3 gap-2 text-[10px] font-black">
                <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-1.5 text-center">
                  <span className="text-slate-400 block">En Yüksek</span>
                  <span className="text-amber-400 text-xs">{formatPointValue(maxRemainingValue)}</span>
                </div>

                <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-1.5 text-center">
                  <span className="text-slate-400 block">Ortalama</span>
                  <span className="text-cyan-300 text-xs">{formatPointValue(avgRemainingValue)}</span>
                </div>

                <div className={`border rounded-xl p-1.5 text-center flex flex-col items-center justify-center ${riskInfo.colorClass}`}>
                  <span className="block">{riskInfo.label}</span>
                </div>
              </div>
            )}
          </div>

          {/* MAIN 3-COLUMN LAYOUT */}
          <div className="flex-1 grid grid-cols-12 gap-2 overflow-hidden my-auto">
            {/* Left 10 Small Values Panel */}
            <div className="col-span-2 flex flex-col justify-between space-y-1">
              {SMALL_BOX_VALUES.map((val) => {
                const isEliminated = !boxes.some((b) => !b.isOpen && b.value === val);
                return (
                  <div
                    key={val}
                    className={`py-1 px-1 rounded-lg text-[10px] font-black text-center transition-all ${
                      isEliminated
                        ? 'bg-slate-900/40 text-slate-700 border border-slate-950 opacity-30 line-through'
                        : 'bg-rose-950/80 border border-rose-600/40 text-rose-300 shadow-sm'
                    }`}
                  >
                    {formatPointValue(val)}
                  </div>
                );
              })}
            </div>

            {/* Center 20 Boxes Grid */}
            <div className="col-span-8 flex flex-col justify-between space-y-2">
              {personalBox && (
                <div className="bg-amber-500/10 border-2 border-amber-400/80 rounded-2xl p-2 flex items-center justify-between shadow-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-amber-400 text-slate-950 font-black text-sm flex items-center justify-center shadow">
                      {personalBox.id}
                    </div>
                    <div className="text-left">
                      <span className="text-[10px] font-black uppercase text-amber-400 block">KİŞİSEL KUTUNUZ</span>
                      <span className="text-xs font-bold text-slate-300">Kilitli ve Güvende</span>
                    </div>
                  </div>
                  <Lock className="w-5 h-5 text-amber-400" aria-hidden="true" />
                </div>
              )}

              <div className="grid grid-cols-4 gap-2 my-auto">
                {boxes.map((box) => {
                  if (box.isPersonal) return null;

                  return (
                    <button
                      key={box.id}
                      onClick={() => {
                        if (stage === 'selecting-personal') handleSelectPersonalBox(box.id);
                        else if (stage === 'opening-boxes') handleOpenBox(box);
                      }}
                      disabled={box.isOpen || !!openedBoxAnimValue}
                      className={`aspect-square rounded-2xl font-black text-lg flex flex-col items-center justify-center shadow-lg transition-all border-2 active:scale-90 ${
                        box.isOpen
                          ? 'bg-slate-900 border-slate-800 text-slate-700 opacity-20 cursor-default'
                          : stage === 'selecting-personal'
                          ? 'bg-amber-500 hover:bg-amber-400 border-amber-300 text-slate-950 animate-pulse'
                          : 'bg-slate-900 border-slate-700 text-white hover:border-cyan-500 hover:bg-slate-850'
                      }`}
                    >
                      <Gift className="w-5 h-5 opacity-70 mb-0.5" aria-hidden="true" />
                      <span>{box.id}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right 10 Large Values Panel */}
            <div className="col-span-2 flex flex-col justify-between space-y-1">
              {LARGE_BOX_VALUES.map((val) => {
                const isEliminated = !boxes.some((b) => !b.isOpen && b.value === val);
                return (
                  <div
                    key={val}
                    className={`py-1 px-1 rounded-lg text-[10px] font-black text-center transition-all ${
                      isEliminated
                        ? 'bg-slate-900/40 text-slate-700 border border-slate-950 opacity-30 line-through'
                        : 'bg-amber-500/20 border border-amber-400/50 text-amber-300 shadow-sm'
                    }`}
                  >
                    {formatPointValue(val)}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* 3. OPENED BOX ANIMATION REVEAL MODAL */}
      {openedBoxAnimValue && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div
            className={`w-full max-w-xs rounded-3xl p-6 border-2 text-center space-y-3 shadow-2xl animate-scale-up ${
              openedBoxAnimValue.value >= 50000
                ? 'bg-rose-950 border-rose-500 text-rose-300'
                : openedBoxAnimValue.value >= 2500
                ? 'bg-amber-950 border-amber-400 text-amber-300'
                : 'bg-slate-900 border-slate-700 text-cyan-300'
            }`}
          >
            <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-950/60 border border-current flex items-center justify-center font-black text-xl">
              Kutu {openedBoxAnimValue.id}
            </div>

            <span className="text-[10px] font-black uppercase tracking-widest block opacity-80">
              KUTUDAN ÇIKAN DEĞER
            </span>

            <div className="text-3xl font-black tracking-tight">
              {formatPointValue(openedBoxAnimValue.value)} <span className="text-sm font-bold">puan</span>
            </div>
          </div>
        </div>
      )}

      {/* 4. BANKER OFFER MODAL */}
      {stage === 'banker-offer' && currentOffer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-fade-in select-none">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl text-center space-y-4 animate-scale-up">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-400/10 border border-amber-400/30 text-amber-400 flex items-center justify-center shadow-inner">
              <Trophy className="w-8 h-8 stroke-[2.5]" aria-hidden="true" />
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase text-amber-400 tracking-widest block">
                TUR {currentRound} TEKLİFİ
              </span>
              <h2 className="text-xl font-black text-white">Sistemin Puan Teklifi</h2>
            </div>

            <div className="bg-slate-950 border-2 border-amber-400/80 rounded-2xl p-4 text-center space-y-1 shadow-inner">
              <span className="text-[10px] font-black text-slate-400 uppercase block">TEKLİF EDİLEN MİKTAR</span>
              <div className="text-3xl font-black text-amber-400">
                {formatPointValue(currentOffer)} <span className="text-base font-bold text-slate-300">puan</span>
              </div>

              {previousOffer && (
                <div className="flex items-center justify-center gap-1 text-xs font-extrabold pt-1">
                  {currentOffer >= previousOffer ? (
                    <span className="text-emerald-400 flex items-center gap-0.5">
                      <TrendingUp className="w-3.5 h-3.5" aria-hidden="true" /> +{formatPointValue(currentOffer - previousOffer)} puan arttı
                    </span>
                  ) : (
                    <span className="text-rose-400 flex items-center gap-0.5">
                      <TrendingDown className="w-3.5 h-3.5" aria-hidden="true" /> -{formatPointValue(previousOffer - currentOffer)} puan düştü
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={handleRejectOffer}
                className="py-4 rounded-2xl bg-slate-800 hover:bg-slate-750 text-white border border-slate-700 font-black text-xs active:scale-95 transition-transform"
              >
                Devam Et
              </button>
              <button
                onClick={handleAcceptOffer}
                className="py-4 rounded-2xl bg-amber-400 text-slate-950 font-black text-xs shadow-xl active:scale-95 transition-transform flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4 stroke-[3]" aria-hidden="true" /> Teklifi Kabul Et
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. FINAL 2-BOX SWAP CHOICE MODAL */}
      {stage === 'swap-choice' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-fade-in select-none">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl text-center space-y-4 animate-scale-up">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center shadow-inner">
              <ArrowRightLeft className="w-8 h-8 stroke-[2.5]" aria-hidden="true" />
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase text-cyan-400 tracking-widest block">
                FİNAL KARARI
              </span>
              <h2 className="text-xl font-black text-white">Kutunu Değiştirmek İster misin?</h2>
              <p className="text-xs text-slate-400">
                Son iki kutu kaldı. Kendi kutunu saklayabilir veya kalan kutuyla değiştirebilirsin.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => handleSwapChoice(false)}
                className="py-4 rounded-2xl bg-slate-800 text-white font-black text-xs border border-slate-700 active:scale-95 transition-transform"
              >
                Kutumu Tut ({personalBox?.id})
              </button>
              <button
                onClick={() => handleSwapChoice(true)}
                className="py-4 rounded-2xl bg-cyan-500 text-slate-950 font-black text-xs shadow-xl active:scale-95 transition-transform flex items-center justify-center gap-1"
              >
                <ArrowRightLeft className="w-4 h-4 stroke-[3]" aria-hidden="true" /> Kutumu Değiştir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
