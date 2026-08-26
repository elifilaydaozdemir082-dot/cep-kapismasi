import type { DifficultyLevel } from './game';

export type QuizCategoryId =
  | 'genel-kultur'
  | 'turk-tarihi'
  | 'dunya-tarihi'
  | 'turkiye-cografyasi'
  | 'dunya-cografyasi'
  | 'bilim-doga'
  | 'teknoloji-bilgi'
  | 'spor-bilgi'
  | 'sinema-dizi'
  | 'muzik'
  | 'edebiyat'
  | 'sanat'
  | 'sosyal-medya'
  | 'guncel-olaylar'
  | 'karisik';

export type QuizGameMode = 'classic' | 'fast-finger' | 'true-false';

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[]; // Exactly 4 options for classic/fast-finger, or ["Doğru", "Yanlış"] for T/F
  correctAnswer: number; // 0..3 index in original options array
  explanation: string;
  category: QuizCategoryId;
  difficulty: DifficultyLevel;
  sourceNote?: string;
  createdAt?: string;
  validUntil?: string | null; // ISO YYYY-MM-DD
  tags?: string[];
  isTrueFalseStatement?: boolean;
}

export interface ShuffledQuizQuestion extends QuizQuestion {
  shuffledOptions: string[];
  shuffledCorrectIndex: number;
  eliminatedOptionIndices?: number[]; // For 50:50 joker
}

export interface QuizJokersState {
  fiftyFiftyUsed: boolean;
  timeFreezeUsed: boolean;
  swapQuestionUsed: boolean;
}

export interface QuizCategoryInfo {
  id: QuizCategoryId;
  title: string;
  description: string;
  icon: string;
  color: string;
}
