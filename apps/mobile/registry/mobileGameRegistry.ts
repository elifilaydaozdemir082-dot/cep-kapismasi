import { GameMode } from '../context/GameSessionContext';

export type MobileGameStatus = 'playable';

export type MobileGameCategory =
  | 'all'
  | 'refleks'
  | 'spor'
  | 'yaris'
  | 'kelime'
  | 'bilgi'
  | 'sosyal'
  | 'zeka'
  | 'sans';

export interface MobileGameDefinition {
  id: string;
  title: string;
  description: string;
  category: MobileGameCategory;
  categoryLabel: string;
  supportedModes: GameMode[];
  status: MobileGameStatus;
  route: string;
  iconName: string;
  color: string;
}

export const MOBILE_GAME_CATEGORIES: { id: MobileGameCategory; label: string }[] = [
  { id: 'all', label: 'Tümü' },
  { id: 'refleks', label: 'Hız ve Refleks' },
  { id: 'spor', label: 'Spor' },
  { id: 'yaris', label: 'Yarış' },
  { id: 'kelime', label: 'Kelime' },
  { id: 'bilgi', label: 'Bilgi' },
  { id: 'sosyal', label: 'Sosyal' },
  { id: 'zeka', label: 'Zekâ ve Denge' },
  { id: 'sans', label: 'Şans ve Strateji' },
];

export const MOBILE_GAME_REGISTRY: MobileGameDefinition[] = [
  // 1. Hedef Avı
  {
    id: 'target-hunt',
    title: 'Hedef Avı',
    description: 'Ekranda beliren hedeflere hızlıca dokun, isabet serini koru!',
    category: 'refleks',
    categoryLabel: 'Hız ve Refleks',
    supportedModes: ['single', 'multiplayer'],
    status: 'playable',
    route: '/games/target-hunt',
    iconName: 'Zap',
    color: '#38BDF8',
  },
  // 2. Mini Araba Yarışı
  {
    id: 'car-race',
    title: 'Mini Araba Yarışı',
    description: 'Otoyolda engellerden kaç, yakın geçişlerle ekstra skor kazan!',
    category: 'yaris',
    categoryLabel: 'Yarış',
    supportedModes: ['single', 'multiplayer'],
    status: 'playable',
    route: '/games/car-race',
    iconName: 'Car',
    color: '#F59E0B',
  },
  // 3. Penaltı Yarışması
  {
    id: 'penalty',
    title: 'Penaltı Yarışması',
    description: 'Topa falso ver, kaleciyi ters köşeye yatır ve golleri sırala!',
    category: 'spor',
    categoryLabel: 'Spor',
    supportedModes: ['single', 'multiplayer'],
    status: 'playable',
    route: '/games/penalty',
    iconName: 'Goal',
    color: '#10B981',
  },
  // 4. Basket Atışı
  {
    id: 'basketball',
    title: 'Basket Atışı',
    description: 'Topu geriye çekip potaya fırlat, temiz basketleri sırala!',
    category: 'spor',
    categoryLabel: 'Spor',
    supportedModes: ['single', 'multiplayer'],
    status: 'playable',
    route: '/games/basketball',
    iconName: 'Target',
    color: '#F97316',
  },
  // 5. Okçuluk
  {
    id: 'archery',
    title: 'Okçuluk',
    description: 'Rüzgâr hızını ve yay gücünü hesapla, tam 10 puanlık merkeze vur!',
    category: 'spor',
    categoryLabel: 'Spor',
    supportedModes: ['single', 'multiplayer'],
    status: 'playable',
    route: '/games/archery',
    iconName: 'Crosshair',
    color: '#EF4444',
  },
  // 6. Refleks Düellosu
  {
    id: 'reflex',
    title: 'Refleks Düellosu',
    description: 'Işık yandığı anda rakibinden hızlı dokun, düelloyu kazan!',
    category: 'refleks',
    categoryLabel: 'Hız ve Refleks',
    supportedModes: ['single', 'multiplayer'],
    status: 'playable',
    route: '/games/reflex',
    iconName: 'Activity',
    color: '#06B6D4',
  },
  // 7. Halat Çekme
  {
    id: 'tug-of-war',
    title: 'Halat Çekme',
    description: 'Cihazın kendi tarafına en hızlı dokunan oyuncu halatı çeker!',
    category: 'spor',
    categoryLabel: 'Spor',
    supportedModes: ['single', 'multiplayer'],
    status: 'playable',
    route: '/games/tug-of-war',
    iconName: 'Swords',
    color: '#8B5CF6',
  },
  // 8. Hava Hokeyi
  {
    id: 'air-hockey',
    title: 'Hava Hokeyi',
    description: 'Diski rakip kaleye fırlat, 5 gole ulaşan şampiyon olsun!',
    category: 'spor',
    categoryLabel: 'Spor',
    supportedModes: ['single', 'multiplayer'],
    status: 'playable',
    route: '/games/air-hockey',
    iconName: 'Disc',
    color: '#38BDF8',
  },
  // 9. Denge Kulesi
  {
    id: 'tower',
    title: 'Denge Kulesi',
    description: 'Sallanan kule bloklarını tam üst üste dizerek göğe yüksel!',
    category: 'zeka',
    categoryLabel: 'Zekâ ve Denge',
    supportedModes: ['single', 'multiplayer'],
    status: 'playable',
    route: '/games/tower',
    iconName: 'Layers',
    color: '#10B981',
  },
  // 10. Labirent Kaçışı
  {
    id: 'maze',
    title: 'Labirent Kaçışı',
    description: 'Anahtarı bul, duvarlara çarpmadan çıkış kapısına ulaş!',
    category: 'zeka',
    categoryLabel: 'Zekâ ve Denge',
    supportedModes: ['single', 'multiplayer'],
    status: 'playable',
    route: '/games/maze',
    iconName: 'Compass',
    color: '#06B6D4',
  },
  // 11. Hafıza Rotası
  {
    id: 'memory',
    title: 'Hafıza Rotası',
    description: 'Yanıp sönen ışık ve ses dizilimini aklında tut ve tekrar et!',
    category: 'zeka',
    categoryLabel: 'Zekâ ve Denge',
    supportedModes: ['single', 'multiplayer'],
    status: 'playable',
    route: '/games/memory',
    iconName: 'Brain',
    color: '#8B5CF6',
  },
  // 12. Tabu
  {
    id: 'tabu',
    title: 'Tabu',
    description: 'Yasaklı kelimeleri kullanmadan arkadaşlarına kelimeyi anlat!',
    category: 'kelime',
    categoryLabel: 'Kelime',
    supportedModes: ['single', 'multiplayer'],
    status: 'playable',
    route: '/games/tabu',
    iconName: 'MessageSquare',
    color: '#EC4899',
  },
  // 13. Kelimeyi Kurtar
  {
    id: 'hangman',
    title: 'Kelimeyi Kurtar',
    description: 'Yanlış tahmin hakların bitmeden gizli kelimeyi harf harf çöz!',
    category: 'kelime',
    categoryLabel: 'Kelime',
    supportedModes: ['single', 'multiplayer'],
    status: 'playable',
    route: '/games/hangman',
    iconName: 'HelpCircle',
    color: '#A855F7',
  },
  // 14. Kelime Avı
  {
    id: 'word-search',
    title: 'Kelime Avı',
    description: 'Harf tablosu içinde gizlenmiş kelimeleri en hızlı sen bul!',
    category: 'kelime',
    categoryLabel: 'Kelime',
    supportedModes: ['single', 'multiplayer'],
    status: 'playable',
    route: '/games/word-search',
    iconName: 'Search',
    color: '#14B8A6',
  },
  // 15. Karışık Harfler
  {
    id: 'anagram',
    title: 'Karışık Harfler',
    description: 'Karıştırılmış harflerden en fazla anlamlı kelimeyi türet!',
    category: 'kelime',
    categoryLabel: 'Kelime',
    supportedModes: ['single', 'multiplayer'],
    status: 'playable',
    route: '/games/anagram',
    iconName: 'Shuffle',
    color: '#F43F5E',
  },
  // 16. Yasak Harf
  {
    id: 'forbidden-letter',
    title: 'Yasak Harf',
    description: 'Belirlenen yasak harfi kullanmadan en uzun kelimeyi türet!',
    category: 'kelime',
    categoryLabel: 'Kelime',
    supportedModes: ['single', 'multiplayer'],
    status: 'playable',
    route: '/games/forbidden-letter',
    iconName: 'Ban',
    color: '#EAB308',
  },
  // 17. Kelime Zinciri
  {
    id: 'word-chain',
    title: 'Kelime Zinciri',
    description: 'Bir önceki kelimenin son harfiyle başlayan yeni kelime söyle!',
    category: 'kelime',
    categoryLabel: 'Kelime',
    supportedModes: ['single', 'multiplayer'],
    status: 'playable',
    route: '/games/word-chain',
    iconName: 'Link',
    color: '#6366F1',
  },
  // 18. Bilgi Yarışması: Klasik
  {
    id: 'quiz-classic',
    title: 'Bilgi Yarışması: Klasik',
    description: 'Tarih, bilim, coğrafya ve genel kültür sorularında yarış!',
    category: 'bilgi',
    categoryLabel: 'Bilgi',
    supportedModes: ['single', 'multiplayer'],
    status: 'playable',
    route: '/games/quiz-classic',
    iconName: 'BookOpen',
    color: '#3B82F6',
  },
  // 19. Bilgi Yarışması: Hızlı Parmak
  {
    id: 'quiz-fast-finger',
    title: 'Bilgi Yarışması: Hızlı Parmak',
    description: 'Soruları saniyeler içinde cevapla, ek hız bonusu kazan!',
    category: 'bilgi',
    categoryLabel: 'Bilgi',
    supportedModes: ['single', 'multiplayer'],
    status: 'playable',
    route: '/games/quiz-fast-finger',
    iconName: 'ZapFast',
    color: '#06B6D4',
  },
  // 20. Bilgi Yarışması: Doğru mu, Yanlış mı?
  {
    id: 'quiz-true-false',
    title: 'Doğru mu, Yanlış mı?',
    description: 'Bilgi cümlesini oku, saniyeler içinde Doğru veya Yanlış seç!',
    category: 'bilgi',
    categoryLabel: 'Bilgi',
    supportedModes: ['single', 'multiplayer'],
    status: 'playable',
    route: '/games/quiz-true-false',
    iconName: 'HelpCircle',
    color: '#10B981',
  },
  // 21. Kutunu Seç
  {
    id: 'box-deal',
    title: 'Kutunu Seç',
    description: 'Kutuları tek tek aç, büyük ödüle ulaşmak için teklifleri değerlendir!',
    category: 'sans',
    categoryLabel: 'Şans ve Strateji',
    supportedModes: ['single', 'multiplayer'],
    status: 'playable',
    route: '/games/box-deal',
    iconName: 'Gift',
    color: '#F59E0B',
  },
  // 22. Sessiz Sinema
  {
    id: 'charades',
    title: 'Sessiz Sinema',
    description: 'Konuşmadan ve ses çıkarmadan ekrandaki kelimeyi hareketlerinle anlat!',
    category: 'sosyal',
    categoryLabel: 'Sosyal',
    supportedModes: ['single', 'multiplayer'],
    status: 'playable',
    route: '/games/charades',
    iconName: 'Film',
    color: '#EC4899',
  },
  // 23. Bomba Kimde?
  {
    id: 'pass-the-bomb',
    title: 'Bomba Kimde?',
    description: 'Kategoriye uygun cevabı söyle, hemen telefonu sıradakine ver!',
    category: 'sosyal',
    categoryLabel: 'Sosyal',
    supportedModes: ['single', 'multiplayer'],
    status: 'playable',
    route: '/games/pass-the-bomb',
    iconName: 'Flame',
    color: '#EF4444',
  },
  // 24. Doğru Sıraya Koy
  {
    id: 'order-up',
    title: 'Doğru Sıraya Koy',
    description: 'Tarih, coğrafya ve bilim olaylarını doğru kronolojik sıraya diz!',
    category: 'sosyal',
    categoryLabel: 'Sosyal',
    supportedModes: ['single', 'multiplayer'],
    status: 'playable',
    route: '/games/order-up',
    iconName: 'ListOrdered',
    color: '#10B981',
  },
  // 25. Hangisi Daha Yakın?
  {
    id: 'estimation',
    title: 'Hangisi Daha Yakın?',
    description: 'Nüfus, mesafe ve boyut sorularında gerçek değere en yakın tahmini yap!',
    category: 'sosyal',
    categoryLabel: 'Sosyal',
    supportedModes: ['single', 'multiplayer'],
    status: 'playable',
    route: '/games/estimation',
    iconName: 'Target',
    color: '#38BDF8',
  },
];
