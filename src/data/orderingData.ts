export type OrderingCategory =
  | 'turk-tarihi'
  | 'dunya-tarihi'
  | 'cografya'
  | 'bilim'
  | 'teknoloji'
  | 'spor'
  | 'sinema'
  | 'sayilar'
  | 'karisik';

export interface OrderingItem {
  id: number;
  label: string;
  valueNote?: string;
}

export interface OrderingQuestion {
  id: number;
  prompt: string;
  category: OrderingCategory;
  categoryName: string;
  difficulty: 'easy' | 'normal' | 'hard';
  items: OrderingItem[]; // Shuffled or initial items
  correctOrder: string[]; // Exact array of labels in correct order
  explanation: string;
  sourceNote?: string;
}

export const ORDERING_CATEGORIES: { id: OrderingCategory; name: string }[] = [
  { id: 'turk-tarihi', name: 'Türk Tarihi' },
  { id: 'dunya-tarihi', name: 'Dünya Tarihi' },
  { id: 'cografya', name: 'Coğrafya' },
  { id: 'bilim', name: 'Bilim & Doğa' },
  { id: 'teknoloji', name: 'Teknoloji' },
  { id: 'spor', name: 'Spor' },
  { id: 'sinema', name: 'Sinema' },
  { id: 'sayilar', name: 'Sayılar' },
  { id: 'karisik', name: 'Karışık' },
];

export const ORDERING_DATA: OrderingQuestion[] = [
  // Türk Tarihi (12+)
  {
    id: 1,
    prompt: 'Türk tarihindeki bu olayları KRONOLOJİK OLARAK (Eskiden Yeniye) sıralayın:',
    category: 'turk-tarihi',
    categoryName: 'Türk Tarihi',
    difficulty: 'normal',
    items: [
      { id: 1, label: 'Malazgirt Meydan Muharebesi', valueNote: '1071' },
      { id: 2, label: 'İstanbul\'un Fethi', valueNote: '1453' },
      { id: 3, label: 'TBMM\'nin Açılışı', valueNote: '1920' },
      { id: 4, label: 'Cumhuriyetin İlanı', valueNote: '1923' },
    ],
    correctOrder: [
      'Malazgirt Meydan Muharebesi',
      'İstanbul\'un Fethi',
      'TBMM\'nin Açılışı',
      'Cumhuriyetin İlanı',
    ],
    explanation: 'Malazgirt (1071), İstanbul\'un Fethi (1453), TBMM\'nin Açılışı (23 Nisan 1920), Cumhuriyet (29 Ekim 1923).',
    sourceNote: 'Türk Tarih Kurumu kronolojisi',
  },
  {
    id: 2,
    prompt: 'Osmanlı padişahlarını HÜKÜMDARLIK SIRASINA göre (Eskiden Yeniye) sıralayın:',
    category: 'turk-tarihi',
    categoryName: 'Türk Tarihi',
    difficulty: 'easy',
    items: [
      { id: 1, label: 'Osman Gazi' },
      { id: 2, label: 'Fatih Sultan Mehmet' },
      { id: 3, label: 'Kanuni Sultan Süleyman' },
      { id: 4, label: 'III. Selim' },
    ],
    correctOrder: [
      'Osman Gazi',
      'Fatih Sultan Mehmet',
      'Kanuni Sultan Süleyman',
      'III. Selim',
    ],
    explanation: 'Osman Gazi (1299), Fatih (1451), Kanuni (1520), III. Selim (1789).',
  },
  {
    id: 3,
    prompt: 'Kurtuluş Savaşı cephe ve antlaşmalarını KRONOLOJİK sıralayın:',
    category: 'turk-tarihi',
    categoryName: 'Türk Tarihi',
    difficulty: 'hard',
    items: [
      { id: 1, label: 'Amasya Genelgesi' },
      { id: 2, label: 'I. İnönü Muharebesi' },
      { id: 3, label: 'Sakarya Meydan Muharebesi' },
      { id: 4, label: 'Lozan Barış Antlaşması' },
    ],
    correctOrder: [
      'Amasya Genelgesi',
      'I. İnönü Muharebesi',
      'Sakarya Meydan Muharebesi',
      'Lozan Barış Antlaşması',
    ],
    explanation: 'Amasya Genelgesi (Haziran 1919), I. İnönü (Ocak 1921), Sakarya (Ağustos 1921), Lozan (Temmuz 1923).',
  },

  // Dünya Tarihi (12+)
  {
    id: 4,
    prompt: 'Tarihi devirleri KRONOLOJİK SIRAYA koyun:',
    category: 'dunya-tarihi',
    categoryName: 'Dünya Tarihi',
    difficulty: 'easy',
    items: [
      { id: 1, label: 'Yazının İcadı (İlk Çağ)' },
      { id: 2, label: 'Kavimler Göçü (Orta Çağ)' },
      { id: 3, label: 'Fransız İhtilali (Yakın Çağ)' },
      { id: 4, label: 'İkinci Dünya Savaşı' },
    ],
    correctOrder: [
      'Yazının İcadı (İlk Çağ)',
      'Kavimler Göçü (Orta Çağ)',
      'Fransız İhtilali (Yakın Çağ)',
      'İkinci Dünya Savaşı',
    ],
    explanation: 'Yazı (MÖ 3200), Kavimler Göçü (375), Fransız İhtilali (1789), II. Dünya Savaşı (1939).',
  },
  {
    id: 5,
    prompt: 'Sanat akımlarını ORTAYA ÇIKIŞ TARİHİNE göre sıralayın:',
    category: 'dunya-tarihi',
    categoryName: 'Dünya Tarihi',
    difficulty: 'normal',
    items: [
      { id: 1, label: 'Rönesans' },
      { id: 2, label: 'Barok' },
      { id: 3, label: 'Empresyonizm (İzlenimcilik)' },
      { id: 4, label: 'Kübizm' },
    ],
    correctOrder: [
      'Rönesans',
      'Barok',
      'Empresyonizm (İzlenimcilik)',
      'Kübizm',
    ],
    explanation: 'Rönesans (14.-16. yy), Barok (17. yy), Empresyonizm (19. yy sonu), Kübizm (20. yy başı).',
  },

  // Coğrafya (12+)
  {
    id: 6,
    prompt: 'Bu gezegenleri GÜNEŞ\'E YAKINLIĞINA göre (Yakından Uzağa) sıralayın:',
    category: 'cografya',
    categoryName: 'Coğrafya',
    difficulty: 'easy',
    items: [
      { id: 1, label: 'Merkür' },
      { id: 2, label: 'Dünya' },
      { id: 3, label: 'Jüpiter' },
      { id: 4, label: 'Neptün' },
    ],
    correctOrder: [
      'Merkür',
      'Dünya',
      'Jüpiter',
      'Neptün',
    ],
    explanation: 'Güneş\'e yakınlık sırası: Merkür, Venüs, Dünya, Mars, Jüpiter, Satürn, Uranüs, Neptün.',
  },
  {
    id: 7,
    prompt: 'Kıtaları YÜZÖLÇÜMÜ BÜYÜKLÜĞÜNE göre (Büyükten Küçüğe) sıralayın:',
    category: 'cografya',
    categoryName: 'Coğrafya',
    difficulty: 'normal',
    items: [
      { id: 1, label: 'Asya' },
      { id: 2, label: 'Afrika' },
      { id: 3, label: 'Avrupa' },
      { id: 4, label: 'Avustralya (Okyanusya)' },
    ],
    correctOrder: [
      'Asya',
      'Afrika',
      'Avrupa',
      'Avustralya (Okyanusya)',
    ],
    explanation: 'Yüzölçümü sırası: Asya (~44.5m km²), Afrika (~30m km²), Avrupa (~10m km²), Avustralya (~8.5m km²).',
  },

  // Bilim & Doğa (12+)
  {
    id: 8,
    prompt: 'Atmosfer katmanlarını YERDEN YÜKSEKLİĞE göre (Aşağıdan Yukarıya) sıralayın:',
    category: 'bilim',
    categoryName: 'Bilim & Doğa',
    difficulty: 'normal',
    items: [
      { id: 1, label: 'Troposfer' },
      { id: 2, label: 'Stratosfer' },
      { id: 3, label: 'Mezosfer' },
      { id: 4, label: 'Termosfer' },
    ],
    correctOrder: [
      'Troposfer',
      'Stratosfer',
      'Mezosfer',
      'Termosfer',
    ],
    explanation: 'Atmosfer katmanları sırasıyla Troposfer, Stratosfer, Mezosfer, Termosfer ve Ekzosferdir.',
  },
  {
    id: 9,
    prompt: 'Suyun fiziksel hallerini MOLEKÜL HAREKETLİLİĞİNE göre (Azdan Çoğa) sıralayın:',
    category: 'bilim',
    categoryName: 'Bilim & Doğa',
    difficulty: 'easy',
    items: [
      { id: 1, label: 'Buz (Katı)' },
      { id: 2, label: 'Su (Sıvı)' },
      { id: 3, label: 'Su Buharı (Gaz)' },
      { id: 4, label: 'Plazma' },
    ],
    correctOrder: [
      'Buz (Katı)',
      'Su (Sıvı)',
      'Su Buharı (Gaz)',
      'Plazma',
    ],
    explanation: 'Moleküler hareketlilik: Katı < Sıvı < Gaz < Plazma.',
  },

  // Teknoloji (12+)
  {
    id: 10,
    prompt: 'Veri depolama birimlerini KAPASİTE BÜYÜKLÜĞÜNE göre (Küçükten Büyüğe) sıralayın:',
    category: 'teknoloji',
    categoryName: 'Teknoloji',
    difficulty: 'easy',
    items: [
      { id: 1, label: 'Kilobyte (KB)' },
      { id: 2, label: 'Megabyte (MB)' },
      { id: 3, label: 'Gigabyte (GB)' },
      { id: 4, label: 'Terabyte (TB)' },
    ],
    correctOrder: [
      'Kilobyte (KB)',
      'Megabyte (MB)',
      'Gigabyte (GB)',
      'Terabyte (TB)',
    ],
    explanation: '1 KB < 1 MB (1024 KB) < 1 GB (1024 MB) < 1 TB (1024 GB).',
  },
  {
    id: 11,
    prompt: 'Mobil iletişim teknolojilerini KRONOLOJİK SIRAYA (Eskiden Yeniye) koyun:',
    category: 'teknoloji',
    categoryName: 'Teknoloji',
    difficulty: 'easy',
    items: [
      { id: 1, label: '1G (Analog Ses)' },
      { id: 2, label: '2G (SMS ve GSM)' },
      { id: 3, label: '3G (Mobil İnternet)' },
      { id: 4, label: '5G (Yüksek Hız)' },
    ],
    correctOrder: [
      '1G (Analog Ses)',
      '2G (SMS ve GSM)',
      '3G (Mobil İnternet)',
      '5G (Yüksek Hız)',
    ],
    explanation: '1G (1980\'ler), 2G (1990\'lar), 3G (2000\'ler), 5G (2019+).',
  },

  // Spor (12+)
  {
    id: 12,
    prompt: 'Futbol turnuvalarını OYNANMA PERİYODU / GEÇMİŞİNE göre sıralayın:',
    category: 'spor',
    categoryName: 'Spor',
    difficulty: 'normal',
    items: [
      { id: 1, label: 'İlk Modern Olimpiyat Oyunları', valueNote: '1896' },
      { id: 2, label: 'İlk Dünya Kupası', valueNote: '1930' },
      { id: 3, label: 'İlk Avrupa Şampiyonası (Euro)', valueNote: '1960' },
      { id: 4, label: 'İlk Şampiyonlar Ligi Sezonu', valueNote: '1992' },
    ],
    correctOrder: [
      'İlk Modern Olimpiyat Oyunları',
      'İlk Dünya Kupası',
      'İlk Avrupa Şampiyonası (Euro)',
      'İlk Şampiyonlar Ligi Sezonu',
    ],
    explanation: 'Olimpiyatlar (1896), Dünya Kupası (1930), EURO (1960), Şampiyonlar Ligi (1992).',
  },

  // Sinema (10+)
  {
    id: 13,
    prompt: 'Sinema teknolojilerini İCAT TARİHİNE göre (Eskiden Yeniye) sıralayın:',
    category: 'sinema',
    categoryName: 'Sinema',
    difficulty: 'normal',
    items: [
      { id: 1, label: 'Siyah-Beyaz Sessiz Film' },
      { id: 2, label: 'Sesli Film (Talkies)' },
      { id: 3, label: 'Renkli Film (Technicolor)' },
      { id: 4, label: '3D IMAX Gösterimleri' },
    ],
    correctOrder: [
      'Siyah-Beyaz Sessiz Film',
      'Sesli Film (Talkies)',
      'Renkli Film (Technicolor)',
      '3D IMAX Gösterimleri',
    ],
    explanation: 'Sessiz film (1890\'lar), Sesli film (1927), Renkli sinema (1930\'lar), 3D IMAX (2000\'ler).',
  },

  // Sayılar (10+)
  {
    id: 14,
    prompt: 'Bu matematiki sabitleri SAYISAL DEĞERİNE göre (Küçükten Büyüğe) sıralayın:',
    category: 'sayilar',
    categoryName: 'Sayılar',
    difficulty: 'hard',
    items: [
      { id: 1, label: 'Euler Sayısı (e)', valueNote: '~2.718' },
      { id: 2, label: 'Pi Sayısı (π)', valueNote: '~3.1415' },
      { id: 3, label: 'Altın Oran (φ)', valueNote: '~1.618' },
      { id: 4, label: 'Karekök 2 (√2)', valueNote: '~1.414' },
    ],
    correctOrder: [
      'Karekök 2 (√2)',
      'Altın Oran (φ)',
      'Euler Sayısı (e)',
      'Pi Sayısı (π)',
    ],
    explanation: '√2 (~1.414) < Altın Oran (~1.618) < e (~2.718) < π (~3.1415).',
  },
];

export function getOrderingQuestions(
  category: OrderingCategory,
  count: number = 10
): OrderingQuestion[] {
  let list =
    category === 'karisik'
      ? [...ORDERING_DATA]
      : ORDERING_DATA.filter((q) => q.category === category);

  if (list.length === 0) list = [...ORDERING_DATA];

  const shuffled = [...list].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}
