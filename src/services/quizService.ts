import genelKulturData from '../data/quiz/genelKultur.json';
import turkTarihiData from '../data/quiz/turkTarihi.json';
import turkiyeCografyasiData from '../data/quiz/turkiyeCografyasi.json';
import bilimDogaData from '../data/quiz/bilimDoga.json';
import sosyalMedyaData from '../data/quiz/sosyalMedya.json';
import guncelOlaylarData from '../data/quiz/guncelOlaylar.json';

import type { DifficultyLevel } from '../types/game';
import type { QuizCategoryId, QuizQuestion, ShuffledQuizQuestion } from '../types/quiz';

const categoryDataMap: Record<string, QuizQuestion[]> = {
  'genel-kultur': genelKulturData as QuizQuestion[],
  'turk-tarihi': turkTarihiData as QuizQuestion[],
  'turkiye-cografyasi': turkiyeCografyasiData as QuizQuestion[],
  'bilim-doga': bilimDogaData as QuizQuestion[],
  'sosyal-medya': sosyalMedyaData as QuizQuestion[],
  'guncel-olaylar': guncelOlaylarData as QuizQuestion[],
};

export const quizService = {
  getRawQuestions(categoryId: QuizCategoryId): QuizQuestion[] {
    if (categoryId === 'karisik') {
      const all: QuizQuestion[] = [];
      Object.keys(categoryDataMap).forEach((key) => {
        all.push(...(categoryDataMap[key] || []));
      });
      return all;
    }
    return categoryDataMap[categoryId] || [];
  },

  getValidQuestions(categoryId: QuizCategoryId, difficulty?: DifficultyLevel): QuizQuestion[] {
    const raw = this.getRawQuestions(categoryId);
    const todayStr = new Date().toISOString().split('T')[0];

    // Filter out expired current events questions
    const valid = raw.filter((q) => {
      if (q.validUntil) {
        return q.validUntil >= todayStr;
      }
      return true;
    });

    if (difficulty) {
      const filteredByDiff = valid.filter((q) => q.difficulty === difficulty);
      return filteredByDiff.length > 0 ? filteredByDiff : valid;
    }

    return valid;
  },

  getAvailableCount(categoryId: QuizCategoryId): number {
    return this.getValidQuestions(categoryId).length;
  },

  isCategoryOutdated(categoryId: QuizCategoryId): boolean {
    if (categoryId !== 'guncel-olaylar') return false;
    const validCount = this.getAvailableCount('guncel-olaylar');
    return validCount === 0;
  },

  shuffleQuestionOptions(question: QuizQuestion): ShuffledQuizQuestion {
    const originalOptions = [...question.options];
    const correctOptionText = originalOptions[question.correctAnswer];

    // Shuffle options array
    const shuffledOptions = [...originalOptions].sort(() => Math.random() - 0.5);
    const shuffledCorrectIndex = shuffledOptions.indexOf(correctOptionText);

    return {
      ...question,
      shuffledOptions,
      shuffledCorrectIndex,
    };
  },

  getRandomQuestions(
    categoryId: QuizCategoryId,
    count: number = 10,
    difficulty?: DifficultyLevel,
    excludeIds: string[] = []
  ): ShuffledQuizQuestion[] {
    const validQuestions = this.getValidQuestions(categoryId, difficulty);
    const available = validQuestions.filter((q) => !excludeIds.includes(q.id));

    const pool = available.length >= count ? available : validQuestions;
    const selected = [...pool].sort(() => Math.random() - 0.5).slice(0, count);

    return selected.map((q) => this.shuffleQuestionOptions(q));
  },

  applyFiftyFiftyJoker(question: ShuffledQuizQuestion): ShuffledQuizQuestion {
    const correctIdx = question.shuffledCorrectIndex;
    const incorrectIndices = [0, 1, 2, 3].filter((i) => i !== correctIdx);

    // Pick 2 random incorrect options to eliminate
    const shuffledIncorrect = incorrectIndices.sort(() => Math.random() - 0.5);
    const eliminated = [shuffledIncorrect[0], shuffledIncorrect[1]];

    return {
      ...question,
      eliminatedOptionIndices: eliminated,
    };
  },

  calculateSpeedBonusScore(basePts: number, timeLeftSeconds: number): number {
    const speedBonus = Math.max(0, timeLeftSeconds * 10);
    return basePts + speedBonus;
  },
};
