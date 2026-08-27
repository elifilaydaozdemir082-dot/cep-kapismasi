import AsyncStorage from '@react-native-async-storage/async-storage';

export interface MobileSettings {
  soundEnabled: boolean;
  hapticEnabled: boolean;
}

export interface MobilePlayer {
  id: string;
  name: string;
  color: string;
}

export interface TargetHuntRecord {
  highScore: number;
  bestStreak: number;
  bestAccuracy: number;
  lastPlayedDate: string;
}

const KEYS = {
  SETTINGS: 'mobile_settings_v1',
  PLAYERS: 'mobile_players_v1',
  TARGET_HUNT_RECORD: 'mobile_target_hunt_record_v1',
};

const DEFAULT_SETTINGS: MobileSettings = {
  soundEnabled: true,
  hapticEnabled: true,
};

const DEFAULT_PLAYERS: MobilePlayer[] = [
  { id: 'p1', name: 'Oyuncu 1', color: '#06B6D4' },
  { id: 'p2', name: 'Oyuncu 2', color: '#EF4444' },
];

export const mobileStorageService = {
  async getSettings(): Promise<MobileSettings> {
    try {
      const data = await AsyncStorage.getItem(KEYS.SETTINGS);
      return data ? { ...DEFAULT_SETTINGS, ...JSON.parse(data) } : DEFAULT_SETTINGS;
    } catch (e) {
      return DEFAULT_SETTINGS;
    }
  },

  async saveSettings(settings: MobileSettings): Promise<void> {
    try {
      await AsyncStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.warn('AsyncStorage error saving settings:', e);
    }
  },

  async getPlayers(): Promise<MobilePlayer[]> {
    try {
      const data = await AsyncStorage.getItem(KEYS.PLAYERS);
      return data ? JSON.parse(data) : DEFAULT_PLAYERS;
    } catch (e) {
      return DEFAULT_PLAYERS;
    }
  },

  async savePlayers(players: MobilePlayer[]): Promise<void> {
    try {
      await AsyncStorage.setItem(KEYS.PLAYERS, JSON.stringify(players));
    } catch (e) {
      console.warn('AsyncStorage error saving players:', e);
    }
  },

  async getTargetHuntRecord(): Promise<TargetHuntRecord | null> {
    try {
      const data = await AsyncStorage.getItem(KEYS.TARGET_HUNT_RECORD);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  },

  async saveTargetHuntRecord(
    score: number,
    streak: number,
    accuracy: number
  ): Promise<{ isNewRecord: boolean; record: TargetHuntRecord }> {
    const current = await this.getTargetHuntRecord();

    const now = new Date().toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });

    const isNewRecord = score > 0 && (!current || score > current.highScore);

    const newRecord: TargetHuntRecord = {
      highScore: current ? Math.max(current.highScore, score) : score,
      bestStreak: current ? Math.max(current.bestStreak, streak) : streak,
      bestAccuracy: current ? Math.max(current.bestAccuracy, accuracy) : accuracy,
      lastPlayedDate: now,
    };

    try {
      await AsyncStorage.setItem(KEYS.TARGET_HUNT_RECORD, JSON.stringify(newRecord));
    } catch (e) {
      console.warn('AsyncStorage error saving target hunt record:', e);
    }

    return { isNewRecord, record: newRecord };
  },

  async clearAllData(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([KEYS.SETTINGS, KEYS.PLAYERS, KEYS.TARGET_HUNT_RECORD]);
    } catch (e) {
      console.warn('AsyncStorage error clearing data:', e);
    }
  },
};
