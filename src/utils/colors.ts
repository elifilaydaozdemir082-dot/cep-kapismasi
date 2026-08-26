export interface PlayerColorOption {
  id: string;
  name: string;
  hex: string;
  textHex: string;
  darkHex: string;
  glow: string;
}

export const PLAYER_COLORS: PlayerColorOption[] = [
  {
    id: 'coral',
    name: 'Mercan Kırmızı',
    hex: '#FF4757',
    textHex: '#FFFFFF',
    darkHex: '#D63031',
    glow: 'rgba(255, 71, 87, 0.4)',
  },
  {
    id: 'cyan',
    name: 'Elektrik Mavi',
    hex: '#00D2D3',
    textHex: '#0F172A',
    darkHex: '#01A3A4',
    glow: 'rgba(0, 210, 211, 0.4)',
  },
  {
    id: 'gold',
    name: 'Güneş Sarısı',
    hex: '#FF9F43',
    textHex: '#0F172A',
    darkHex: '#EE5253',
    glow: 'rgba(255, 159, 67, 0.4)',
  },
  {
    id: 'emerald',
    name: 'Zümrüt Yeşil',
    hex: '#10AC84',
    textHex: '#FFFFFF',
    darkHex: '#1DD1A1',
    glow: 'rgba(16, 172, 132, 0.4)',
  },
  {
    id: 'violet',
    name: 'Gizemli Mor',
    hex: '#5F27CD',
    textHex: '#FFFFFF',
    darkHex: '#341F97',
    glow: 'rgba(95, 39, 205, 0.4)',
  },
  {
    id: 'pink',
    name: 'Neon Pembe',
    hex: '#FF6B6B',
    textHex: '#FFFFFF',
    darkHex: '#EE5253',
    glow: 'rgba(255, 107, 107, 0.4)',
  },
];

export function getColorById(id: string): PlayerColorOption {
  return (
    PLAYER_COLORS.find((c) => c.id === id) || PLAYER_COLORS[0]
  );
}

export function getDefaultColorForPlayer(playerIndex: number): PlayerColorOption {
  return PLAYER_COLORS[playerIndex % PLAYER_COLORS.length];
}
