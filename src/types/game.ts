export type ScreenType = 
  | 'main-menu' 
  | 'player-setup' 
  | 'game-select' 
  | 'rules'
  | 'countdown' 
  | 'single-play' 
  | 'multi-play' 
  | 'results' 
  | 'records' 
  | 'settings';

export type GameMode = 'single' | 'multi';

export type DifficultyLevel = 'easy' | 'normal' | 'hard';

export type MedalType = 'none' | 'bronz' | 'gümüş' | 'altın';

export type GameCategory = 'refleks' | 'spor' | 'yaris' | 'zeka' | 'kelime' | 'bilgi' | 'sans';

export type GameType = 
  | 'tap-rush'         // Hedef Avı
  | 'car-race'         // Mini Araba Yarışı
  | 'penalty'          // Penaltı Yarışması
  | 'basketball'       // Basket Atışı
  | 'archery'          // Okçuluk
  | 'reflex'           // Refleks Düellosu
  | 'tug-of-war'       // Halat Çekme
  | 'air-hockey'       // Hava Hokeyi
  | 'tower'            // Denge Kulesi
  | 'maze'             // Labirent Kaçışı
  | 'memory'           // Hafıza Rotası
  | 'tabu'             // Tabu
  | 'hangman'          // Kelimeyi Kurtar
  | 'word-search'      // Kelime Avı
  | 'anagram'          // Karışık Harfler
  | 'forbidden-letter' // Yasak Harf
  | 'word-chain'       // Kelime Zinciri
  | 'quiz-classic'     // Bilgi Yarışması: Klasik
  | 'quiz-fast-finger' // Bilgi Yarışması: Hızlı Parmak
  | 'quiz-true-false' // Bilgi Yarışması: Doğru mu Yanlış mı?
  | 'box-deal';        // Kutunu Seç

export type WordCategory =
  | 'gunluk'
  | 'hayvanlar'
  | 'spor'
  | 'teknoloji'
  | 'yiyecek'
  | 'meslekler'
  | 'sehirler'
  | 'doga';

export interface WordItem {
  id: number;
  word: string;
  category: WordCategory;
  categoryName: string;
  hint?: string;
  difficulty?: DifficultyLevel;
}

export interface TabuCardItem {
  id: number;
  word: string;
  forbidden: string[];
  category: WordCategory;
  categoryName: string;
}

export interface Player {
  id: string;
  name: string;
  color: string;
  score: number;
  rank?: number;
}

export interface MedalThresholds {
  bronz: number;
  gümüş: number;
  altın: number;
}

export interface SinglePlayerRecord {
  score: number;
  date: string;
  playerName: string;
  gameType: GameType;
  unit: string;
  difficulty: DifficultyLevel;
  medal: MedalType;
}

export interface MultiPlayerRecord {
  id: string;
  date: string;
  gameType: GameType;
  gameTitle: string;
  winnerName: string;
  winnerScore: number;
  playerCount: number;
  scores: { name: string; score: number; color: string }[];
}

export interface GameSettings {
  soundEnabled: boolean;
  vibrationEnabled: boolean;
}

export interface GameMetadata {
  id: GameType;
  title: string;
  description: string;
  category: GameCategory;
  categoryLabel: string;
  typeLabel: 'Aynı Anda' | 'Sırayla';
  icon: string;
  unit: string;
  rules: string[];
  medals: Record<DifficultyLevel, MedalThresholds>;
  isLowerScoreBetter?: boolean;
}
