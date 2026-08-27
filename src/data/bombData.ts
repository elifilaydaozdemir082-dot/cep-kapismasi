export interface BombPrompt {
  id: number;
  prompt: string;
  type: 'category' | 'letter';
}

export const BOMB_PROMPTS: BombPrompt[] = [
  { id: 1, prompt: 'Bir hayvan söyle', type: 'category' },
  { id: 2, prompt: 'Bir Türkiye şehri söyle', type: 'category' },
  { id: 3, prompt: 'Bir dünya ülkesi söyle', type: 'category' },
  { id: 4, prompt: 'Bir meslek söyle', type: 'category' },
  { id: 5, prompt: 'Bir meyve veya sebze söyle', type: 'category' },
  { id: 6, prompt: 'Bir spor dalı söyle', type: 'category' },
  { id: 7, prompt: 'Bir müzik aleti söyle', type: 'category' },
  { id: 8, prompt: 'Mutfakta bulunan bir eşya söyle', type: 'category' },
  { id: 9, prompt: 'Bir giysi veya aksesuar söyle', type: 'category' },
  { id: 10, prompt: 'Bir renk söyle', type: 'category' },
  { id: 11, prompt: 'Denizde yaşayan bir canlı söyle', type: 'category' },
  { id: 12, prompt: 'Bir araba markası söyle', type: 'category' },
  { id: 13, prompt: 'Bir içecek söyle', type: 'category' },
  { id: 14, prompt: 'Bir kahvaltılık yiyecek söyle', type: 'category' },
  { id: 15, prompt: 'Bir kış sporu veya etkinliği söyle', type: 'category' },
  { id: 16, prompt: 'Bir ders veya akademik disiplin söyle', type: 'category' },
  { id: 17, prompt: 'Bir sinema filmi veya dizi adı söyle', type: 'category' },
  { id: 18, prompt: 'Bir çizgi film karakteri söyle', type: 'category' },
  { id: 19, prompt: 'Bir tatlı söyle', type: 'category' },
  { id: 20, prompt: 'Banyoda bulunan bir eşya söyle', type: 'category' },
  { id: 21, prompt: 'Bir okul eşyası söyle', type: 'category' },
  { id: 22, prompt: 'Bir kuş türü söyle', type: 'category' },
  { id: 23, prompt: 'Bir çiçek türü söyle', type: 'category' },
  { id: 24, prompt: 'Bir doğa olayı söyle', type: 'category' },
  { id: 25, prompt: 'Bir ulaşım aracı söyle', type: 'category' },

  // Letter prompts
  { id: 26, prompt: '"A" harfi ile başlayan bir kelime söyle', type: 'letter' },
  { id: 27, prompt: '"B" harfi ile başlayan bir kelime söyle', type: 'letter' },
  { id: 28, prompt: '"C" harfi ile başlayan bir kelime söyle', type: 'letter' },
  { id: 29, prompt: '"Ç" harfi ile başlayan bir kelime söyle', type: 'letter' },
  { id: 30, prompt: '"D" harfi ile başlayan bir kelime söyle', type: 'letter' },
  { id: 31, prompt: '"E" harfi ile başlayan bir kelime söyle', type: 'letter' },
  { id: 32, prompt: '"F" harfi ile başlayan bir kelime söyle', type: 'letter' },
  { id: 33, prompt: '"G" harfi ile başlayan bir kelime söyle', type: 'letter' },
  { id: 34, prompt: '"H" harfi ile başlayan bir kelime söyle', type: 'letter' },
  { id: 35, prompt: '"K" harfi ile başlayan bir kelime söyle', type: 'letter' },
  { id: 36, prompt: '"L" harfi ile başlayan bir kelime söyle', type: 'letter' },
  { id: 37, prompt: '"M" harfi ile başlayan bir kelime söyle', type: 'letter' },
  { id: 38, prompt: '"N" harfi ile başlayan bir kelime söyle', type: 'letter' },
  { id: 39, prompt: '"P" harfi ile başlayan bir kelime söyle', type: 'letter' },
  { id: 40, prompt: '"R" harfi ile başlayan bir kelime söyle', type: 'letter' },
  { id: 41, prompt: '"S" harfi ile başlayan bir kelime söyle', type: 'letter' },
  { id: 42, prompt: '"Ş" harfi ile başlayan bir kelime söyle', type: 'letter' },
  { id: 43, prompt: '"T" harfi ile başlayan bir kelime söyle', type: 'letter' },
  { id: 44, prompt: '"V" harfi ile başlayan bir kelime söyle', type: 'letter' },
  { id: 45, prompt: '"Y" harfi ile başlayan bir kelime söyle', type: 'letter' },
  { id: 46, prompt: '"Z" harfi ile başlayan bir kelime söyle', type: 'letter' },
  { id: 47, prompt: '"A" harfi ile biten bir kelime söyle', type: 'letter' },
  { id: 48, prompt: '"K" harfi ile biten bir kelime söyle', type: 'letter' },
  { id: 49, prompt: '"N" harfi ile biten bir kelime söyle', type: 'letter' },
  { id: 50, prompt: '"R" harfi ile biten bir kelime söyle', type: 'letter' },
];

export function getRandomBombPrompt(
  usedIds: number[] = [],
  randomFn: () => number = Math.random
): BombPrompt {
  const available = BOMB_PROMPTS.filter((p) => !usedIds.includes(p.id));
  const pool = available.length > 0 ? available : BOMB_PROMPTS;
  return pool[Math.floor(randomFn() * pool.length)];
}
