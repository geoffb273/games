export const Colors = {
  light: {
    text: '#2A241B',
    background: '#F8F3E8',
    backgroundElement: '#EFE6D6',
    backgroundSelected: '#E5D8C2',
    textSecondary: '#5B5144',
    success: '#47725B',
    warning: '#8A5B2C',
    successSurface: '#47725B22',
    warningSurface: '#8A5B2C22',
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
    successSurface: '#30D15833',
    warningSurface: '#FF9F0A33',
    borderSubtle: '#383B40',
    rule: '#4A4E55',
    highlightWash: '#2A2D33',
    accentInk: '#D8C6A3',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = {
  /** iOS `UIFontDescriptorSystemDesignDefault` */
  sans: 'system-ui',
  /** iOS `UIFontDescriptorSystemDesignSerif` */
  serif: 'ui-serif',
  /** iOS `UIFontDescriptorSystemDesignRounded` */
  rounded: 'ui-rounded',
  /** iOS `UIFontDescriptorSystemDesignMonospaced` */
  mono: 'ui-monospace',
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 3,
    elevation: 1,
  },
} as const;
