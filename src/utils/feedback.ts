import type { MedalThresholds, MedalType } from '../types/game';

export function calculateEarnedMedal(
  score: number,
  thresholds: MedalThresholds,
  isLowerScoreBetter: boolean = false
): MedalType {
  if (isLowerScoreBetter) {
    if (score <= thresholds.altın) return 'altın';
    if (score <= thresholds.gümüş) return 'gümüş';
    if (score <= thresholds.bronz) return 'bronz';
    return 'none';
  } else {
    if (score >= thresholds.altın) return 'altın';
    if (score >= thresholds.gümüş) return 'gümüş';
    if (score >= thresholds.bronz) return 'bronz';
    return 'none';
  }
}

export function getMedalName(medal: MedalType): string {
  switch (medal) {
    case 'altın':
      return 'Altın Madalya';
    case 'gümüş':
      return 'Gümüş Madalya';
    case 'bronz':
      return 'Bronz Madalya';
    default:
      return 'Madalya Yok';
  }
}

export function getSingleFeedbackMessage(
  score: number,
  isNewRecord: boolean,
  medal: MedalType
): { title: string; subtitle: string } {
  if (isNewRecord) {
    return {
      title: 'YENİ REKOR!',
      subtitle: `Tebrikler, ${score} puan ile kişisel rekorunu kırmayı başardın!`,
    };
  }

  if (medal === 'altın') {
    return {
      title: 'EFSANEVİ PERFORMANS!',
      subtitle: 'Altın madalya aldın, mükemmel bir derece!',
    };
  }

  if (medal === 'gümüş') {
    return {
      title: 'HARİKA OYNADIN!',
      subtitle: 'Gümüş madalya kazandın, biraz daha zorlarsan altın senin!',
    };
  }

  if (medal === 'bronz') {
    return {
      title: 'TEBRİKLER!',
      subtitle: 'Bronz madalyayı kaptın, iyi bir performans.',
    };
  }

  return {
    title: 'TUR TAMAMLANDI!',
    subtitle: 'Güzel bir denemeydi, tekrar deneyerek madalya kazanabilirsin.',
  };
}

export function getMultiFeedbackMessage(isTie: boolean, winnerName: string): { title: string; subtitle: string } {
  if (isTie) {
    return {
      title: 'BERABERE!',
      subtitle: 'Kıran kırana geçen mücadelede kazanan çıkmadı.',
    };
  }

  return {
    title: `${winnerName} KAZANDI!`,
    subtitle: 'Tebrikler, bu turun şampiyonu oldun!',
  };
}
