import { getColorWithOpacity } from '@/utils/colorUtils';

import { COLOR } from './color';

export const ThemeColor = {
  light: {
    text: COLOR.brown800,
    background: COLOR.cream50,
    backgroundElement: COLOR.tan200,
    backgroundSelected: COLOR.tan200,
    textSecondary: COLOR.brown500,
    success: COLOR.sage600,
    successText: COLOR.white,
    warning: COLOR.amber700,
    warningText: COLOR.white,
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
    successText: COLOR.black,
    warning: COLOR.orange500,
    warningText: COLOR.white,
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
