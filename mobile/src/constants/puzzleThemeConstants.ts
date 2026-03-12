import { type Puzzle } from '@/api/puzzle/puzzle';
import { useThemePreference } from '@/store/themeStore';

import { PuzzleTypeColors } from './theme';

type PuzzleType = Puzzle['type'];

type Palette = {
  card: string;
  chip: string;
};

export type PuzzlePalette = Palette;

export function usePuzzlePalette(type: PuzzleType): Palette {
  const { preference } = useThemePreference();
  const palette = PuzzleTypeColors[type];
  return preference === 'dark' ? palette.dark : palette.light;
}
