import React, { useState, useEffect, useRef } from 'react';
import { Search, Lightbulb, CheckCircle2 } from 'lucide-react';
import type { DifficultyLevel, Player } from '../types/game';
import { wordService } from '../services/wordService';
import { getRandomTurkishLetter, toTurkishUpper } from '../utils/wordUtils';
import { playBeepSound, playFanfareSound, triggerVibration } from '../utils/audio';

interface WordSearchGameProps {
  mode: 'single' | 'multi';
  players: Player[];
  difficulty?: DifficultyLevel;
  onFinishGame: (results: { playerId: string; score: number; stats?: Record<string, number | string> }[]) => void;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
}

interface GridCell {
  r: number;
  c: number;
  letter: string;
}

interface PlacedWord {
  word: string;
  cells: { r: number; c: number }[];
  found: boolean;
}

export const WordSearchGame: React.FC<WordSearchGameProps> = ({
  mode,
  players,
  difficulty = 'normal',
  onFinishGame,
  soundEnabled,
  vibrationEnabled,
}) => {
  const [grid, setGrid] = useState<GridCell[][]>([]);
  const [placedWords, setPlacedWords] = useState<PlacedWord[]>([]);
  const [foundWords, setFoundWords] = useState<string[]>([]);

  // Drag selection state
  const [startCell, setStartCell] = useState<{ r: number; c: number } | null>(null);
  const [currentCell, setCurrentCell] = useState<{ r: number; c: number } | null>(null);

  // Single player timer
  const [timeLeft, setTimeLeft] = useState<number>(
    difficulty === 'hard' ? 180 : difficulty === 'normal' ? 300 : 480
  );

  // Multiplayer turn timer
  const [multiTurnLeft, setMultiTurnLeft] = useState<number>(20);
  const [currentPlayerIdx, setCurrentPlayerIdx] = useState<number>(0);
  const [playerScores, setPlayerScores] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    players.forEach((p) => (initial[p.id] = 0));
    return initial;
  });

  const [flashingCell, setFlashingCell] = useState<{ r: number; c: number } | null>(null);
  const isFinishedRef = useRef<boolean>(false);

  // Generate 8x8 Grid & Place 6-8 Words
  useEffect(() => {
    generateBoard();
  }, []);

  const generateBoard = () => {
    const allWords = wordService.getAllWords().map((w) => toTurkishUpper(w.word));
    // Filter words between 3 and 7 chars
    const candidateWords = allWords.filter((w) => w.length >= 3 && w.length <= 7);
    const shuffled = [...candidateWords].sort(() => Math.random() - 0.5).slice(0, 8);

    const size = 8;
    const newGrid: string[][] = Array.from({ length: size }, () => Array(size).fill(''));
    const placed: PlacedWord[] = [];

    const directions = [
      { dr: 0, dc: 1 },  // Horizontal
      { dr: 1, dc: 0 },  // Vertical
      { dr: 1, dc: 1 },  // Diagonal down-right
      { dr: -1, dc: 1 }, // Diagonal up-right
    ];

    shuffled.forEach((word) => {
      let isPlaced = false;
      let attempts = 0;

      while (!isPlaced && attempts < 50) {
        attempts++;
        const dir = directions[Math.floor(Math.random() * directions.length)];
        const startR = Math.floor(Math.random() * size);
        const startC = Math.floor(Math.random() * size);

        const endR = startR + dir.dr * (word.length - 1);
        const endC = startC + dir.dc * (word.length - 1);

        if (endR >= 0 && endR < size && endC >= 0 && endC < size) {
          // Check collision
          let fits = true;
          for (let i = 0; i < word.length; i++) {
            const r = startR + dir.dr * i;
            const c = startC + dir.dc * i;
            if (newGrid[r][c] !== '' && newGrid[r][c] !== word[i]) {
              fits = false;
              break;
            }
          }

          if (fits) {
            const wordCells: { r: number; c: number }[] = [];
            for (let i = 0; i < word.length; i++) {
              const r = startR + dir.dr * i;
              const c = startC + dir.dc * i;
              newGrid[r][c] = word[i];
              wordCells.push({ r, c });
            }
            placed.push({ word, cells: wordCells, found: false });
            isPlaced = true;
          }
        }
      }
    });

    // Fill remaining cells with random Turkish letters
    const finalGrid: GridCell[][] = newGrid.map((row, r) =>
      row.map((cell, c) => ({
        r,
        c,
        letter: cell || getRandomTurkishLetter(),
      }))
    );

    setGrid(finalGrid);
    setPlacedWords(placed);
    setFoundWords([]);
  };

  // Timer loop
  useEffect(() => {
    if (isFinishedRef.current) return;

    const interval = setInterval(() => {
      if (mode === 'single') {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            finishGame();
            return 0;
          }
          return prev - 1;
        });
      } else {
        setMultiTurnLeft((prev) => {
          if (prev <= 1) {
            setCurrentPlayerIdx((idx) => (idx + 1) % players.length);
            return 20;
          }
          return prev - 1;
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [mode, players]);

  // Pointer Events Selection
  const handlePointerDown = (r: number, c: number) => {
    setStartCell({ r, c });
    setCurrentCell({ r, c });
  };

  const handlePointerEnter = (r: number, c: number) => {
    if (startCell) {
      setCurrentCell({ r, c });
    }
  };

  const handlePointerUp = () => {
    if (!startCell || !currentCell) return;

    const selectedCells = getStraightLineCells(startCell, currentCell);
    const selectedText = selectedCells.map(({ r, c }) => grid[r][c].letter).join('');
    const reversedText = selectedText.split('').reverse().join('');

    const match = placedWords.find(
      (pw) => !pw.found && (pw.word === selectedText || pw.word === reversedText)
    );

    if (match) {
      // Word Found!
      playFanfareSound(soundEnabled);
      triggerVibration([20, 30], vibrationEnabled);

      setFoundWords((prev) => [...prev, match.word]);
      setPlacedWords((prev) =>
        prev.map((pw) => (pw.word === match.word ? { ...pw, found: true } : pw))
      );

      if (mode === 'multi') {
        const p = players[currentPlayerIdx];
        const earned = match.word.length * 10;
        setPlayerScores((prev) => ({ ...prev, [p.id]: prev[p.id] + earned }));
      }

      // Check if all words are found!
      if (foundWords.length + 1 >= placedWords.length) {
        setTimeout(() => finishGame(), 500);
      }
    } else {
      playBeepSound(200, 0.1, soundEnabled);
    }

    setStartCell(null);
    setCurrentCell(null);
  };

  const getStraightLineCells = (
    start: { r: number; c: number },
    end: { r: number; c: number }
  ) => {
    const dr = end.r - start.r;
    const dc = end.c - start.c;
    const steps = Math.max(Math.abs(dr), Math.abs(dc));
    if (steps === 0) return [start];

    const stepR = dr === 0 ? 0 : dr / Math.abs(dr);
    const stepC = dc === 0 ? 0 : dc / Math.abs(dc);

    // Only allow straight horizontal, vertical, diagonal lines
    if (Math.abs(dr) !== 0 && Math.abs(dc) !== 0 && Math.abs(dr) !== Math.abs(dc)) {
      return [start];
    }

    const result = [];
    for (let i = 0; i <= steps; i++) {
      result.push({ r: start.r + stepR * i, c: start.c + stepC * i });
    }
    return result;
  };

  const handleHint = () => {
    const unfound = placedWords.find((pw) => !pw.found);
    if (unfound && unfound.cells.length > 0) {
      playBeepSound(700, 0.1, soundEnabled);
      setFlashingCell(unfound.cells[0]);
      setTimeout(() => setFlashingCell(null), 1500);
    }
  };

  const finishGame = () => {
    if (isFinishedRef.current) return;
    isFinishedRef.current = true;

    if (mode === 'single') {
      const score = foundWords.length * 15;
      onFinishGame([
        {
          playerId: players[0].id,
          score,
          stats: {
            'Bulunan Kelime': `${foundWords.length}/${placedWords.length}`,
            'Kalan Süre': `${timeLeft}s`,
          },
        },
      ]);
    } else {
      const results = players.map((p) => ({
        playerId: p.id,
        score: playerScores[p.id] || 0,
      }));
      onFinishGame(results);
    }
  };

  const activeSelection =
    startCell && currentCell ? getStraightLineCells(startCell, currentCell) : [];

  return (
    <div
      onPointerUp={handlePointerUp}
      className="relative flex-1 flex flex-col h-full w-full bg-slate-950 text-white select-none overflow-hidden touch-none p-3"
    >
      {/* Header */}
      <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-2xl px-4 py-2.5 shadow-md mb-2">
        <div className="flex items-center gap-2">
          <Search className="w-5 h-5 text-cyan-400" />
          <span className="font-extrabold text-sm text-white">Kelime Avı</span>
        </div>

        <div className="flex items-center gap-2">
          {mode === 'single' ? (
            <span className="text-sm font-black text-amber-400 bg-amber-400/10 border border-amber-400/20 px-3 py-1 rounded-full">
              Süre: {timeLeft}s
            </span>
          ) : (
            <span className="text-xs font-black text-cyan-400">
              Sıra: {players[currentPlayerIdx]?.name} ({multiTurnLeft}s)
            </span>
          )}

          <button
            onClick={handleHint}
            className="p-1.5 rounded-xl bg-amber-400/20 border border-amber-400/30 text-amber-400 text-xs font-black active:scale-95"
          >
            <Lightbulb className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 8x8 Grid Canvas */}
      <div className="flex-1 bg-slate-900 border border-slate-800 rounded-3xl p-2 flex flex-col justify-center items-center my-auto shadow-2xl overflow-hidden">
        <div className="grid grid-cols-8 gap-1.5 w-full max-w-xs aspect-square">
          {grid.map((row, r) =>
            row.map((cell, c) => {
              const isSelected = activeSelection.some((sc) => sc.r === r && sc.c === c);
              const isFound = placedWords.some(
                (pw) => pw.found && pw.cells.some((sc) => sc.r === r && sc.c === c)
              );
              const isFlashing = flashingCell?.r === r && flashingCell?.c === c;

              return (
                <div
                  key={`${r}-${c}`}
                  onPointerDown={() => handlePointerDown(r, c)}
                  onPointerEnter={() => handlePointerEnter(r, c)}
                  className={`rounded-xl flex items-center justify-center font-black text-base shadow transition-all duration-75 select-none touch-none ${
                    isFound
                      ? 'bg-emerald-500 text-slate-950 border-2 border-white font-extrabold'
                      : isSelected
                      ? 'bg-cyan-500 text-slate-950 border-2 border-white scale-105'
                      : isFlashing
                      ? 'bg-amber-400 text-slate-950 animate-bounce'
                      : 'bg-slate-950 border border-slate-800 text-slate-200'
                  }`}
                >
                  {cell.letter}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Words to Find List */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 mt-2 shadow-inner">
        <span className="text-[10px] font-black uppercase text-slate-400 block mb-1">
          Bulunacak Kelimeler ({foundWords.length}/{placedWords.length})
        </span>
        <div className="flex flex-wrap gap-2 text-xs font-black">
          {placedWords.map((pw, i) => (
            <div
              key={i}
              className={`px-3 py-1 rounded-xl border flex items-center gap-1 ${
                pw.found
                  ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400 line-through'
                  : 'bg-slate-950 border-slate-800 text-slate-300'
              }`}
            >
              {pw.found && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
              <span>{pw.word}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
