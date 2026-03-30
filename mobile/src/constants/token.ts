import { COLOR } from './color';

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
  xs: 4,
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
  medium: {
    shadowColor: COLOR.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  heavy: {
    shadowColor: COLOR.black,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
} as const;

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
