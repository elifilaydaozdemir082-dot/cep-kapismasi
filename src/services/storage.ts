import type { DifficultyLevel, GameSettings, GameType, MedalType, MultiPlayerRecord, SinglePlayerRecord } from '../types/game';
import { calculateEarnedMedal } from '../utils/feedback';
import { GAME_REGISTRY } from '../registry/gameRegistry';

const KEYS = {
  SINGLE_HIGH_SCORES: 'cep_kapismasi_single_records_v3',
  MULTI_HISTORY: 'cep_kapismasi_multi_history_v3',
  SETTINGS: 'cep_kapismasi_settings',
};

const DEFAULT_SETTINGS: GameSettings = {
  soundEnabled: true,
  vibrationEnabled: true,
};

export const storageService = {
  getSingleHighScore(gameType: GameType, difficulty: DifficultyLevel = 'normal'): SinglePlayerRecord | null {
    try {
      const data = localStorage.getItem(KEYS.SINGLE_HIGH_SCORES);
      if (!data) return null;
      const recordsMap: Record<string, SinglePlayerRecord> = JSON.parse(data);
      const key = `${gameType}_${difficulty}`;
      return recordsMap[key] || recordsMap[gameType] || null;
    } catch (e) {
      console.warn('LocalStorage error:', e);
      return null;
    }
  },

  getAllSingleHighScores(): Record<string, SinglePlayerRecord> {
    try {
      const data = localStorage.getItem(KEYS.SINGLE_HIGH_SCORES);
      return data ? JSON.parse(data) : {};
    } catch (e) {
      return {};
    }
  },

  saveSingleScore(
    gameType: GameType,
    difficulty: DifficultyLevel,
    playerName: string,
    score: number,
    unit: string,
    isLowerScoreBetter: boolean = false
  ): { isNewRecord: boolean; record: SinglePlayerRecord; medal: MedalType } {
    const allRecords = this.getAllSingleHighScores();
    const key = `${gameType}_${difficulty}`;
    const current = allRecords[key] || null;

    const gameMeta = GAME_REGISTRY[gameType];
    const thresholds = gameMeta ? gameMeta.medals[difficulty] : { bronz: 10, gümüş: 20, altın: 30 };
    const earnedMedal = calculateEarnedMedal(score, thresholds, isLowerScoreBetter);

    const now = new Date().toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const newRecord: SinglePlayerRecord = {
      score,
      date: now,
      playerName: playerName.trim() || 'Oyuncu 1',
      gameType,
      unit,
      difficulty,
      medal: earnedMedal,
    };

    let isNewRecord = false;

    if (!current) {
      isNewRecord = true;
    } else if (isLowerScoreBetter) {
      isNewRecord = score < current.score;
    } else {
      isNewRecord = score > current.score;
    }

    if (isNewRecord) {
      try {
        allRecords[key] = newRecord;
        localStorage.setItem(KEYS.SINGLE_HIGH_SCORES, JSON.stringify(allRecords));
      } catch (e) {
        console.warn('LocalStorage save error:', e);
      }
      return { isNewRecord: true, record: newRecord, medal: earnedMedal };
    }

    return { isNewRecord: false, record: current, medal: earnedMedal };
  },

  getMultiHistory(): MultiPlayerRecord[] {
    try {
      const data = localStorage.getItem(KEYS.MULTI_HISTORY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.warn('LocalStorage error:', e);
      return [];
    }
  },

  saveMultiHistory(
    gameType: GameType,
    gameTitle: string,
    winnerName: string,
    winnerScore: number,
    playerCount: number,
    scores: { name: string; score: number; color: string }[]
  ) {
    const history = this.getMultiHistory();
    const now = new Date().toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const newEntry: MultiPlayerRecord = {
      id: Date.now().toString(),
      date: now,
      gameType,
      gameTitle,
      winnerName,
      winnerScore,
      playerCount,
      scores,
    };

    const updated = [newEntry, ...history].slice(0, 20);

    try {
      localStorage.setItem(KEYS.MULTI_HISTORY, JSON.stringify(updated));
    } catch (e) {
      console.warn('LocalStorage save error:', e);
    }
  },

  getSettings(): GameSettings {
    try {
      const data = localStorage.getItem(KEYS.SETTINGS);
      return data ? { ...DEFAULT_SETTINGS, ...JSON.parse(data) } : DEFAULT_SETTINGS;
    } catch (e) {
      return DEFAULT_SETTINGS;
    }
  },

  saveSettings(settings: GameSettings) {
    try {
      localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.warn('LocalStorage save error:', e);
    }
  },

  clearAllData() {
    try {
      localStorage.removeItem(KEYS.SINGLE_HIGH_SCORES);
      localStorage.removeItem(KEYS.MULTI_HISTORY);
    } catch (e) {
      console.warn('LocalStorage clear error:', e);
    }
  },
};
