import { getColorWithOpacity } from '@/utils/colorUtils';

export const COLOR = {
  black: '#000000',
  white: '#ffffff',

  gray300: '#CCCCCC',
  gray600: '#4A4E55',
  gray800: '#2E3135',
  gray900: '#212225',

  slate400: '#94A3B8',

  cream50: '#F8F3E8',
  cream100: '#F3E8D5',
  tan200: '#E5D8C2',
  beige400: '#CCBCA3',

  gold200: '#D8C6A3',

  blue500: '#3B82F6',

  sky50: '#E5F5FF',

  navy900: '#0F3447',

  indigo50: '#F0ECFF',
  indigo800: '#302964',

  violet500: '#8B5CF6',

  plum800: '#6A1A45',

  magenta400: '#FF6FA3',

  pink100: '#FFD1E2',
  pink500: '#EC4899',

  red400: '#D4737A',
  red500: '#EF4444',
  red500Vivid: '#FF453A',

  amber500: '#F59E0B',
  amber700: '#8A5B2C',

  orange500: '#FF9F0A',

  yellow400: '#F2D45C',

  sand50: '#FFF4E0',

  green400: '#30D158',
  green600: '#16A34A',

  sage600: '#47725B',

  mint100: '#D3F0D0',

  forest900: '#0F3020',

  teal500: '#0D9488',

  brown500: '#8B7355',
  brown800: '#5E4A2F',

  umber900: '#41270A',
} as const;

export const FlowColors = {
  pairColors: [
    COLOR.blue500,
    COLOR.green600,
    COLOR.orange500,
    COLOR.red400,
    COLOR.violet500,
    COLOR.teal500,
    COLOR.pink500,
    COLOR.brown500,
    COLOR.yellow400,
    COLOR.magenta400,
  ],
  emptyCell: COLOR.gray300,
} as const;

export const MinesweeperColors = {
  numbers: {
    1: COLOR.blue500,
    2: COLOR.green600,
    3: COLOR.red500,
    4: COLOR.violet500,
    5: COLOR.amber500,
    6: COLOR.teal500,
    7: COLOR.pink500,
    8: COLOR.slate400,
  },
  flag: COLOR.red500,
} as const;

export const PuzzleTypeColors = {
  HANJI: {
    light: { card: COLOR.pink100, chip: COLOR.pink500 },
    dark: { card: COLOR.plum800, chip: COLOR.pink500 },
  },
  FLOW: {
    light: { card: COLOR.sky50, chip: COLOR.sky50 },
    dark: { card: COLOR.navy900, chip: COLOR.blue500 },
  },
  HASHI: {
    light: { card: COLOR.sand50, chip: COLOR.sand50 },
    dark: { card: COLOR.umber900, chip: COLOR.amber500 },
  },
  SLITHERLINK: {
    light: { card: COLOR.mint100, chip: COLOR.mint100 },
    dark: { card: COLOR.forest900, chip: COLOR.mint100 },
  },
  MINESWEEPER: {
    light: { card: COLOR.indigo50, chip: COLOR.indigo50 },
    dark: { card: COLOR.indigo800, chip: COLOR.slate400 },
  },
} as const;

export const ThemeColor = {
  light: {
    text: COLOR.brown800,
    background: COLOR.cream50,
    backgroundElement: COLOR.tan200,
    backgroundSelected: COLOR.tan200,
    textSecondary: COLOR.brown500,
    success: COLOR.sage600,
    warning: COLOR.amber700,
    error: COLOR.red500,
    successSurface: getColorWithOpacity(COLOR.sage600, 0.13),
    warningSurface: getColorWithOpacity(COLOR.orange500, 0.2),
    errorSurface: getColorWithOpacity(COLOR.red500Vivid, 0.2),
    borderSubtle: COLOR.beige400,
    rule: COLOR.beige400,
    highlightWash: COLOR.cream100,
    accentInk: COLOR.brown800,
  },
  dark: {
    text: COLOR.white,
    background: COLOR.black,
    backgroundElement: COLOR.gray900,
    backgroundSelected: COLOR.gray800,
    textSecondary: COLOR.slate400,
    success: COLOR.green400,
    warning: COLOR.orange500,
    error: COLOR.red500Vivid,
    successSurface: getColorWithOpacity(COLOR.sage600, 0.13),
    warningSurface: getColorWithOpacity(COLOR.orange500, 0.2),
    errorSurface: getColorWithOpacity(COLOR.red500Vivid, 0.2),
    borderSubtle: COLOR.gray800,
    rule: COLOR.gray600,
    highlightWash: COLOR.gray800,
    accentInk: COLOR.gold200,
  },
} as const;
export type ThemeColor = keyof typeof ThemeColor.light & keyof typeof ThemeColor.dark;

export const Fonts = {
  /** iOS `UIFontDescriptorSystemDesignDefault` */
  sans: 'system-ui',
  /** iOS `UIFontDescriptorSystemDesignSerif` */
  serif: 'ui-serif',
  /** iOS `UIFontDescriptorSystemDesignRounded` */
  rounded: 'ui-rounded',
  /** iOS `UIFontDescriptorSystemDesignMonospaced` */
  mono: 'ui-monospace',
  /** Kaushan Script – display/logo (loaded via expo-font in app.json) */
  display: 'KaushanScript_400Regular',
};

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const Radii = {
  sm: 8,
  md: 12,
  lg: 18,
  pill: 999,
} as const;

export const Shadows = {
  subtle: {
    shadowColor: COLOR.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 3,
    elevation: 1,
  },
} as const;
