import type { Player } from '../types/game';

export interface RankedPlayer extends Player {
  rank: number;
  isWinner: boolean;
  isTieForWinner: boolean;
}

export function calculatePlayerRankings(
  players: Player[],
  isLowerScoreBetter: boolean = false
): RankedPlayer[] {
  if (players.length === 0) return [];

  // Sort players by score
  const sorted = [...players].sort((a, b) => {
    return isLowerScoreBetter ? a.score - b.score : b.score - a.score;
  });

  const topScore = sorted[0].score;
  const winnerCount = sorted.filter((p) => p.score === topScore).length;
  const isTieForWinner = winnerCount > 1;

  let currentRank = 1;
  const ranked: RankedPlayer[] = [];

  for (let i = 0; i < sorted.length; i++) {
    if (
      i > 0 &&
      (isLowerScoreBetter
        ? sorted[i].score > sorted[i - 1].score
        : sorted[i].score < sorted[i - 1].score)
    ) {
      currentRank = i + 1;
    }

    const isWinner = sorted[i].score === topScore;

    ranked.push({
      ...sorted[i],
      rank: currentRank,
      isWinner,
      isTieForWinner: isWinner && isTieForWinner,
    });
  }

  return ranked;
}
