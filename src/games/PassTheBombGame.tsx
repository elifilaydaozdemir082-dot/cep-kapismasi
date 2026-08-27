import React, { useState, useRef, useEffect } from 'react';
import { Flame, Play, RefreshCw, Heart, UserPlus, Trash2 } from 'lucide-react';
import type { Player } from '../types/game';
import { getRandomBombPrompt, type BombPrompt } from '../data/bombData';
import { playBeepSound, playFanfareSound, triggerVibration } from '../utils/audio';

interface PassTheBombGameProps {
  mode: 'single' | 'multi';
  players: Player[];
  onFinishGame: (results: { playerId: string; score: number; stats?: Record<string, number | string> }[]) => void;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
}

type GamePhase = 'setup' | 'playing' | 'exploded' | 'finished';

interface BombPlayer {
  id: string;
  name: string;
  color: string;
  lives: number;
  isEliminated: boolean;
  eliminatedRank?: number;
}

export const PassTheBombGame: React.FC<PassTheBombGameProps> = ({
  players,
  onFinishGame,
  soundEnabled,
  vibrationEnabled,
}) => {
  // Game Setup Options
  const [initialLives, setInitialLives] = useState<number>(3);
  const [durationPreset, setDurationPreset] = useState<'short' | 'normal' | 'long'>('normal');

  // Custom Players List (2..8 players allowed)
  const [bombPlayers, setBombPlayers] = useState<BombPlayer[]>([]);
  const [newPlayerName, setNewPlayerName] = useState<string>('');

  // Phase State
  const [phase, setPhase] = useState<GamePhase>('setup');

  // Round State
  const [activePlayerIndex, setActivePlayerIndex] = useState<number>(0);
  const [currentPrompt, setCurrentPrompt] = useState<BombPrompt | null>(null);
  const [usedPromptIds, setUsedPromptIds] = useState<number[]>([]);
  const [roundNumber, setRoundNumber] = useState<number>(1);
  const [holdingPlayer, setHoldingPlayer] = useState<BombPlayer | null>(null);

  // Hidden Bomb Timer State (Invisible to players!)
  const [tensionProgress, setTensionProgress] = useState<number>(0); // 0..100% tension bar
  const roundDurationMsRef = useRef<number>(30000);
  const elapsedMsRef = useRef<number>(0);
  const isFinishedRef = useRef<boolean>(false);
  const isExplodedRef = useRef<boolean>(false);

  // Color palette for adding custom extra players
  const EXTRA_COLORS = ['#38BDF8', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#F43F5E', '#06B6D4'];

  useEffect(() => {
    // Initialize BombPlayers from initial props
    const formatted: BombPlayer[] = players.map((p, idx) => ({
      id: p.id,
      name: p.name,
      color: p.color || EXTRA_COLORS[idx % EXTRA_COLORS.length],
      lives: initialLives,
      isEliminated: false,
    }));
    setBombPlayers(formatted);
  }, [players]);

  const handleAddPlayer = () => {
    if (!newPlayerName.trim() || bombPlayers.length >= 8) return;
    const newId = `custom-p-${Date.now()}`;
    const newColor = EXTRA_COLORS[bombPlayers.length % EXTRA_COLORS.length];
    const newP: BombPlayer = {
      id: newId,
      name: newPlayerName.trim(),
      color: newColor,
      lives: initialLives,
      isEliminated: false,
    };
    setBombPlayers((prev) => [...prev, newP]);
    setNewPlayerName('');
  };

  const handleRemovePlayer = (id: string) => {
    if (bombPlayers.length <= 2) return;
    setBombPlayers((prev) => prev.filter((p) => p.id !== id));
  };

  // Start Game Session
  const handleStartGame = () => {
    if (bombPlayers.length < 2) return;

    // Reset all player lives & elimination status
    const resetPlayers = bombPlayers.map((p) => ({
      ...p,
      lives: initialLives,
      isEliminated: false,
      eliminatedRank: undefined,
    }));
    setBombPlayers(resetPlayers);

    setUsedPromptIds([]);
    setRoundNumber(1);
    isFinishedRef.current = false;
    startNextRound(resetPlayers, 0);
  };

  // Start Next Round with a randomized hidden duration
  const startNextRound = (currentList: BombPlayer[], startIndex: number) => {
    isExplodedRef.current = false;

    // Calculate randomized duration based on preset
    let minMs = 25000;
    let maxMs = 40000;
    if (durationPreset === 'short') {
      minMs = 18000;
      maxMs = 28000;
    } else if (durationPreset === 'long') {
      minMs = 32000;
      maxMs = 50000;
    }

    const duration = Math.floor(Math.random() * (maxMs - minMs)) + minMs;
    roundDurationMsRef.current = duration;
    elapsedMsRef.current = 0;
    setTensionProgress(0);

    // Pick new prompt
    const prompt = getRandomBombPrompt(usedPromptIds);
    setCurrentPrompt(prompt);
    setUsedPromptIds((prev) => [...prev, prompt.id]);

    // Find active player
    const activeIdx = findNextActiveIndex(currentList, startIndex);
    setActivePlayerIndex(activeIdx);
    setHoldingPlayer(currentList[activeIdx]);

    setPhase('playing');
  };

  const findNextActiveIndex = (list: BombPlayer[], fromIdx: number): number => {
    const activeList = list.filter((p) => !p.isEliminated);
    if (activeList.length === 0) return 0;
    const target = list[fromIdx];
    if (target && !target.isEliminated) return fromIdx;

    for (let i = 1; i <= list.length; i++) {
      const idx = (fromIdx + i) % list.length;
      if (!list[idx].isEliminated) return idx;
    }
    return 0;
  };

  // Timer Tick Loop
  useEffect(() => {
    if (phase !== 'playing' || isExplodedRef.current) return;

    const intervalMs = 100;
    const timer = setInterval(() => {
      elapsedMsRef.current += intervalMs;
      const progress = Math.min(100, (elapsedMsRef.current / roundDurationMsRef.current) * 100);
      setTensionProgress(progress);

      // Sound ticker as tension builds up
      if (progress > 50 && elapsedMsRef.current % 500 < 100) {
        playBeepSound(400 + progress * 4, 0.1, soundEnabled);
        if (progress > 85) triggerVibration(30, vibrationEnabled);
      }

      if (elapsedMsRef.current >= roundDurationMsRef.current) {
        clearInterval(timer);
        explodeBomb();
      }
    }, intervalMs);

    return () => clearInterval(timer);
  }, [phase]);

  // Tap "Geçir" Button to Pass Phone
  const handlePassBomb = () => {
    if (phase !== 'playing' || isExplodedRef.current) return;

    playBeepSound(600, 0.15, soundEnabled);
    triggerVibration(20, vibrationEnabled);

    // Find next active player
    let nextIdx = (activePlayerIndex + 1) % bombPlayers.length;
    while (bombPlayers[nextIdx].isEliminated) {
      nextIdx = (nextIdx + 1) % bombPlayers.length;
    }

    setActivePlayerIndex(nextIdx);
    setHoldingPlayer(bombPlayers[nextIdx]);
  };

  // Explosion Resolution
  const explodeBomb = () => {
    if (isExplodedRef.current || phase !== 'playing') return;
    isExplodedRef.current = true;

    playBeepSound(100, 0.8, soundEnabled);
    triggerVibration([100, 50, 100], vibrationEnabled);

    const loser = bombPlayers[activePlayerIndex];
    const newLives = loser.lives - 1;
    const isEliminatedNow = newLives <= 0;

    const activeCount = bombPlayers.filter((p) => !p.isEliminated).length;
    const eliminatedRank = isEliminatedNow ? activeCount : undefined;

    const updatedPlayers = bombPlayers.map((p, idx) =>
      idx === activePlayerIndex
        ? {
            ...p,
            lives: newLives,
            isEliminated: isEliminatedNow,
            eliminatedRank,
          }
        : p
    );

    setBombPlayers(updatedPlayers);
    setPhase('exploded');

    // Check remaining active players
    const remainingActive = updatedPlayers.filter((p) => !p.isEliminated);

    if (remainingActive.length <= 1) {
      // Game Over! Winner found.
      setTimeout(() => {
        setPhase('finished');
        finishGame(updatedPlayers);
      }, 2000);
    }
  };

  const handleNextRoundAfterExplosion = () => {
    const remainingActive = bombPlayers.filter((p) => !p.isEliminated);
    if (remainingActive.length <= 1) {
      setPhase('finished');
      finishGame(bombPlayers);
      return;
    }

    setRoundNumber((r) => r + 1);
    let nextStartIdx = (activePlayerIndex + 1) % bombPlayers.length;
    while (bombPlayers[nextStartIdx].isEliminated) {
      nextStartIdx = (nextStartIdx + 1) % bombPlayers.length;
    }

    startNextRound(bombPlayers, nextStartIdx);
  };

  const finishGame = (finalPlayersList: BombPlayer[]) => {
    if (isFinishedRef.current) return;
    isFinishedRef.current = true;
    playFanfareSound(soundEnabled);

    const winner = finalPlayersList.find((p) => !p.isEliminated) || finalPlayersList[0];

    const results = players.map((p) => {
      const match = finalPlayersList.find((bp) => bp.id === p.id);
      const isWinner = match?.id === winner.id;
      return {
        playerId: p.id,
        score: isWinner ? 100 : (match?.lives || 0) * 20,
        stats: {
          'Kalan Can': match?.lives || 0,
          'Durum': isWinner ? 'Şampiyon' : 'Elendi',
          'Oynanan Raund': roundNumber,
        },
      };
    });

    onFinishGame(results);
  };

  // RENDER SETUP
  if (phase === 'setup') {
    return (
      <div className="flex-1 flex flex-col h-full bg-slate-950 text-white p-4 select-none overflow-y-auto space-y-4 animate-fade-in">
        <div className="text-center space-y-1 my-2">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shadow-inner">
            <Flame className="w-8 h-8 stroke-[2.5]" />
          </div>
          <h2 className="text-2xl font-black text-white">Bomba Kimde?</h2>
          <p className="text-xs text-slate-400 font-medium">Sosyal Parti & Cevap Oyunu</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 space-y-4 shadow-xl">
          {/* Custom Players List */}
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-300 uppercase tracking-wider flex items-center justify-between">
              <span>Oyuncular ({bombPlayers.length}/8)</span>
              <span className="text-[10px] text-slate-400 font-normal">Min 2 oyuncu</span>
            </label>

            <div className="space-y-2">
              {bombPlayers.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between bg-slate-950 border border-slate-800 rounded-xl px-3 py-2"
                >
                  <div className="flex items-center gap-2">
                    <span style={{ backgroundColor: p.color }} className="w-3 h-3 rounded-full" />
                    <span className="text-xs font-black text-white">{p.name}</span>
                  </div>
                  {bombPlayers.length > 2 && (
                    <button
                      onClick={() => handleRemovePlayer(p.id)}
                      className="text-slate-400 hover:text-rose-400 p-1 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {bombPlayers.length < 8 && (
              <div className="flex gap-2 pt-1">
                <input
                  type="text"
                  value={newPlayerName}
                  onChange={(e) => setNewPlayerName(e.target.value)}
                  placeholder="Yeni Oyuncu Adı"
                  maxLength={14}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
                <button
                  onClick={handleAddPlayer}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-400 rounded-xl text-xs font-black flex items-center gap-1 border border-slate-700"
                >
                  <UserPlus className="w-4 h-4" /> Ekle
                </button>
              </div>
            )}
          </div>

          {/* Lives Option */}
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-300 uppercase tracking-wider">Can Hakkı</label>
            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3].map((l) => (
                <button
                  key={l}
                  onClick={() => setInitialLives(l)}
                  className={`py-2 rounded-xl text-xs font-black border transition-all flex items-center justify-center gap-1 ${
                    initialLives === l
                      ? 'bg-rose-500 text-slate-950 border-rose-400 shadow-md'
                      : 'bg-slate-950 text-slate-300 border-slate-800'
                  }`}
                >
                  <Heart className="w-3.5 h-3.5 fill-current" /> {l} Can
                </button>
              ))}
            </div>
          </div>

          {/* Duration Preset */}
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-300 uppercase tracking-wider">Bomba Süresi</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'short', label: 'Kısa (18-28s)' },
                { id: 'normal', label: 'Normal (25-40s)' },
                { id: 'long', label: 'Uzun (32-50s)' },
              ].map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => setDurationPreset(preset.id as any)}
                  className={`py-2 px-1 rounded-xl text-[11px] font-black border transition-all ${
                    durationPreset === preset.id
                      ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-md'
                      : 'bg-slate-950 text-slate-300 border-slate-800'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button
          onClick={handleStartGame}
          className="w-full py-4 rounded-2xl bg-rose-500 hover:bg-rose-400 text-slate-950 font-black text-base shadow-xl shadow-rose-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          <Play className="w-5 h-5 fill-current" />
          <span>Bombayı Ateşle!</span>
        </button>
      </div>
    );
  }

  // RENDER PLAYING
  if (phase === 'playing' && holdingPlayer) {
    return (
      <div className="flex-1 flex flex-col h-full bg-slate-950 text-white p-4 select-none overflow-hidden space-y-3">
        {/* Header Players Scoreboard */}
        <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-2xl px-3 py-2 overflow-x-auto no-scrollbar">
          {bombPlayers.map((p) => (
            <div
              key={p.id}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-xl border text-[11px] font-black transition-all ${
                p.id === holdingPlayer.id
                  ? 'bg-rose-500/20 border-rose-500 text-rose-300 scale-105 shadow-md'
                  : p.isEliminated
                  ? 'opacity-30 line-through bg-slate-950 border-slate-800 text-slate-500'
                  : 'bg-slate-950 border-slate-800 text-slate-300'
              }`}
            >
              <span style={{ color: p.color }}>{p.name}</span>
              <span className="text-rose-400">{'❤️'.repeat(p.lives)}</span>
            </div>
          ))}
        </div>

        {/* Main Bomb Tension Arena */}
        <div className="flex-1 bg-gradient-to-b from-slate-900 via-slate-900/90 to-slate-950 border-2 border-slate-800 rounded-3xl p-6 flex flex-col items-center justify-between shadow-2xl relative">
          {/* Category / Prompt Box */}
          <div className="text-center space-y-2 w-full">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-800 px-3 py-1 rounded-full border border-slate-700">
              Raund {roundNumber} Kuralı
            </span>
            <h3 className="text-2xl font-black text-amber-300 drop-shadow-md">
              {currentPrompt?.prompt}
            </h3>
          </div>

          {/* Animated Custom SVG Bomb Graphic */}
          <div className="relative my-auto flex items-center justify-center">
            <svg
              width="140"
              height="140"
              viewBox="0 0 100 100"
              className={`transition-transform duration-200 ${
                tensionProgress > 75 ? 'animate-bounce scale-110' : tensionProgress > 40 ? 'scale-105' : ''
              }`}
            >
              {/* Bomb Body */}
              <circle cx="50" cy="58" r="34" fill="#0F172A" stroke="#334155" strokeWidth="4" />
              <circle cx="50" cy="58" r="34" fill="url(#bombGradient)" opacity="0.9" />

              {/* Fuse Wick */}
              <path d="M 50 24 Q 60 14 65 8" fill="none" stroke="#D97706" strokeWidth="4" strokeLinecap="round" />

              {/* Flame Spark */}
              <circle cx="65" cy="8" r="6" fill="#F59E0B" className="animate-ping" />
              <circle cx="65" cy="8" r="4" fill="#EF4444" />

              <defs>
                <radialGradient id="bombGradient" cx="30%" cy="30%" r="70%">
                  <stop offset="0%" stopColor="#334155" />
                  <stop offset="100%" stopColor="#020617" />
                </radialGradient>
              </defs>
            </svg>

            {/* Tension Indicator Ring */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div
                style={{ opacity: tensionProgress / 100 }}
                className="w-44 h-44 rounded-full border-4 border-rose-500/60 animate-ping"
              />
            </div>
          </div>

          {/* Active Holding Player Banner */}
          <div className="w-full text-center space-y-3">
            <div className="bg-slate-950 border border-slate-800 rounded-2xl py-3 px-4 shadow-inner">
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-wider">
                Bomba Şu An Kimde?
              </p>
              <h2 style={{ color: holdingPlayer.color }} className="text-2xl font-black drop-shadow">
                {holdingPlayer.name}
              </h2>
            </div>

            {/* Pass Button */}
            <button
              onClick={handlePassBomb}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-400 hover:to-amber-400 text-slate-950 font-black text-lg shadow-xl shadow-rose-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-6 h-6 stroke-[3]" />
              <span>GEÇİR!</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // RENDER EXPLODED
  if (phase === 'exploded' && holdingPlayer) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-slate-950 text-white select-none animate-fade-in space-y-6">
        <div className="w-full max-w-sm bg-slate-900 border-2 border-rose-500/50 rounded-3xl p-6 text-center space-y-6 shadow-2xl animate-scale-up">
          {/* Explosion SVG Graphic */}
          <div className="w-20 h-20 mx-auto rounded-3xl bg-rose-500/20 border-2 border-rose-500 flex items-center justify-center text-rose-400 shadow-xl animate-pulse">
            <Flame className="w-12 h-12 stroke-[2.5]" />
          </div>

          <div className="space-y-1">
            <h2 className="text-3xl font-black text-rose-400 tracking-tight">GÜMM! BOMBA PATLADI!</h2>
            <p style={{ color: holdingPlayer.color }} className="text-lg font-black">
              {holdingPlayer.name} 1 Can Kaybetti!
            </p>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-2">
            <p className="text-xs text-slate-300 font-bold">
              Kalan Can: <span className="text-rose-400 font-black text-base">{holdingPlayer.lives}</span>
            </p>
            {holdingPlayer.lives <= 0 && (
              <p className="text-xs text-rose-400 font-black uppercase tracking-wider bg-rose-500/10 py-1 rounded-xl border border-rose-500/20">
                ELENDİ!
              </p>
            )}
          </div>

          <button
            onClick={handleNextRoundAfterExplosion}
            className="w-full py-4 rounded-2xl bg-rose-500 hover:bg-rose-400 text-slate-950 font-black text-base shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <span>Devam Et</span>
          </button>
        </div>
      </div>
    );
  }

  return null;
};
