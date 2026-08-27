export interface TargetGameState {
  score: number;
  hits: number;
  misses: number;
  trapHits: number;
  currentStreak: number;
  bestStreak: number;
  totalAttempts: number;
  accuracy: number;
}

export type TargetHitType = 'normal' | 'golden' | 'trap' | 'miss';

export const INITIAL_TARGET_GAME_STATE: TargetGameState = {
  score: 0,
  hits: 0,
  misses: 0,
  trapHits: 0,
  currentStreak: 0,
  bestStreak: 0,
  totalAttempts: 0,
  accuracy: 0,
};

export function getMultiplier(streak: number): number {
  return Math.min(4, 1 + Math.floor(streak / 5));
}

export function calculateTargetScore(
  prevState: TargetGameState,
  hitType: TargetHitType
): TargetGameState {
  let { score, hits, misses, trapHits, currentStreak, bestStreak } = prevState;

  if (hitType === 'normal' || hitType === 'golden') {
    hits += 1;
    currentStreak += 1;
    if (currentStreak > bestStreak) {
      bestStreak = currentStreak;
    }
    const multiplier = getMultiplier(currentStreak);
    const basePoints = hitType === 'normal' ? 10 : 25;
    score += basePoints * multiplier;
  } else if (hitType === 'trap') {
    trapHits += 1;
    currentStreak = 0;
    score = Math.max(0, score - 15);
  } else if (hitType === 'miss') {
    misses += 1;
    currentStreak = 0;
  }

  const totalAttempts = hits + misses + trapHits;
  const accuracy = totalAttempts > 0 ? (hits / totalAttempts) * 100 : 0;

  return {
    score,
    hits,
    misses,
    trapHits,
    currentStreak,
    bestStreak,
    totalAttempts,
    accuracy,
  };
}
