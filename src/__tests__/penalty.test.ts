import { describe, it, expect, beforeEach } from 'vitest';
import {
  calculateShotOutcome,
  calculateShotScore,
  updatePenaltyStats,
  calculateKeeperTargetPosition,
  INITIAL_PENALTY_STATS,
} from '../utils/penaltyEngine';
import type { Point2D } from '../utils/penaltyEngine';
import { storageService } from '../services/storage';

// LocalStorage Mock
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

describe('Penaltı Yarışması Motor ve Skor Testleri', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  // Test 1: Kalecinin gövdesine giden top saved olmalı
  it('1. Kalecinin gövdesine giden top saved olmalı', () => {
    const ball: Point2D = { x: 50, y: 38 };
    const keeper: Point2D = calculateKeeperTargetPosition('center'); // (50, 38)
    const outcome = calculateShotOutcome(ball, keeper, 'normal');

    expect(outcome).toBe('saved');
  });

  // Test 2: Kalecinin uzanmış koluna değen top saved olmalı
  it('2. Kalecinin uzanmış koluna değen top saved olmalı', () => {
    const keeper: Point2D = calculateKeeperTargetPosition('left'); // (30, 40)
    const ball: Point2D = { x: 38, y: 42 }; // within reach radius (17)
    const outcome = calculateShotOutcome(ball, keeper, 'normal');

    expect(outcome).toBe('saved');
  });

  // Test 3: Kalecinin ulaşamadığı köşeye giden top goal olmalı
  it('3. Kalecinin ulaşamadığı köşeye giden top goal olmalı', () => {
    const keeper: Point2D = calculateKeeperTargetPosition('left'); // (30, 40)
    const ball: Point2D = { x: 74, y: 25 }; // Top-right corner (far from left dive)
    const outcome = calculateShotOutcome(ball, keeper, 'normal');

    expect(outcome).toBe('goal');
  });

  // Test 4: Kale dışına giden top missed olmalı
  it('4. Kale dışına giden top missed olmalı', () => {
    const keeper: Point2D = calculateKeeperTargetPosition('center');
    const ballHigh: Point2D = { x: 50, y: 10 }; // High over crossbar
    const outcomeHigh = calculateShotOutcome(ballHigh, keeper, 'normal');

    const ballWide: Point2D = { x: 92, y: 35 }; // Wide right
    const outcomeWide = calculateShotOutcome(ballWide, keeper, 'normal');

    expect(outcomeHigh).toBe('missed');
    expect(outcomeWide).toBe('missed');
  });

  // Test 5: Direğe çarpan top post olmalı
  it('5. Direğe veya üst direğe çarpan top post olmalı', () => {
    const keeper: Point2D = calculateKeeperTargetPosition('center');
    const ballPost: Point2D = { x: 20, y: 35 }; // Exactly on left post X=20
    const outcome = calculateShotOutcome(ballPost, keeper, 'normal');

    expect(outcome).toBe('post');
  });

  // Test 6: Kurtarılan şut gol sayısını artırmamalı
  it('6. Kurtarılan şut gol sayısını artırmamalı', () => {
    let stats = INITIAL_PENALTY_STATS;
    const { points } = calculateShotScore('saved', { x: 50, y: 38 }, stats.currentStreak);
    stats = updatePenaltyStats(stats, 'saved', points);

    expect(stats.goals).toBe(0);
    expect(stats.saves).toBe(1);
    expect(stats.shotsTaken).toBe(1);
    expect(stats.score).toBe(0);
  });

  // Test 7: Gol olduğunda gol sayısı 1 artmalı
  it('7. Gol olduğunda gol sayısı tam 1 artmalı', () => {
    let stats = INITIAL_PENALTY_STATS;
    const ballTarget = { x: 74, y: 25 };
    const { points } = calculateShotScore('goal', ballTarget, stats.currentStreak);
    stats = updatePenaltyStats(stats, 'goal', points);

    expect(stats.goals).toBe(1);
    expect(stats.shotsTaken).toBe(1);
    expect(stats.score).toBeGreaterThan(0);
  });

  // Test 8: 5 gol sonunda 5/5 olmalı
  it('8. Beş gol sonunda sonuç 5/5 göstermeli', () => {
    let stats = INITIAL_PENALTY_STATS;
    for (let i = 0; i < 5; i++) {
      const { points } = calculateShotScore('goal', { x: 70, y: 25 }, stats.currentStreak);
      stats = updatePenaltyStats(stats, 'goal', points);
    }

    expect(stats.goals).toBe(5);
    expect(stats.shotsTaken).toBe(5);
  });

  // Test 9: 2 gol, 2 kurtarış, 1 aut durumunda sayaçlar doğru olmalı
  it('9. 2 gol, 2 kurtarış ve 1 aut durumunda istatistikler tam uyuşmalı', () => {
    let stats = INITIAL_PENALTY_STATS;
    stats = updatePenaltyStats(stats, 'goal', 100);
    stats = updatePenaltyStats(stats, 'goal', 100);
    stats = updatePenaltyStats(stats, 'saved', 0);
    stats = updatePenaltyStats(stats, 'saved', 0);
    stats = updatePenaltyStats(stats, 'missed', 0);

    expect(stats.shotsTaken).toBe(5);
    expect(stats.goals).toBe(2);
    expect(stats.saves).toBe(2);
    expect(stats.misses).toBe(1);
    expect(stats.posts).toBe(0);
  });

  // Test 10 & 12: Invariant: shotsTaken === goals + saves + posts + misses
  it('10. Stat eşitliği: shotsTaken === goals + saves + posts + misses', () => {
    let stats = INITIAL_PENALTY_STATS;
    stats = updatePenaltyStats(stats, 'goal', 100);
    stats = updatePenaltyStats(stats, 'saved', 0);
    stats = updatePenaltyStats(stats, 'post', 0);
    stats = updatePenaltyStats(stats, 'missed', 0);

    expect(stats.shotsTaken).toBe(4);
    expect(stats.shotsTaken).toBe(stats.goals + stats.saves + stats.posts + stats.misses);
  });

  // Test 13: 0 sonuç için "Yeni Rekor" gösterilmemeli
  it('13. 0 sonuç için Yeni Rekor gösterilmemeli', () => {
    const res = storageService.saveSingleScore('penalty', 'normal', 'Ahmet', 0, 'puan');
    expect(res.isNewRecord).toBe(false);
    expect(res.record.score).toBe(0);
  });

  // Test 14: Aynı skor yeniden alındığında rekor mesajı verilmemeli
  it('14. Aynı skor yeniden alındığında rekor mesajı verilmemeli', () => {
    storageService.saveSingleScore('penalty', 'normal', 'Ahmet', 300, 'puan');
    const sameRes = storageService.saveSingleScore('penalty', 'normal', 'Ahmet', 300, 'puan');

    expect(sameRes.isNewRecord).toBe(false);
    expect(sameRes.record.score).toBe(300);
  });

  // Test 15: Tekrar Oyna sonrası bütün istatistikler sıfırlanmalı
  it('15. Tekrar Oyna sonrası bütün istatistikler sıfırlanmalı', () => {
    let stats = INITIAL_PENALTY_STATS;
    stats = updatePenaltyStats(stats, 'goal', 100);
    expect(stats.score).toBe(100);

    // Reset
    stats = INITIAL_PENALTY_STATS;
    expect(stats.score).toBe(0);
    expect(stats.shotsTaken).toBe(0);
    expect(stats.goals).toBe(0);
    expect(stats.currentStreak).toBe(0);
  });
});
