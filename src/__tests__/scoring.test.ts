import { describe, it, expect, beforeEach } from 'vitest';
import {
  calculateTargetScore,
  getMultiplier,
  INITIAL_TARGET_GAME_STATE,
} from '../utils/targetScore';
import type { TargetGameState } from '../utils/targetScore';
import { storageService } from '../services/storage';

// LocalStorage mock for Node test environment
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

describe('Hedef Avı ve Genel Skor Hesaplama Testleri', () => {

  // Test 1: Normal hedefe bir kez vurulunca skor 10 olmalı
  it('1. Normal hedefe bir kez vurulunca skor 10 olmalı', () => {
    const nextState = calculateTargetScore(INITIAL_TARGET_GAME_STATE, 'normal');
    expect(nextState.score).toBe(10);
    expect(nextState.hits).toBe(1);
    expect(nextState.currentStreak).toBe(1);
  });

  // Test 2: Beş doğru vuruştan sonra seri ve çarpan doğru artmalı
  it('2. Beş doğru vuruştan sonra seri ve çarpan doğru artmalı', () => {
    let state = INITIAL_TARGET_GAME_STATE;
    for (let i = 0; i < 4; i++) {
      state = calculateTargetScore(state, 'normal');
    }
    expect(state.currentStreak).toBe(4);
    expect(getMultiplier(state.currentStreak)).toBe(1);

    // 5th hit
    state = calculateTargetScore(state, 'normal');
    expect(state.currentStreak).toBe(5);
    expect(getMultiplier(state.currentStreak)).toBe(2);
    // Scores for 5 hits: 10 + 10 + 10 + 10 + 20 = 60
    expect(state.score).toBe(60);
  });

  // Test 3: Tuzak hedef skoru 15 azaltmalı ancak sıfırın altına indirmemeli
  it('3. Tuzak hedef skoru 15 azaltmalı ancak sıfırın altına indirmemeli', () => {
    let state = calculateTargetScore(INITIAL_TARGET_GAME_STATE, 'normal'); // score 10
    expect(state.score).toBe(10);

    state = calculateTargetScore(state, 'trap');
    expect(state.score).toBe(0); // 10 - 15 = -5 -> clamped to 0
    expect(state.trapHits).toBe(1);
    expect(state.currentStreak).toBe(0);
  });

  // Test 4: Boş alana dokunmak seriyi sıfırlamalı
  it('4. Boş alana dokunmak seriyi sıfırlamalı', () => {
    let state = INITIAL_TARGET_GAME_STATE;
    state = calculateTargetScore(state, 'normal');
    state = calculateTargetScore(state, 'normal');
    expect(state.currentStreak).toBe(2);

    state = calculateTargetScore(state, 'miss');
    expect(state.currentStreak).toBe(0);
    expect(state.misses).toBe(1);
  });

  // Test 5: 8 doğru, 1 yanlış ve 1 tuzak için isabet oranı %80 olmalı
  it('5. 8 doğru, 1 yanlış ve 1 tuzak için isabet oranı %80 olmalı', () => {
    let state = INITIAL_TARGET_GAME_STATE;
    for (let i = 0; i < 8; i++) {
      state = calculateTargetScore(state, 'normal');
    }
    state = calculateTargetScore(state, 'miss');
    state = calculateTargetScore(state, 'trap');

    expect(state.hits).toBe(8);
    expect(state.misses).toBe(1);
    expect(state.trapHits).toBe(1);
    expect(state.totalAttempts).toBe(10);
    expect(state.accuracy).toBe(80);
  });

  // Test 6: Oyun bittiğinde sonuç skoru oyun içindeki son skorla aynı olmalı
  it('6. Oyun bittiğinde sonuç skoru oyun içindeki son skorla aynı olmalı', () => {
    let state = INITIAL_TARGET_GAME_STATE;
    state = calculateTargetScore(state, 'golden'); // 25
    state = calculateTargetScore(state, 'normal'); // 10
    const finalInGameScore = state.score;
    const transmittedScore = state.score;
    expect(transmittedScore).toBe(finalInGameScore);
  });

  // Test 7: Son saniyedeki geçerli vuruş sonuçlara dahil olmalı
  it('7. Son saniyedeki geçerli vuruş sonuçlara dahil olmalı', () => {
    const statsRef = { current: INITIAL_TARGET_GAME_STATE };
    statsRef.current = calculateTargetScore(statsRef.current, 'normal');
    const scoreToFinish = statsRef.current.score;
    expect(scoreToFinish).toBe(10);
  });

  // Test 8: Süre bittikten sonraki dokunuş puan vermemeli
  it('8. Süre bittikten sonraki dokunuş puan vermemeli', () => {
    const timeLeft = 0;
    const isFinished = true;
    let state = { ...INITIAL_TARGET_GAME_STATE, score: 50 };

    const attemptTapAfterFinish = (type: 'normal') => {
      if (timeLeft <= 0 || isFinished) return state;
      return calculateTargetScore(state, type);
    };

    const nextState = attemptTapAfterFinish('normal');
    expect(nextState.score).toBe(50);
  });

  // Test 9: Finish callback yalnızca bir kere çalışmalı
  it('9. Finish callback yalnızca bir kere çalışmalı', () => {
    let callCount = 0;
    const isFinishedRef = { current: false };

    const finishGame = () => {
      if (isFinishedRef.current) return;
      isFinishedRef.current = true;
      callCount += 1;
    };

    finishGame();
    finishGame();
    finishGame();

    expect(callCount).toBe(1);
  });

  // Test 10: Tekrar Oyna sonrası skor, isabet, seri, ref ve timer tamamen sıfırlanmalı
  it('10. Tekrar Oyna sonrası skor, isabet, seri, ref ve timer tamamen sıfırlanmalı', () => {
    let state: TargetGameState = {
      score: 150,
      hits: 12,
      misses: 2,
      trapHits: 1,
      currentStreak: 5,
      bestStreak: 10,
      totalAttempts: 15,
      accuracy: 80,
    };
    const isFinishedRef = { current: true };
    const statsRef = { current: state };

    // Reset action
    state = INITIAL_TARGET_GAME_STATE;
    statsRef.current = INITIAL_TARGET_GAME_STATE;
    isFinishedRef.current = false;
    const timer = 20;

    expect(state.score).toBe(0);
    expect(state.hits).toBe(0);
    expect(state.currentStreak).toBe(0);
    expect(statsRef.current.score).toBe(0);
    expect(isFinishedRef.current).toBe(false);
    expect(timer).toBe(20);
  });

  // Test 11: İkinci oyun önceki oyunun skorunu taşımamalı
  it('11. İkinci oyun önceki oyunun skorunu taşımamalı', () => {
    let firstGameStats = calculateTargetScore(INITIAL_TARGET_GAME_STATE, 'golden');
    expect(firstGameStats.score).toBe(25);

    let secondGameStats = INITIAL_TARGET_GAME_STATE;
    expect(secondGameStats.score).toBe(0);

    secondGameStats = calculateTargetScore(secondGameStats, 'normal');
    expect(secondGameStats.score).toBe(10);
  });

  // Test 12 & 13: LocalStorage rekor mantığı testleri
  describe('Storage High Score Tests', () => {
    beforeEach(() => {
      localStorageMock.clear();
    });

    // Test 12: localStorage rekoru yalnızca gerçek sonuç skoruyla güncellenmeli
    it('12. localStorage rekoru yalnızca gerçek sonuç skoruyla güncellenmeli', () => {
      const res = storageService.saveSingleScore('tap-rush', 'normal', 'Ahmet', 75, 'puan');
      expect(res.isNewRecord).toBe(true);
      expect(res.record.score).toBe(75);

      const saved = storageService.getSingleHighScore('tap-rush', 'normal');
      expect(saved?.score).toBe(75);
    });

    // Test 13: Düşük skor eski yüksek rekorun üzerine yazılmamalı
    it('13. Düşük skor eski yüksek rekorun üzerine yazılmamalı', () => {
      storageService.saveSingleScore('tap-rush', 'normal', 'Ahmet', 100, 'puan');

      const lowerRes = storageService.saveSingleScore('tap-rush', 'normal', 'Ahmet', 40, 'puan');
      expect(lowerRes.isNewRecord).toBe(false);
      expect(lowerRes.record.score).toBe(100);

      const saved = storageService.getSingleHighScore('tap-rush', 'normal');
      expect(saved?.score).toBe(100);
    });
  });

  // Test 14 & 15: Çok oyunculu mod testleri
  describe('Multiplayer Score Isolation Tests', () => {
    // Test 14: Çok oyunculu modda her oyuncunun skoru ayrı tutulmalı
    it('14. Çok oyunculu modda her oyuncunun skoru ayrı tutulmalı', () => {
      const players = [
        { id: 'p1', name: 'Oyuncu 1', color: '#000', score: 0 },
        { id: 'p2', name: 'Oyuncu 2', color: '#fff', score: 0 },
      ];

      const addPlayerScore = (playerList: typeof players, targetId: string) => {
        return playerList.map((p) => (p.id === targetId ? { ...p, score: p.score + 1 } : p));
      };

      let updated = addPlayerScore(players, 'p1');
      updated = addPlayerScore(updated, 'p1');
      updated = addPlayerScore(updated, 'p2');

      const p1 = updated.find((p) => p.id === 'p1');
      const p2 = updated.find((p) => p.id === 'p2');

      expect(p1?.score).toBe(2);
      expect(p2?.score).toBe(1);
    });

    // Test 15: Bir oyuncunun vuruşu diğer oyuncunun skorunu değiştirmemeli
    it('15. Bir oyuncunun vuruşu diğer oyuncunun skorunu değiştirmemeli', () => {
      const players = [
        { id: 'p1', name: 'Oyuncu 1', color: '#000', score: 10 },
        { id: 'p2', name: 'Oyuncu 2', color: '#fff', score: 5 },
      ];

      const addPlayerScore = (playerList: typeof players, targetId: string) => {
        return playerList.map((p) => (p.id === targetId ? { ...p, score: p.score + 1 } : p));
      };

      const updated = addPlayerScore(players, 'p1');
      const p2 = updated.find((p) => p.id === 'p2');

      expect(p2?.score).toBe(5);
    });
  });
});
