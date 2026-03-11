import { type Puzzle } from '@/api/puzzle/puzzle';

import { Colors } from './theme';

type PuzzleType = Puzzle['type'];

type Palette = {
  card: string;
  chip: string;
};

export type PuzzlePalette = Palette;

type ModePalette = {
  light: Palette;
  dark: Palette;
};

export const PUZZLE_TYPE_COLORS: Record<PuzzleType, ModePalette> = {
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
};

export function getPuzzlePalette(type: PuzzleType, backgroundColor: string): Palette {
  const isDark = backgroundColor === Colors.dark.background;
  const palette = PUZZLE_TYPE_COLORS[type];
  return isDark ? palette.dark : palette.light;
}
