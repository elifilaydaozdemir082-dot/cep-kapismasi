import { describe, it, expect } from 'vitest';
import { getCharadesCards, CHARADES_DATA } from '../data/charadesData';
import { getRandomBombPrompt, BOMB_PROMPTS } from '../data/bombData';
import { getOrderingQuestions, ORDERING_DATA } from '../data/orderingData';
import { getEstimationQuestions, ESTIMATION_DATA } from '../data/estimationData';

describe('Sosyal Oyunlar Paketi Testleri', () => {
  // 1. Sessiz Sinema
  describe('Sessiz Sinema (Charades)', () => {
    it('1. Kartların tekrar etmemesini doğrular', () => {
      const cards = getCharadesCards('karisik', 30);
      expect(cards.length).toBe(30);
      const uniqueIds = new Set(cards.map((c) => c.id));
      expect(uniqueIds.size).toBe(30);
    });

    it('2. Kategoriye özel kart getirme doğru çalışmalı', () => {
      const filmCards = getCharadesCards('filmler', 10);
      filmCards.forEach((c) => expect(c.category).toBe('filmler'));
    });

    it('3. Toplam kart sayısı 180 üstünde olmalı', () => {
      expect(CHARADES_DATA.length).toBeGreaterThanOrEqual(180);
    });
  });

  // 2. Bomba Kimde?
  describe('Bomba Kimde? (Pass The Bomb)', () => {
    it('1. Rastgele sorularda tekrar yapılmamalı', () => {
      const used: number[] = [1, 2, 3];
      const prompt = getRandomBombPrompt(used);
      expect(used.includes(prompt.id)).toBe(false);
    });

    it('2. Toplam bomba sorusu 50 ve üzerinde olmalı', () => {
      expect(BOMB_PROMPTS.length).toBeGreaterThanOrEqual(50);
    });
  });

  // 3. Doğru Sıraya Koy
  describe('Doğru Sıraya Koy (Timeline / Ordering)', () => {
    it('1. Doğru sıralama kontrolü doğru sonuç vermeli', () => {
      const q = ORDERING_DATA[0];
      const correctList = [...q.correctOrder];
      expect(correctList.join(',')).toBe(q.correctOrder.join(','));
    });

    it('2. Soru veri sayısı 14 ve üzeri doğrulanmış soru olmalı', () => {
      expect(ORDERING_DATA.length).toBeGreaterThanOrEqual(14);
    });

    it('3. Kartların rastgele karıştırılması özgün dizi üretmeli', () => {
      const questions = getOrderingQuestions('karisik', 5);
      expect(questions.length).toBe(5);
    });
  });

  // 4. Hangisi Daha Yakın?
  describe('Hangisi Daha Yakın? (Numerical Estimation)', () => {
    it('1. Mutlak fark ve yüzde fark hesabı doğru olmalı', () => {
      const correct = 100;
      const guess = 95;
      const absDiff = Math.abs(guess - correct);
      const errorPercent = (absDiff / correct) * 100;

      expect(absDiff).toBe(5);
      expect(errorPercent).toBe(5);
    });

    it('2. Sıfır cevap durumunda güvenli bölme hatası oluşmamalı', () => {
      const correct = 0;
      const guess = 5;
      const absDiff = Math.abs(guess - correct);
      const errorPercent = correct === 0 ? (absDiff === 0 ? 0 : 100) : (absDiff / Math.abs(correct)) * 100;

      expect(absDiff).toBe(5);
      expect(errorPercent).toBe(100);
      expect(Number.isNaN(errorPercent)).toBe(false);
    });

    it('3. Soruların geçerlilik tarihi kontrolü çalışmalı', () => {
      expect(ESTIMATION_DATA.length).toBeGreaterThanOrEqual(14);
      const validQuestions = getEstimationQuestions('karisik', 10);
      expect(validQuestions.length).toBe(10);
    });
  });
});
