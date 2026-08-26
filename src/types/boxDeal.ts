export interface BoxItem {
  id: number; // 1..20
  value: number; // point value
  isOpen: boolean;
  isPersonal: boolean;
}

export type RiskLevel = 'low' | 'medium' | 'high';

export interface BoxDealGameState {
  boxes: BoxItem[];
  personalBoxId: number | null;
  currentRound: number;
  boxesToOpenInRound: number;
  boxesOpenedInCurrentRound: number;
  openedValues: number[];
  currentOffer: number | null;
  previousOffer: number | null;
  highestRejectedOffer: number;
  isOfferPhase: boolean;
  isSwapPhase: boolean;
  acceptedOffer: number | null;
  finalWinValue: number | null;
  wasBoxSwapped: boolean;
  gameStatus: 'selecting-personal' | 'opening-boxes' | 'banker-offer' | 'swap-choice' | 'finished';
}

export interface BoxDealStats {
  highestWin: number;
  totalGames: number;
  highestAcceptedOffer: number;
  highestBoxValueWon: number;
  acceptedOffersCount: number;
}
