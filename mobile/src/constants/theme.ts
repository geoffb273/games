export const COLOR = {
  black: '#000000',
  white: '#ffffff',

  flow: {
    pairColors: [
      '#6B9BD1', // blue
      '#7DCE7D', // green
      '#E8A95D', // orange
      '#D4737A', // red
      '#9B7BBF', // purple
      '#5BC0C0', // teal
      '#E895C4', // pink
      '#8B7355', // brown
      '#F2D45C', // yellow
      '#FF6FA3', // magenta
    ],
    emptyCell: '#CCCCCC',
  },

  minesweeper: {
    numbers: {
      1: '#3B82F6',
      2: '#16A34A',
      3: '#EF4444',
      4: '#8B5CF6',
      5: '#F59E0B',
      6: '#0D9488',
      7: '#EC4899',
      8: '#94A3B8',
    },
    flag: '#EF4444',
  },

  puzzleType: {
    HANJI: {
      light: { card: '#FFE9F0', chip: '#FFD1E2' },
      dark: { card: '#4A1030', chip: '#6A1A45' },
    },
    FLOW: {
      light: { card: '#E5F5FF', chip: '#CCE8FF' },
      dark: { card: '#0F3447', chip: '#16485F' },
    },
    HASHI: {
      light: { card: '#FFF4E0', chip: '#FFE2B8' },
      dark: { card: '#41270A', chip: '#5A3710' },
    },
    SLITHERLINK: {
      light: { card: '#EAF8E8', chip: '#D3F0D0' },
      dark: { card: '#0F3020', chip: '#184431' },
    },
    MINESWEEPER: {
      light: { card: '#F0ECFF', chip: '#DBD3FF' },
      dark: { card: '#221C48', chip: '#302964' },
    },
  },
} as const;

export const ThemeColor = {
  light: {
    text: '#2A241B',
    background: '#F8F3E8',
    backgroundElement: '#EFE6D6',
    backgroundSelected: '#E5D8C2',
    textSecondary: '#5B5144',
    success: '#47725B',
    warning: '#8A5B2C',
    error: '#B84A3A',
    successSurface: '#47725B22',
    warningSurface: '#8A5B2C22',
    errorSurface: '#B84A3A22',
    borderSubtle: '#D6C7B0',
    rule: '#CCBCA3',
    highlightWash: '#F3E8D5',
    accentInk: '#5E4A2F',
  },
  dark: {
    text: '#ffffff',
    background: '#000000',
    backgroundElement: '#212225',
    backgroundSelected: '#2E3135',
    textSecondary: '#B0B4BA',
    success: '#30D158',
    warning: '#FF9F0A',
    error: '#FF453A',
    successSurface: '#30D15833',
    warningSurface: '#FF9F0A33',
    errorSurface: '#FF453A33',
    borderSubtle: '#383B40',
    rule: '#4A4E55',
    highlightWash: '#2A2D33',
    accentInk: '#D8C6A3',
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
