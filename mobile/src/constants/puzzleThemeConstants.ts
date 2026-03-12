import { type Puzzle } from '@/api/puzzle/puzzle';
import { getThemePreference } from '@/store/themeStore';

import { COLOR } from './theme';

type PuzzleType = Puzzle['type'];

type Palette = {
  card: string;
  chip: string;
};

export type PuzzlePalette = Palette;

export function getPuzzlePalette(type: PuzzleType): Palette {
  const isDark = getThemePreference() === 'dark';
  const palette = COLOR.puzzleType[type];
  return isDark ? palette.dark : palette.light;
}
