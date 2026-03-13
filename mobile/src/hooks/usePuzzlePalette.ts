import { type PuzzleType } from '@/api/puzzle/puzzle';
import { type PuzzlePalette, PuzzleTypeColors } from '@/constants/puzzleTheme';
import { useThemePreference } from '@/store/themeStore';

export function usePuzzlePalette(type: PuzzleType): PuzzlePalette {
  const { preference } = useThemePreference();
  const palette = PuzzleTypeColors[type];
  return preference === 'dark' ? palette.dark : palette.light;
}
