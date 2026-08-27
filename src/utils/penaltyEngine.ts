export type ShotOutcome = 'goal' | 'saved' | 'post' | 'missed';

export type ShotPhase =
  | 'ready'
  | 'aiming'
  | 'shooting'
  | 'resolved'
  | 'next-shot'
  | 'finished';

export type KeeperDiveZone =
  | 'left'
  | 'top-left'
  | 'center'
  | 'right'
  | 'top-right';

export type DifficultyLevel = 'easy' | 'normal' | 'hard';

export interface Point2D {
  x: number; // 0..100%
  y: number; // 0..100%
}

export interface PenaltyStats {
  shotsTaken: number;
  goals: number;
  saves: number;
  posts: number;
  misses: number;
  currentStreak: number;
  bestStreak: number;
  score: number;
}

export const INITIAL_PENALTY_STATS: PenaltyStats = {
  shotsTaken: 0,
  goals: 0,
  saves: 0,
  posts: 0,
  misses: 0,
  currentStreak: 0,
  bestStreak: 0,
  score: 0,
};

// Official Goal Frame Boundaries in Normalized Pitch %
export const GOAL_FRAME = {
  leftPostX: 20,
  rightPostX: 80,
  crossbarY: 18,
  groundY: 58,
};

export function calculateKeeperTargetPosition(zone: KeeperDiveZone): Point2D {
  switch (zone) {
    case 'left':
      return { x: 30, y: 40 };
    case 'top-left':
      return { x: 26, y: 26 };
    case 'center':
      return { x: 50, y: 38 };
    case 'right':
      return { x: 70, y: 40 };
    case 'top-right':
      return { x: 74, y: 26 };
  }
}

export function selectKeeperDiveZone(
  difficulty: DifficultyLevel,
  previousShots: Point2D[],
  randomFn: () => number = Math.random
): KeeperDiveZone {
  const zones: KeeperDiveZone[] = ['left', 'top-left', 'center', 'right', 'top-right'];

  if (difficulty === 'hard' && previousShots.length >= 2) {
    const avgX = previousShots.reduce((sum, p) => sum + p.x, 0) / previousShots.length;
    if (avgX < 45 && randomFn() < 0.6) {
      return randomFn() > 0.5 ? 'left' : 'top-left';
    }
    if (avgX > 55 && randomFn() < 0.6) {
      return randomFn() > 0.5 ? 'right' : 'top-right';
    }
  }

  return zones[Math.floor(randomFn() * zones.length)];
}

export function calculateShotOutcome(
  ballTarget: Point2D,
  keeperPos: Point2D,
  difficulty: DifficultyLevel = 'normal'
): ShotOutcome {
  const { x, y } = ballTarget;
  const { leftPostX, rightPostX, crossbarY, groundY } = GOAL_FRAME;

  // 1. Check Out of Bounds (Missed)
  if (x < leftPostX - 4 || x > rightPostX + 4 || y < crossbarY - 4 || y > groundY + 10) {
    return 'missed';
  }

  // 2. Check Goalkeeper Save First
  const reachRadius = difficulty === 'easy' ? 12 : difficulty === 'normal' ? 15 : 18;
  const dx = x - keeperPos.x;
  const dy = y - keeperPos.y;
  const distToGoalkeeper = Math.hypot(dx, dy);

  if (distToGoalkeeper <= reachRadius) {
    return 'saved';
  }

  // 3. Check Post / Crossbar Hit (Near X=20, X=80 or Y=18)
  const isNearLeftPost = Math.abs(x - leftPostX) <= 2.5 && y >= crossbarY - 2 && y <= groundY + 2;
  const isNearRightPost = Math.abs(x - rightPostX) <= 2.5 && y >= crossbarY - 2 && y <= groundY + 2;
  const isNearCrossbar = Math.abs(y - crossbarY) <= 2.5 && x >= leftPostX - 2 && x <= rightPostX + 2;

  if (isNearLeftPost || isNearRightPost || isNearCrossbar) {
    return 'post';
  }

  // 4. Inside Goal Frame -> GOAL!
  if (x > leftPostX + 2.5 && x < rightPostX - 2.5 && y > crossbarY + 2.5 && y <= groundY + 4) {
    return 'goal';
  }

  return 'missed';
}

export function calculateShotScore(
  outcome: ShotOutcome,
  ballTarget: Point2D,
  currentStreak: number
): { points: number; isCorner: boolean; isTopCorner: boolean } {
  if (outcome !== 'goal') {
    return { points: 0, isCorner: false, isTopCorner: false };
  }

  let points = 100; // Base goal points
  const isCorner = ballTarget.x < 32 || ballTarget.x > 68;
  const isTopCorner = isCorner && ballTarget.y < 28;

  if (isTopCorner) {
    points += 75;
  } else if (isCorner) {
    points += 50;
  }

  if ((currentStreak + 1) % 3 === 0) {
    points += 100;
  }

  return { points, isCorner, isTopCorner };
}

export function updatePenaltyStats(
  currentStats: PenaltyStats,
  outcome: ShotOutcome,
  pointsAwarded: number
): PenaltyStats {
  const nextShotsTaken = currentStats.shotsTaken + 1;
  const isGoal = outcome === 'goal';
  const nextGoals = currentStats.goals + (isGoal ? 1 : 0);
  const nextSaves = currentStats.saves + (outcome === 'saved' ? 1 : 0);
  const nextPosts = currentStats.posts + (outcome === 'post' ? 1 : 0);
  const nextMisses = currentStats.misses + (outcome === 'missed' ? 1 : 0);

  const nextStreak = isGoal ? currentStats.currentStreak + 1 : 0;
  const nextBestStreak = Math.max(currentStats.bestStreak, nextStreak);
  const nextScore = currentStats.score + pointsAwarded;

  return {
    shotsTaken: nextShotsTaken,
    goals: nextGoals,
    saves: nextSaves,
    posts: nextPosts,
    misses: nextMisses,
    currentStreak: nextStreak,
    bestStreak: nextBestStreak,
    score: nextScore,
  };
}
