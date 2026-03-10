/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { Colors } from '@/constants/theme';
import { useThemePreference } from '@/store/themeStore';

export function useTheme() {
  const { preference } = useThemePreference();

  return Colors[preference];
}
