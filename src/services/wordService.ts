import wordsData from '../data/words.json';
import tabuCardsData from '../data/tabuCards.json';
import type { TabuCardItem, WordCategory, WordItem } from '../types/game';
import { toTurkishUpper } from '../utils/wordUtils';

export const wordService = {
  getAllWords(): WordItem[] {
    try {
      return (wordsData as WordItem[]).map((w) => ({
        ...w,
        word: toTurkishUpper(w.word),
      }));
    } catch {
      return [];
    }
  },

  getWordsByCategory(category: WordCategory): WordItem[] {
    const all = this.getAllWords();
    return all.filter((w) => w.category === category);
  },

  getRandomWord(category?: WordCategory, excludeWords: string[] = []): WordItem | null {
    const all = category ? this.getWordsByCategory(category) : this.getAllWords();
    const available = all.filter((w) => !excludeWords.includes(w.word));
    if (available.length === 0) {
      if (all.length === 0) return null;
      return all[Math.floor(Math.random() * all.length)];
    }
    return available[Math.floor(Math.random() * available.length)];
  },

  getAllTabuCards(): TabuCardItem[] {
    try {
      return (tabuCardsData as TabuCardItem[]).map((card) => ({
        ...card,
        word: toTurkishUpper(card.word),
        forbidden: card.forbidden.map((f) => toTurkishUpper(f)),
      }));
    } catch {
      return [];
    }
  },

  isValidDictionaryWord(inputWord: string): boolean {
    if (!inputWord) return false;
    const normInput = toTurkishUpper(inputWord.trim());
    const allWords = this.getAllWords();
    return allWords.some((w) => toTurkishUpper(w.word) === normInput);
  },
};
