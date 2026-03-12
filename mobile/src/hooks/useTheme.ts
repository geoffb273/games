/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { ThemeColor } from '@/constants/theme';
import { useThemePreference } from '@/store/themeStore';

export function useTheme() {
  const { preference } = useThemePreference();

  return ThemeColor[preference];
}
