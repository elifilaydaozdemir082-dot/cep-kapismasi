export type RaceGameMode = 'time-attack' | 'endless';
export type RaceDifficulty = 'easy' | 'normal' | 'hard';
export type ObstacleType =
  | 'car'
  | 'swerving-car'
  | 'cone-row'
  | 'barrier'
  | 'oil'
  | 'pothole'
  | 'truck'
  | 'roadwork';

export type PowerupType = 'shield' | 'nitro' | 'double-points' | 'repair' | 'magnet';

export interface RaceObstacle {
  id: number;
  lane: number; // 0, 1, 2, 3
  widthLanes: number; // 1 or 2
  y: number; // 0..120%
  type: ObstacleType;
  color: string;
  speedMultiplier: number; // relative to traffic
  swerving?: boolean;
  swerveDirection?: 1 | -1;
  swerveTimer?: number;
  hasBeenNearMissed?: boolean;
  warningGiven?: boolean;
}

export interface RacePowerup {
  id: number;
  lane: number;
  y: number;
  type: PowerupType;
}

export interface RaceCoin {
  id: number;
  lane: number;
  y: number;
}

export interface DifficultyConfig {
  baseSpeed: number;
  maxSpeed: number;
  spawnIntervalMs: number;
  powerupChance: number;
  trafficSwerveChance: number;
  minGapY: number;
  warmupSeconds: number;
}

export const DIFFICULTY_CONFIGS: Record<RaceDifficulty, DifficultyConfig> = {
  easy: {
    baseSpeed: 0.38,
    maxSpeed: 0.8,
    spawnIntervalMs: 3200,
    powerupChance: 0.35,
    trafficSwerveChance: 0.05,
    minGapY: 35,
    warmupSeconds: 5,
  },
  normal: {
    baseSpeed: 0.50,
    maxSpeed: 1.0,
    spawnIntervalMs: 2500,
    powerupChance: 0.25,
    trafficSwerveChance: 0.15,
    minGapY: 30,
    warmupSeconds: 4,
  },
  hard: {
    baseSpeed: 0.65,
    maxSpeed: 1.3,
    spawnIntervalMs: 1900,
    powerupChance: 0.18,
    trafficSwerveChance: 0.25,
    minGapY: 25,
    warmupSeconds: 3,
  },
};

// Seeded Pseudo-Random Generator (Mulberry32)
export function createPRNG(seed: number) {
  let s = seed >>> 0;
  return function () {
    let t = (s += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface SpawnCheckParams {
  existingObstacles: RaceObstacle[];
  existingPowerups: RacePowerup[];
  elapsedSeconds: number;
  difficulty: RaceDifficulty;
  randomFn: () => number;
}

export function validateAndGenerateObstacle(params: SpawnCheckParams): RaceObstacle | null {
  const { existingObstacles, elapsedSeconds, difficulty, randomFn } = params;
  const config = DIFFICULTY_CONFIGS[difficulty];

  // Check top area gap (y < minGapY)
  const highestObstacle = existingObstacles.reduce(
    (minY, obs) => Math.min(minY, obs.y),
    100
  );
  if (highestObstacle < config.minGapY) {
    return null;
  }

  const isWarmup = elapsedSeconds < config.warmupSeconds;

  let allowedTypes: ObstacleType[] = ['car', 'cone-row', 'oil'];
  if (!isWarmup) {
    allowedTypes.push('barrier', 'pothole', 'swerving-car');
    if (elapsedSeconds > 15 && randomFn() < 0.2) {
      allowedTypes.push('truck');
    }
    if (elapsedSeconds > 20 && randomFn() < 0.15) {
      allowedTypes.push('roadwork');
    }
  }

  const type = allowedTypes[Math.floor(randomFn() * allowedTypes.length)];
  const widthLanes = type === 'truck' || type === 'roadwork' ? 2 : 1;

  const candidateLanes: number[] = [];
  for (let l = 0; l <= 4 - widthLanes; l++) {
    candidateLanes.push(l);
  }

  const validLanes = candidateLanes.filter((lane) => {
    const occupiedLanes = new Set<number>();
    existingObstacles.forEach((obs) => {
      if (obs.y < 40) {
        for (let i = 0; i < obs.widthLanes; i++) {
          occupiedLanes.add(obs.lane + i);
        }
      }
    });
    for (let i = 0; i < widthLanes; i++) {
      occupiedLanes.add(lane + i);
    }
    return occupiedLanes.size < 4;
  });

  if (validLanes.length === 0) return null;

  const selectedLane = validLanes[Math.floor(randomFn() * validLanes.length)];

  const carColors = ['#EF4444', '#F59E0B', '#3B82F6', '#10B981', '#EC4899', '#8B5CF6'];
  const color = carColors[Math.floor(randomFn() * carColors.length)];

  const swerving = type === 'swerving-car' || (type === 'car' && randomFn() < config.trafficSwerveChance);

  return {
    id: randomFn(),
    lane: selectedLane,
    widthLanes,
    y: -18,
    type,
    color,
    speedMultiplier: type === 'car' || type === 'swerving-car' ? 0.15 : 0,
    swerving,
    swerveDirection: randomFn() > 0.5 ? 1 : -1,
    swerveTimer: 0,
    hasBeenNearMissed: false,
    warningGiven: false,
  };
}

export function validateAndGeneratePowerup(
  existingObstacles: RaceObstacle[],
  existingPowerups: RacePowerup[],
  currentLives: number,
  randomFn: () => number
): RacePowerup | null {
  const topObstacles = existingObstacles.filter((o) => o.y < 30);
  const topPowerups = existingPowerups.filter((p) => p.y < 30);

  if (topObstacles.length > 2 || topPowerups.length > 0) return null;

  const allowedLanes = [0, 1, 2, 3].filter(
    (l) => !topObstacles.some((o) => l >= o.lane && l < o.lane + o.widthLanes)
  );
  if (allowedLanes.length === 0) return null;

  const lane = allowedLanes[Math.floor(randomFn() * allowedLanes.length)];

  const types: PowerupType[] = ['shield', 'nitro', 'double-points', 'magnet'];
  if (currentLives < 3) {
    types.push('repair');
  }

  const type = types[Math.floor(randomFn() * types.length)];

  return {
    id: randomFn(),
    lane,
    y: -15,
    type,
  };
}

export function checkNearMiss(
  playerLane: number,
  playerY: number,
  obstacle: RaceObstacle
): boolean {
  if (obstacle.hasBeenNearMissed) return false;

  const isYOverlapping = obstacle.y >= playerY - 4 && obstacle.y <= playerY + 4;
  if (!isYOverlapping) return false;

  const isAdjacentLane =
    (playerLane === obstacle.lane - 1 && obstacle.lane > 0) ||
    (playerLane === obstacle.lane + obstacle.widthLanes);

  return isAdjacentLane;
}

export function checkCollision(
  playerLane: number,
  playerY: number,
  obstacle: RaceObstacle
): boolean {
  const isYOverlapping = obstacle.y >= playerY - 4 && obstacle.y <= playerY + 4;
  if (!isYOverlapping) return false;

  const isLaneOverlapping =
    playerLane >= obstacle.lane && playerLane < obstacle.lane + obstacle.widthLanes;

  return isLaneOverlapping;
}

export function calculateInGameSpeedKmh(
  baseSpeed: number,
  speedFactor: number,
  elapsedSeconds: number
): number {
  const speedScale = 50 + baseSpeed * 60 + elapsedSeconds * 0.4;
  return Math.round(speedScale * speedFactor);
}
