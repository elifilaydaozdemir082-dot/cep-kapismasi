export type CharadesCategory =
  | 'filmler'
  | 'diziler'
  | 'meslekler'
  | 'hayvanlar'
  | 'gunluk'
  | 'karakterler'
  | 'karisik';

export interface CharadesCard {
  id: number;
  word: string;
  category: CharadesCategory;
  categoryName: string;
  hint?: string;
}

export const CHARADES_CATEGORIES: { id: CharadesCategory; name: string }[] = [
  { id: 'filmler', name: 'Filmler' },
  { id: 'diziler', name: 'Diziler' },
  { id: 'meslekler', name: 'Meslekler' },
  { id: 'hayvanlar', name: 'Hayvanlar' },
  { id: 'gunluk', name: 'Günlük Eylemler' },
  { id: 'karakterler', name: 'Masal & Kurgu Karakterleri' },
  { id: 'karisik', name: 'Karışık' },
];

export const CHARADES_DATA: CharadesCard[] = [
  // Filmler (30+)
  { id: 1, word: 'Babam ve Oğlum', category: 'filmler', categoryName: 'Filmler' },
  { id: 2, word: 'Hababam Sınıfı', category: 'filmler', categoryName: 'Filmler' },
  { id: 3, word: 'G.O.R.A.', category: 'filmler', categoryName: 'Filmler' },
  { id: 4, word: 'Vizontele', category: 'filmler', categoryName: 'Filmler' },
  { id: 5, word: 'Buz Devri', category: 'filmler', categoryName: 'Filmler' },
  { id: 6, word: 'Titanik', category: 'filmler', categoryName: 'Filmler' },
  { id: 7, word: 'Avatar', category: 'filmler', categoryName: 'Filmler' },
  { id: 8, word: 'Yüzüklerin Efendisi', category: 'filmler', categoryName: 'Filmler' },
  { id: 9, word: 'Geleceğe Dönüş', category: 'filmler', categoryName: 'Filmler' },
  { id: 10, word: 'Aslan Kral', category: 'filmler', categoryName: 'Filmler' },
  { id: 11, word: 'Şrek', category: 'filmler', categoryName: 'Filmler' },
  { id: 12, word: 'Matrix', category: 'filmler', categoryName: 'Filmler' },
  { id: 13, word: 'Gladyatör', category: 'filmler', categoryName: 'Filmler' },
  { id: 14, word: 'Evde Tek Başına', category: 'filmler', categoryName: 'Filmler' },
  { id: 15, word: 'Karayip Korsanları', category: 'filmler', categoryName: 'Filmler' },
  { id: 16, word: 'Tosun Paşa', category: 'filmler', categoryName: 'Filmler' },
  { id: 17, word: 'Süt Kardeşler', category: 'filmler', categoryName: 'Filmler' },
  { id: 18, word: 'Neşeli Günler', category: 'filmler', categoryName: 'Filmler' },
  { id: 19, word: 'Selvi Boylum Al Yazmalım', category: 'filmler', categoryName: 'Filmler' },
  { id: 20, word: 'Kral Şakir', category: 'filmler', categoryName: 'Filmler' },
  { id: 21, word: 'Eşkıya', category: 'filmler', categoryName: 'Filmler' },
  { id: 22, word: 'Devrim Arabaları', category: 'filmler', categoryName: 'Filmler' },
  { id: 23, word: 'Çöpçüler Kralı', category: 'filmler', categoryName: 'Filmler' },
  { id: 24, word: 'Kibar Feyzo', category: 'filmler', categoryName: 'Filmler' },
  { id: 25, word: 'Ayla', category: 'filmler', categoryName: 'Filmler' },
  { id: 26, word: '7. Koğustaki Mucize', category: 'filmler', categoryName: 'Filmler' },
  { id: 27, word: 'Arif v 216', category: 'filmler', categoryName: 'Filmler' },
  { id: 28, word: 'Ölü Ozanlar Derneği', category: 'filmler', categoryName: 'Filmler' },
  { id: 29, word: 'Yıldızlararası', category: 'filmler', categoryName: 'Filmler' },
  { id: 30, word: 'Başlangıç', category: 'filmler', categoryName: 'Filmler' },

  // Diziler (30+)
  { id: 31, word: 'Leyla ile Mecnun', category: 'diziler', categoryName: 'Diziler' },
  { id: 32, word: 'Avrupa Yakası', category: 'diziler', categoryName: 'Diziler' },
  { id: 33, word: 'Geniş Aile', category: 'diziler', categoryName: 'Diziler' },
  { id: 34, word: 'Ezel', category: 'diziler', categoryName: 'Diziler' },
  { id: 35, word: 'Kurtlar Vadisi', category: 'diziler', categoryName: 'Diziler' },
  { id: 36, word: 'Çukur', category: 'diziler', categoryName: 'Diziler' },
  { id: 37, word: 'Yargı', category: 'diziler', categoryName: 'Diziler' },
  { id: 38, word: 'Seksenler', category: 'diziler', categoryName: 'Diziler' },
  { id: 39, word: 'Cennet Mahallesi', category: 'diziler', categoryName: 'Diziler' },
  { id: 40, word: 'Akasya Durağı', category: 'diziler', categoryName: 'Diziler' },
  { id: 41, word: 'Sihirli Annem', category: 'diziler', categoryName: 'Diziler' },
  { id: 42, word: 'Bez Bebek', category: 'diziler', categoryName: 'Diziler' },
  { id: 43, word: 'İşler Güçler', category: 'diziler', categoryName: 'Diziler' },
  { id: 44, word: 'Kardeş Payı', category: 'diziler', categoryName: 'Diziler' },
  { id: 45, word: 'Gibi', category: 'diziler', categoryName: 'Diziler' },
  { id: 46, word: 'Prens', category: 'diziler', categoryName: 'Diziler' },
  { id: 47, word: 'Muhteşem Yüzyıl', category: 'diziler', categoryName: 'Diziler' },
  { id: 48, word: 'Aşk-ı Memnu', category: 'diziler', categoryName: 'Diziler' },
  { id: 49, word: 'Yaprak Dökümü', category: 'diziler', categoryName: 'Diziler' },
  { id: 50, word: 'Behzat Ç.', category: 'diziler', categoryName: 'Diziler' },
  { id: 51, word: '7 Numara', category: 'diziler', categoryName: 'Diziler' },
  { id: 52, word: 'En Son Babalar Duyar', category: 'diziler', categoryName: 'Diziler' },
  { id: 53, word: 'Çocuklar Duymasın', category: 'diziler', categoryName: 'Diziler' },
  { id: 54, word: 'Tatlı Hayat', category: 'diziler', categoryName: 'Diziler' },
  { id: 55, word: 'Yabancı Damat', category: 'diziler', categoryName: 'Diziler' },
  { id: 56, word: 'Kavak Yelleri', category: 'diziler', categoryName: 'Diziler' },
  { id: 57, word: 'Doktorlar', category: 'diziler', categoryName: 'Diziler' },
  { id: 58, word: 'Arka Sokaklar', category: 'diziler', categoryName: 'Diziler' },
  { id: 59, word: 'Stranger Things', category: 'diziler', categoryName: 'Diziler' },
  { id: 60, word: 'Squid Game', category: 'diziler', categoryName: 'Diziler' },

  // Meslekler (30+)
  { id: 61, word: 'Astronot', category: 'meslekler', categoryName: 'Meslekler' },
  { id: 62, word: 'İtfaiyeci', category: 'meslekler', categoryName: 'Meslekler' },
  { id: 63, word: 'Cerrah', category: 'meslekler', categoryName: 'Meslekler' },
  { id: 64, word: 'Dedektif', category: 'meslekler', categoryName: 'Meslekler' },
  { id: 65, word: 'Hakem', category: 'meslekler', categoryName: 'Meslekler' },
  { id: 66, word: 'Pilot', category: 'meslekler', categoryName: 'Meslekler' },
  { id: 67, word: 'Aşçı', category: 'meslekler', categoryName: 'Meslekler' },
  { id: 68, word: 'Ressam', category: 'meslekler', categoryName: 'Meslekler' },
  { id: 69, word: 'Balerin', category: 'meslekler', categoryName: 'Meslekler' },
  { id: 70, word: 'Sihirbaz', category: 'meslekler', categoryName: 'Meslekler' },
  { id: 71, word: 'Orkestra Şefi', category: 'meslekler', categoryName: 'Meslekler' },
  { id: 72, word: 'Dalgıç', category: 'meslekler', categoryName: 'Meslekler' },
  { id: 73, word: 'Mimar', category: 'meslekler', categoryName: 'Meslekler' },
  { id: 74, word: 'Marangoz', category: 'meslekler', categoryName: 'Meslekler' },
  { id: 75, word: 'Berber', category: 'meslekler', categoryName: 'Meslekler' },
  { id: 76, word: 'Garson', category: 'meslekler', categoryName: 'Meslekler' },
  { id: 77, word: 'Madenci', category: 'meslekler', categoryName: 'Meslekler' },
  { id: 78, word: 'Kuyumcu', category: 'meslekler', categoryName: 'Meslekler' },
  { id: 79, word: 'Gazeteci', category: 'meslekler', categoryName: 'Meslekler' },
  { id: 80, word: 'Fotoğrafçı', category: 'meslekler', categoryName: 'Meslekler' },
  { id: 81, word: 'Veteriner', category: 'meslekler', categoryName: 'Meslekler' },
  { id: 82, word: 'Diş Hekimi', category: 'meslekler', categoryName: 'Meslekler' },
  { id: 83, word: 'Polis', category: 'meslekler', categoryName: 'Meslekler' },
  { id: 84, word: 'Kaptan', category: 'meslekler', categoryName: 'Meslekler' },
  { id: 85, word: 'Müzisyen', category: 'meslekler', categoryName: 'Meslekler' },
  { id: 86, word: 'Heykeltıraş', category: 'meslekler', categoryName: 'Meslekler' },
  { id: 87, word: 'Palyaço', category: 'meslekler', categoryName: 'Meslekler' },
  { id: 88, word: 'Bahçıvan', category: 'meslekler', categoryName: 'Meslekler' },
  { id: 89, word: 'Terzi', category: 'meslekler', categoryName: 'Meslekler' },
  { id: 90, word: 'Makinist', category: 'meslekler', categoryName: 'Meslekler' },

  // Hayvanlar (30+)
  { id: 91, word: 'Penguen', category: 'hayvanlar', categoryName: 'Hayvanlar' },
  { id: 92, word: 'Zürafa', category: 'hayvanlar', categoryName: 'Hayvanlar' },
  { id: 93, word: 'Kanguru', category: 'hayvanlar', categoryName: 'Hayvanlar' },
  { id: 94, word: 'Bukalemun', category: 'hayvanlar', categoryName: 'Hayvanlar' },
  { id: 95, word: 'Goril', category: 'hayvanlar', categoryName: 'Hayvanlar' },
  { id: 96, word: 'Yunus', category: 'hayvanlar', categoryName: 'Hayvanlar' },
  { id: 97, word: 'Devekuşu', category: 'hayvanlar', categoryName: 'Hayvanlar' },
  { id: 98, word: 'Tembel Hayvan', category: 'hayvanlar', categoryName: 'Hayvanlar' },
  { id: 99, word: 'Kutup Ayısı', category: 'hayvanlar', categoryName: 'Hayvanlar' },
  { id: 100, word: 'Su Aygırı', category: 'hayvanlar', categoryName: 'Hayvanlar' },
  { id: 101, word: 'Akrep', category: 'hayvanlar', categoryName: 'Hayvanlar' },
  { id: 102, word: 'Yengeç', category: 'hayvanlar', categoryName: 'Hayvanlar' },
  { id: 103, word: 'Yarasa', category: 'hayvanlar', categoryName: 'Hayvanlar' },
  { id: 104, word: 'Tavus Kuşu', category: 'hayvanlar', categoryName: 'Hayvanlar' },
  { id: 105, word: 'Ahtapot', category: 'hayvanlar', categoryName: 'Hayvanlar' },
  { id: 106, word: 'Bülbül', category: 'hayvanlar', categoryName: 'Hayvanlar' },
  { id: 107, word: 'Karakulak', category: 'hayvanlar', categoryName: 'Hayvanlar' },
  { id: 108, word: 'Koala', category: 'hayvanlar', categoryName: 'Hayvanlar' },
  { id: 109, word: 'Panda', category: 'hayvanlar', categoryName: 'Hayvanlar' },
  { id: 110, word: 'Flamingo', category: 'hayvanlar', categoryName: 'Hayvanlar' },
  { id: 111, word: 'Timsah', category: 'hayvanlar', categoryName: 'Hayvanlar' },
  { id: 112, word: 'Sincap', category: 'hayvanlar', categoryName: 'Hayvanlar' },
  { id: 113, word: 'Kirpi', category: 'hayvanlar', categoryName: 'Hayvanlar' },
  { id: 114, word: 'Denizatı', category: 'hayvanlar', categoryName: 'Hayvanlar' },
  { id: 115, word: 'Çita', category: 'hayvanlar', categoryName: 'Hayvanlar' },
  { id: 116, word: 'Lemur', category: 'hayvanlar', categoryName: 'Hayvanlar' },
  { id: 117, word: 'Pelikan', category: 'hayvanlar', categoryName: 'Hayvanlar' },
  { id: 118, word: 'Köpekbalığı', category: 'hayvanlar', categoryName: 'Hayvanlar' },
  { id: 119, word: 'Kartal', category: 'hayvanlar', categoryName: 'Hayvanlar' },
  { id: 120, word: 'Bukalemun', category: 'hayvanlar', categoryName: 'Hayvanlar' },

  // Günlük Eylemler (30+)
  { id: 121, word: 'Diş Fırçalamak', category: 'gunluk', categoryName: 'Günlük Eylemler' },
  { id: 122, word: 'Yumurta Kırmak', category: 'gunluk', categoryName: 'Günlük Eylemler' },
  { id: 123, word: 'Saç Taramak', category: 'gunluk', categoryName: 'Günlük Eylemler' },
  { id: 124, word: 'Araba Kullanmak', category: 'gunluk', categoryName: 'Günlük Eylemler' },
  { id: 125, word: 'Çamaşır Asmak', category: 'gunluk', categoryName: 'Günlük Eylemler' },
  { id: 126, word: 'Ütü Yapmak', category: 'gunluk', categoryName: 'Günlük Eylemler' },
  { id: 127, word: 'Bisiklete Binmek', category: 'gunluk', categoryName: 'Günlük Eylemler' },
  { id: 128, word: 'Kravat Bağlamak', category: 'gunluk', categoryName: 'Günlük Eylemler' },
  { id: 129, word: 'Özçekim (Selfie) Çekmek', category: 'gunluk', categoryName: 'Günlük Eylemler' },
  { id: 130, word: 'Uçurtma Uçurmak', category: 'gunluk', categoryName: 'Günlük Eylemler' },
  { id: 131, word: 'Balık Tutmak', category: 'gunluk', categoryName: 'Günlük Eylemler' },
  { id: 132, word: 'Halı Yıkamak', category: 'gunluk', categoryName: 'Günlük Eylemler' },
  { id: 133, word: 'Bulaşık Yıkamak', category: 'gunluk', categoryName: 'Günlük Eylemler' },
  { id: 134, word: 'Resim Çizmek', category: 'gunluk', categoryName: 'Günlük Eylemler' },
  { id: 135, word: 'Gitar Çalmak', category: 'gunluk', categoryName: 'Günlük Eylemler' },
  { id: 136, word: 'Ayakkabı Bağlamak', category: 'gunluk', categoryName: 'Günlük Eylemler' },
  { id: 137, word: 'Saksıya Çiçek Dikmek', category: 'gunluk', categoryName: 'Günlük Eylemler' },
  { id: 138, word: 'Piyango Bileti Kazımak', category: 'gunluk', categoryName: 'Günlük Eylemler' },
  { id: 139, word: 'Tavşan Uykusuna Yatmak', category: 'gunluk', categoryName: 'Günlük Eylemler' },
  { id: 140, word: 'Hamur Açmak', category: 'gunluk', categoryName: 'Günlük Eylemler' },
  { id: 141, word: 'Karpuz Kesmek', category: 'gunluk', categoryName: 'Günlük Eylemler' },
  { id: 142, word: 'Bavul Hazırlamak', category: 'gunluk', categoryName: 'Günlük Eylemler' },
  { id: 143, word: 'Kar Topu Oynamak', category: 'gunluk', categoryName: 'Günlük Eylemler' },
  { id: 144, word: 'Kardan Adam Yapmak', category: 'gunluk', categoryName: 'Günlük Eylemler' },
  { id: 145, word: 'Yerleri Süpürmek', category: 'gunluk', categoryName: 'Günlük Eylemler' },
  { id: 146, word: 'Düğme Dikmek', category: 'gunluk', categoryName: 'Günlük Eylemler' },
  { id: 147, word: 'Gözlük Silmek', category: 'gunluk', categoryName: 'Günlük Eylemler' },
  { id: 148, word: 'Kola Şişesi Açmak', category: 'gunluk', categoryName: 'Günlük Eylemler' },
  { id: 149, word: 'Çay Demlemek', category: 'gunluk', categoryName: 'Günlük Eylemler' },
  { id: 150, word: 'Sinek Kovalama', category: 'gunluk', categoryName: 'Günlük Eylemler' },

  // Masal & Kurgu Karakterleri (30+)
  { id: 151, word: 'Pamuk Prenses', category: 'karakterler', categoryName: 'Karakterler' },
  { id: 152, word: 'Pinokyo', category: 'karakterler', categoryName: 'Karakterler' },
  { id: 153, word: 'Kırmızı Başlıklı Kız', category: 'karakterler', categoryName: 'Karakterler' },
  { id: 154, word: 'Çizmeli Kedi', category: 'karakterler', categoryName: 'Karakterler' },
  { id: 155, word: 'Keloğlan', category: 'karakterler', categoryName: 'Karakterler' },
  { id: 156, word: 'Nasreddin Hoca', category: 'karakterler', categoryName: 'Karakterler' },
  { id: 157, word: 'Karagöz ve Hacivat', category: 'karakterler', categoryName: 'Karakterler' },
  { id: 158, word: 'Robin Hood', category: 'karakterler', categoryName: 'Karakterler' },
  { id: 159, word: 'Peter Pan', category: 'karakterler', categoryName: 'Karakterler' },
  { id: 160, word: 'Tarzan', category: 'karakterler', categoryName: 'Karakterler' },
  { id: 161, word: 'Süpermen', category: 'karakterler', categoryName: 'Karakterler' },
  { id: 162, word: 'Örümcek Adam', category: 'karakterler', categoryName: 'Karakterler' },
  { id: 163, word: 'Batman', category: 'karakterler', categoryName: 'Karakterler' },
  { id: 164, word: 'Sünger Bob', category: 'karakterler', categoryName: 'Karakterler' },
  { id: 165, word: 'Alis (Harikalar Diyarı)', category: 'karakterler', categoryName: 'Karakterler' },
  { id: 166, word: 'Sindirella (Külkedisi)', category: 'karakterler', categoryName: 'Karakterler' },
  { id: 167, word: 'Alaaddin ve Sihirli Lambası', category: 'karakterler', categoryName: 'Karakterler' },
  { id: 168, word: 'Rapunzel', category: 'karakterler', categoryName: 'Karakterler' },
  { id: 169, word: 'Deniz Kızı Ariel', category: 'karakterler', categoryName: 'Karakterler' },
  { id: 170, word: 'Garfield', category: 'karakterler', categoryName: 'Karakterler' },
  { id: 171, word: 'Mickey Mouse', category: 'karakterler', categoryName: 'Karakterler' },
  { id: 172, word: 'Tom ve Jerry', category: 'karakterler', categoryName: 'Karakterler' },
  { id: 173, word: 'Pepee', category: 'karakterler', categoryName: 'Karakterler' },
  { id: 174, word: 'Niloya', category: 'karakterler', categoryName: 'Karakterler' },
  { id: 175, word: 'Taş Devri Fred Çakmaktaş', category: 'karakterler', categoryName: 'Karakterler' },
  { id: 176, word: 'Şirinler', category: 'karakterler', categoryName: 'Karakterler' },
  { id: 177, word: 'Temel Reis', category: 'karakterler', categoryName: 'Karakterler' },
  { id: 178, word: 'Hulk', category: 'karakterler', categoryName: 'Karakterler' },
  { id: 179, word: 'Barbie', category: 'karakterler', categoryName: 'Karakterler' },
  { id: 180, word: 'Cino (Red Kit)', category: 'karakterler', categoryName: 'Karakterler' },
];

export function getCharadesCards(
  category: CharadesCategory,
  count: number = 30
): CharadesCard[] {
  let list =
    category === 'karisik'
      ? [...CHARADES_DATA]
      : CHARADES_DATA.filter((item) => item.category === category);

  if (list.length === 0) list = [...CHARADES_DATA];

  // Shuffle list
  const shuffled = [...list].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}
