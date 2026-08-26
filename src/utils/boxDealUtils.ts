import type { BoxItem, RiskLevel } from '../types/boxDeal';

export const ALL_BOX_VALUES: number[] = [
  1, 5, 10, 25, 50, 100, 250, 500, 750, 1000,
  2500, 5000, 10000, 20000, 30000, 50000, 75000, 100000, 250000, 500000,
];

export const SMALL_BOX_VALUES = ALL_BOX_VALUES.slice(0, 10);
export const LARGE_BOX_VALUES = ALL_BOX_VALUES.slice(10);

export function initializeShuffledBoxes(): BoxItem[] {
  const shuffledValues = [...ALL_BOX_VALUES].sort(() => Math.random() - 0.5);
  return shuffledValues.map((val, idx) => ({
    id: idx + 1,
    value: val,
    isOpen: false,
    isPersonal: false,
  }));
}

export function getTargetBoxesToOpenForRound(roundNumber: number): number {
  switch (roundNumber) {
    case 1:
      return 5;
    case 2:
      return 4;
    case 3:
      return 3;
    case 4:
      return 2;
    default:
      return 1;
  }
}

/**
 * Banker offer formula:
 * Expected Value = Average of all remaining unopened box values (including personal box)
 * Multiplier scales from ~0.58 in round 1 to ~0.92 in late rounds.
 */
export function calculateBankerOffer(remainingBoxes: BoxItem[], roundNumber: number): number {
  if (remainingBoxes.length === 0) return 0;

  const remainingValues = remainingBoxes.map((b) => b.value);
  const sum = remainingValues.reduce((acc, val) => acc + val, 0);
  const average = sum / remainingValues.length;

  let baseMultiplier = 0.58;
  if (roundNumber === 2) baseMultiplier = 0.66;
  else if (roundNumber === 3) baseMultiplier = 0.74;
  else if (roundNumber === 4) baseMultiplier = 0.82;
  else if (roundNumber >= 5) baseMultiplier = 0.90 + Math.min(0.05, (roundNumber - 5) * 0.02);

  // Small controlled variation +/- 2%
  const jitter = (Math.random() * 0.04) - 0.02;
  const finalMultiplier = Math.min(0.96, Math.max(0.50, baseMultiplier + jitter));

  let offer = Math.round(average * finalMultiplier);

  // Constraints: never negative, never higher than max remaining value
  const maxRemaining = Math.max(...remainingValues);
  offer = Math.min(offer, maxRemaining);
  offer = Math.max(offer, 1);

  // Round to nearest clean 10 or 100 points
  if (offer > 1000) {
    offer = Math.round(offer / 100) * 100;
  } else if (offer > 100) {
    offer = Math.round(offer / 10) * 10;
  }

  return offer;
}

export function calculateRiskLevel(remainingBoxes: BoxItem[]): {
  level: RiskLevel;
  label: string;
  description: string;
  iconName: 'ShieldCheck' | 'ShieldAlert' | 'Flame';
  colorClass: string;
} {
  const remainingValues = remainingBoxes.map((b) => b.value);
  const remainingLargeCount = remainingValues.filter((v) => v >= 2500).length;
  const totalRemaining = remainingValues.length;

  const largeRatio = totalRemaining > 0 ? remainingLargeCount / totalRemaining : 0;

  if (largeRatio >= 0.6) {
    return {
      level: 'low',
      label: 'Düşük Risk',
      description: 'Büyük ödüllerin çoğu hâlâ tabloda!',
      iconName: 'ShieldCheck',
      colorClass: 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10',
    };
  } else if (largeRatio >= 0.35) {
    return {
      level: 'medium',
      label: 'Orta Risk',
      description: 'Denge hassaslaşıyor, dikkatli ilerleyin.',
      iconName: 'ShieldAlert',
      colorClass: 'text-amber-400 border-amber-500/40 bg-amber-500/10',
    };
  } else {
    return {
      level: 'high',
      label: 'Yüksek Risk',
      description: 'Küçük kutu açılma olasılığı yüksek!',
      iconName: 'Flame',
      colorClass: 'text-rose-500 border-rose-500/40 bg-rose-500/10',
    };
  }
}

export function formatPointValue(val: number): string {
  return val.toLocaleString('tr-TR');
}
