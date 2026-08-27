export type EstimationCategory =
  | 'genel-kultur'
  | 'turkiye'
  | 'dunya'
  | 'bilim'
  | 'spor'
  | 'tarih'
  | 'teknoloji'
  | 'eglence'
  | 'karisik';

export interface EstimationQuestion {
  id: number;
  question: string;
  correctValue: number;
  unit: string;
  category: EstimationCategory;
  categoryName: string;
  sourceNote: string;
  verifiedAt: string; // YYYY-MM-DD
  validUntil?: string; // YYYY-MM-DD or undefined
  explanation?: string;
}

export const ESTIMATION_CATEGORIES: { id: EstimationCategory; name: string }[] = [
  { id: 'genel-kultur', name: 'Genel Kültür' },
  { id: 'turkiye', name: 'Türkiye' },
  { id: 'dunya', name: 'Dünya' },
  { id: 'bilim', name: 'Bilim & Doğa' },
  { id: 'spor', name: 'Spor' },
  { id: 'tarih', name: 'Tarih' },
  { id: 'teknoloji', name: 'Teknoloji' },
  { id: 'eglence', name: 'Eğlence' },
  { id: 'karisik', name: 'Karışık' },
];

export const ESTIMATION_DATA: EstimationQuestion[] = [
  // Türkiye (12+)
  {
    id: 1,
    question: 'TÜİK resmi verilerine göre Türkiye\'nin toplam nüfusu kaçtır?',
    correctValue: 85372377,
    unit: 'kullanıcı',
    category: 'turkiye',
    categoryName: 'Türkiye',
    sourceNote: 'TÜİK 2023 Nüfus Sayımı',
    verifiedAt: '2026-01-15',
    explanation: '2023 sonu itibarıyla Türkiye nüfusu 85.372.377 kişidir.',
  },
  {
    id: 2,
    question: 'İstanbul Boğazı\'nın en dar yerinin genişliği kaç metredir?',
    correctValue: 698,
    unit: 'metre',
    category: 'turkiye',
    categoryName: 'Türkiye',
    sourceNote: 'Kıyı Emniyeti Genel Müdürlüğü',
    verifiedAt: '2026-01-15',
    explanation: 'Anadolu Hisarı ile Rumeli Hisarı arasındaki en dar mesafe 698 metredir.',
  },
  {
    id: 3,
    question: 'Türkiye\'nin en yüksek dağı olan Ağrı Dağı\'nın rakımı kaç metredir?',
    correctValue: 5137,
    unit: 'metre',
    category: 'turkiye',
    categoryName: 'Türkiye',
    sourceNote: 'Harita Genel Müdürlüğü',
    verifiedAt: '2026-01-15',
    explanation: 'Ağrı Dağı zirvesi 5.137 metre yüksekliktedir.',
  },
  {
    id: 4,
    question: 'Türkiye\'nin yüzölçümü kaç kilometrekaredir?',
    correctValue: 783562,
    unit: 'km²',
    category: 'turkiye',
    categoryName: 'Türkiye',
    sourceNote: 'Harita Genel Müdürlüğü',
    verifiedAt: '2026-01-15',
    explanation: 'Türkiye\'nin karasal yüzölçümü 783.562 km²\'dir.',
  },

  // Dünya (12+)
  {
    id: 5,
    question: 'Dünya\'nın Ekvator etrafındaki çevresi yaklaşık kaç kilometredir?',
    correctValue: 40075,
    unit: 'km',
    category: 'dunya',
    categoryName: 'Dünya',
    sourceNote: 'NASA Earth Data',
    verifiedAt: '2026-01-15',
    explanation: 'Dünya\'nın Ekvatoral çevre uzunluğu 40.075 kilometredir.',
  },
  {
    id: 6,
    question: 'Dünyanın en yüksek binası Burj Khalifa\'nın yüksekliği kaç metredir?',
    correctValue: 828,
    unit: 'metre',
    category: 'dunya',
    categoryName: 'Dünya',
    sourceNote: 'Guinness Dünya Rekorları',
    verifiedAt: '2026-01-15',
    explanation: 'Dubai\'deki Burj Khalifa 828 metre yüksekliğe sahiptir.',
  },
  {
    id: 7,
    question: 'Dünyanın en derin noktası Mariana Çukuru kaç metre derinliktedir?',
    correctValue: 10994,
    unit: 'metre',
    category: 'dunya',
    categoryName: 'Dünya',
    sourceNote: 'NOAA Ocean Data',
    verifiedAt: '2026-01-15',
    explanation: 'Mariana Çukuru\'nun Challenger Derinliği yaklaşık 10.994 metredir.',
  },

  // Bilim & Doğa (12+)
  {
    id: 8,
    question: 'Işığın boşluktaki hızı yaklaşık saniyede kaç kilometredir?',
    correctValue: 299792,
    unit: 'km/s',
    category: 'bilim',
    categoryName: 'Bilim & Doğa',
    sourceNote: 'SI Uluslararası Birimler Sistemi',
    verifiedAt: '2026-01-15',
    explanation: 'Işık hızı tam olarak 299.792,458 km/saniyedir.',
  },
  {
    id: 9,
    question: 'Dünya ile Ay arasındaki ortalama mesafe kaç kilometredir?',
    correctValue: 384400,
    unit: 'km',
    category: 'bilim',
    categoryName: 'Bilim & Doğa',
    sourceNote: 'NASA Moon Exploration',
    verifiedAt: '2026-01-15',
    explanation: 'Dünya ile Ay arası ortalama uzaklık 384.400 kilometredir.',
  },
  {
    id: 10,
    question: 'İnsan vücudundaki ortalama kemik sayısı kaçtır?',
    correctValue: 206,
    unit: 'adet',
    category: 'bilim',
    categoryName: 'Bilim & Doğa',
    sourceNote: 'Anatomi Veritabanı',
    verifiedAt: '2026-01-15',
    explanation: 'Yetişkin bir insan iskeletinde 206 adet kemik bulunur.',
  },

  // Tarih (12+)
  {
    id: 11,
    question: 'Kristof Kolomb Amerika kıtasına hangi yılda ulaşmıştır?',
    correctValue: 1492,
    unit: 'yıl',
    category: 'tarih',
    categoryName: 'Tarih',
    sourceNote: 'Tarih Kronolojisi',
    verifiedAt: '2026-01-15',
    explanation: 'Kolomb\'un ilk Amerika seferi 1492 yılında gerçekleşmiştir.',
  },
  {
    id: 12,
    question: 'İnsanlığın Ay\'a ilk ayak bastığı Apollo 11 görevi hangi yılda gerçekleşmiştir?',
    correctValue: 1969,
    unit: 'yıl',
    category: 'tarih',
    categoryName: 'Tarih',
    sourceNote: 'NASA Archives',
    verifiedAt: '2026-01-15',
    explanation: 'Neil Armstrong 20 Temmuz 1969\'da Ay\'a basmıştır.',
  },

  // Spor (10+)
  {
    id: 13,
    question: 'Usain Bolt\'un 100 metre erkekler dünya rekoru kaç saniyedir?',
    correctValue: 9.58,
    unit: 'saniye',
    category: 'spor',
    categoryName: 'Spor',
    sourceNote: 'IAAF Dünya Rekorları',
    verifiedAt: '2026-01-15',
    explanation: 'Usain Bolt 2009 Berlin\'de 100 metreyi 9.58 saniyede koşmuştur.',
  },
  {
    id: 14,
    question: 'Futbol kalesinin iki iç direği arasındaki genişlik kaç metredir?',
    correctValue: 7.32,
    unit: 'metre',
    category: 'spor',
    categoryName: 'Spor',
    sourceNote: 'IFAB Oyun Kuralları',
    verifiedAt: '2026-01-15',
    explanation: 'Nizamî futbol kalesi genişliği 7.32 metre (8 yarda), yüksekliği 2.44 metredir.',
  },
];

export function getEstimationQuestions(
  category: EstimationCategory,
  count: number = 10
): EstimationQuestion[] {
  const currentDate = new Date().toISOString().split('T')[0];

  let list = ESTIMATION_DATA.filter((q) => {
    if (q.validUntil && q.validUntil < currentDate) return false;
    return category === 'karisik' || q.category === category;
  });

  if (list.length === 0) list = [...ESTIMATION_DATA];

  const shuffled = [...list].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}
