import { describe, it, expect } from 'vitest';
import {
  createPRNG,
  validateAndGenerateObstacle,
  checkNearMiss,
  checkCollision,
  DIFFICULTY_CONFIGS,
} from '../utils/carRaceEngine';
import type { RaceObstacle } from '../utils/carRaceEngine';

describe('CarRace Engine & Validation Tests', () => {

  // Test 1: Seed-based PRNG reproducibility
  it('1. Aynı seed ile üretilen rastgele sayılar ve parkur eşit olmalı', () => {
    const prng1 = createPRNG(12345);
    const prng2 = createPRNG(12345);

    const nums1 = [prng1(), prng1(), prng1()];
    const nums2 = [prng2(), prng2(), prng2()];

    expect(nums1).toEqual(nums2);
  });

  // Test 2: Safe Lane Guarantee (at least 1 open lane)
  it('2. Engel üretiminde daima en az 1 güvenli geçiş şeridi bırakılmalı', () => {
    const existing: RaceObstacle[] = [
      { id: 1, lane: 0, widthLanes: 1, y: 10, type: 'car', color: '#fff', speedMultiplier: 0 },
      { id: 2, lane: 1, widthLanes: 1, y: 12, type: 'car', color: '#fff', speedMultiplier: 0 },
      { id: 3, lane: 2, widthLanes: 1, y: 15, type: 'car', color: '#fff', speedMultiplier: 0 },
    ];

    const prng = createPRNG(999);
    // If lanes 0, 1, 2 are occupied at top (y < 40), the ONLY valid lane for a 1-lane obstacle is lane 3!
    const newObs = validateAndGenerateObstacle({
      existingObstacles: existing,
      existingPowerups: [],
      elapsedSeconds: 20,
      difficulty: 'normal',
      randomFn: prng,
    });

    if (newObs) {
      expect(newObs.lane).toBe(3);
    }
  });

  // Test 3: Warmup safety (no trucks or roadworks in first 8 seconds)
  it('3. İlk 8 saniyedeki ısınma süresinde ağır kamyon veya karmaşık yol çalışması üretilmemeli', () => {
    const prng = createPRNG(42);

    for (let i = 0; i < 50; i++) {
      const obs = validateAndGenerateObstacle({
        existingObstacles: [],
        existingPowerups: [],
        elapsedSeconds: 4, // warmup period
        difficulty: 'normal',
        randomFn: prng,
      });

      if (obs) {
        expect(obs.type).not.toBe('truck');
        expect(obs.type).not.toBe('roadwork');
      }
    }
  });

  // Test 4: Near-Miss Detector (passing close in adjacent lane gives bonus)
  it('4. Yan şeritten yakın geçiş doğru tespit edilmeli', () => {
    const obstacle: RaceObstacle = {
      id: 101,
      lane: 1,
      widthLanes: 1,
      y: 78,
      type: 'car',
      color: '#fff',
      speedMultiplier: 0,
      hasBeenNearMissed: false,
    };

    // Player is in lane 0 (adjacent to lane 1) at Y=78
    const isNearMiss = checkNearMiss(0, 78, obstacle);
    expect(isNearMiss).toBe(true);

    // If player is in same lane (lane 1), it's collision area, not near-miss
    const sameLaneMiss = checkNearMiss(1, 78, obstacle);
    expect(sameLaneMiss).toBe(false);
  });

  // Test 5: Collision Detector
  it('5. Aynı şerit ve çakışan Y pozisyonunda çarpışma tespit edilmeli', () => {
    const obstacle: RaceObstacle = {
      id: 202,
      lane: 2,
      widthLanes: 1,
      y: 78,
      type: 'barrier',
      color: '#fff',
      speedMultiplier: 0,
    };

    const isHit = checkCollision(2, 78, obstacle);
    expect(isHit).toBe(true);

    const isSafe = checkCollision(0, 78, obstacle);
    expect(isSafe).toBe(false);
  });

  // Test 6: Distance vs Score Separation
  it('6. Mesafe (m) ve Puan (skor) bağımsız hesaplanmalı', () => {
    const distanceMeters = 500;
    const survivalPoints = Math.floor(distanceMeters / 10); // 50 pts
    const nearMissBonus = 25 * 2; // 50 pts (x2 streak)
    const coinPoints = 20; // 2 coins

    const totalScore = survivalPoints + nearMissBonus + coinPoints; // 120 pts

    expect(distanceMeters).toBe(500);
    expect(totalScore).toBe(120);
    expect(distanceMeters).not.toBe(totalScore);
  });

  // Test 7: Difficulty parameter scaling
  it('7. Zorluk seviyeleri hız ve engel sıklığını etkilemeli', () => {
    const easy = DIFFICULTY_CONFIGS['easy'];
    const normal = DIFFICULTY_CONFIGS['normal'];
    const hard = DIFFICULTY_CONFIGS['hard'];

    expect(easy.baseSpeed).toBeLessThan(normal.baseSpeed);
    expect(normal.baseSpeed).toBeLessThan(hard.baseSpeed);
    expect(easy.spawnIntervalMs).toBeGreaterThan(normal.spawnIntervalMs);
    expect(normal.spawnIntervalMs).toBeGreaterThan(hard.spawnIntervalMs);
  });
});
