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

// Goal Frame Boundaries in Normalized Pitch %
export const GOAL_FRAME = {
  leftPostX: 20,
  rightPostX: 80,
  crossbarY: 18,
  groundY: 52,
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
    // Analyze if player tends to shoot left or right
    const avgX = previousShots.reduce((sum, p) => sum + p.x, 0) / previousShots.length;
    if (avgX < 45 && randomFn() < 0.6) {
      return randomFn() > 0.5 ? 'left' : 'top-left';
    }
    if (avgX > 55 && randomFn() < 0.6) {
      return randomFn() > 0.5 ? 'right' : 'top-right';
    }
  }

  // Balanced random dive
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
  if (y < crossbarY - 4 || y > groundY + 5 || x < leftPostX - 5 || x > rightPostX + 5) {
    return 'missed';
  }

  // 2. Check Post / Crossbar Hits
  const isNearLeftPost = Math.abs(x - leftPostX) <= 2.5 && y >= crossbarY && y <= groundY;
  const isNearRightPost = Math.abs(x - rightPostX) <= 2.5 && y >= crossbarY && y <= groundY;
  const isNearCrossbar = Math.abs(y - crossbarY) <= 2.5 && x >= leftPostX && x <= rightPostX;

  if (isNearLeftPost || isNearRightPost || isNearCrossbar) {
    return 'post';
  }

  // 3. Check Goalkeeper Save
  // Reach radius scaled by difficulty
  const reachRadius = difficulty === 'easy' ? 14 : difficulty === 'normal' ? 17 : 20;
  const dx = x - keeperPos.x;
  const dy = y - keeperPos.y;
  const distanceToGoalkeeper = Math.sqrt(dx * dx + dy * dy);

  if (distanceToGoalkeeper <= reachRadius) {
    return 'saved';
  }

  // 4. Goal Check (Ball completely inside goal frame)
  if (x > leftPostX + 2 && x < rightPostX - 2 && y > crossbarY + 2 && y <= groundY) {
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
  const isCorner = ballTarget.x < 33 || ballTarget.x > 67;
  const isTopCorner = isCorner && ballTarget.y < 30;

  if (isTopCorner) {
    points += 75;
  } else if (isCorner) {
    points += 50;
  }

  // Streak bonus (3rd consecutive goal +100)
  if ((currentStreak + 1) % 3 === 0) {
    points += 100;
  }

  return { points, isCorner, isTopCorner };
}

export function updatePenaltyStats(
  prev: PenaltyStats,
  outcome: ShotOutcome,
  pointsEarned: number
): PenaltyStats {
  const isGoal = outcome === 'goal';
  const newStreak = isGoal ? prev.currentStreak + 1 : 0;
  const newBestStreak = Math.max(prev.bestStreak, newStreak);

  return {
    shotsTaken: prev.shotsTaken + 1,
    goals: prev.goals + (isGoal ? 1 : 0),
    saves: prev.saves + (outcome === 'saved' ? 1 : 0),
    posts: prev.posts + (outcome === 'post' ? 1 : 0),
    misses: prev.misses + (outcome === 'missed' ? 1 : 0),
    currentStreak: newStreak,
    bestStreak: newBestStreak,
    score: prev.score + pointsEarned,
  };
}
