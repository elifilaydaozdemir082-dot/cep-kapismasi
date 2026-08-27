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
  y: number; // 0..100%
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
  baseSpeed: number; // speed factor
  maxSpeed: number;
  spawnIntervalMs: number;
  minGapY: number; // minimum Y distance between obstacles
  trafficSwerveChance: number;
  powerupChance: number;
  warmupSeconds: number;
}

export const DIFFICULTY_CONFIGS: Record<RaceDifficulty, DifficultyConfig> = {
  easy: {
    baseSpeed: 0.32,
    maxSpeed: 0.55,
    spawnIntervalMs: 1400,
    minGapY: 35,
    trafficSwerveChance: 0.05,
    powerupChance: 0.015,
    warmupSeconds: 10,
  },
  normal: {
    baseSpeed: 0.45,
    maxSpeed: 0.75,
    spawnIntervalMs: 1100,
    minGapY: 28,
    trafficSwerveChance: 0.12,
    powerupChance: 0.01,
    warmupSeconds: 8,
  },
  hard: {
    baseSpeed: 0.6,
    maxSpeed: 0.95,
    spawnIntervalMs: 800,
    minGapY: 22,
    trafficSwerveChance: 0.25,
    powerupChance: 0.008,
    warmupSeconds: 5,
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
    return null; // Too close to top obstacle
  }

  const isWarmup = elapsedSeconds < config.warmupSeconds;

  // Determine allowed obstacle types based on warmup and time
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

  // Find candidate lanes (0, 1, 2, 3) where widthLanes fits
  const candidateLanes: number[] = [];
  for (let l = 0; l <= 4 - widthLanes; l++) {
    candidateLanes.push(l);
  }

  // Filter out lanes that would completely block ALL 4 lanes at top (y < 40)
  const validLanes = candidateLanes.filter((lane) => {
    // Check if spawning obstacle at (lane, widthLanes) leaves at least 1 open lane among existing top obstacles
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
    // If occupiedLanes covers all 4 lanes, this lane is invalid!
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
    y: -15,
    type,
    color,
    speedMultiplier: type === 'car' || type === 'swerving-car' ? 0.3 : 0,
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
    y: -10,
    type,
  };
}

export function checkNearMiss(
  playerLane: number,
  playerY: number, // percentage, e.g. 78%
  obstacle: RaceObstacle
): boolean {
  if (obstacle.hasBeenNearMissed) return false;

  // Player bounds: lane, Y range [playerY - 4, playerY + 8]
  // Obstacle bounds: lane .. lane + widthLanes - 1, Y range [obs.y - 4, obs.y + 8]

  const isYOverlapping = obstacle.y >= playerY - 12 && obstacle.y <= playerY + 12;
  if (!isYOverlapping) return false;

  // Check lane proximity: adjacent lane (diff is 1)
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
  const isYOverlapping = obstacle.y >= playerY - 8 && obstacle.y <= playerY + 8;
  if (!isYOverlapping) return false;

  // Check lane overlap
  const isLaneOverlapping =
    playerLane >= obstacle.lane && playerLane < obstacle.lane + obstacle.widthLanes;

  return isLaneOverlapping;
}

export function calculateInGameSpeedKmh(
  baseSpeed: number,
  speedFactor: number,
  elapsedSeconds: number
): number {
  const speedScale = 80 + baseSpeed * 100 + elapsedSeconds * 0.8;
  return Math.round(speedScale * speedFactor);
}
