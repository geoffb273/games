import { COLOR } from './color';

export const PuzzleTypeColors = {
  HANJI: {
    light: { card: COLOR.pink100, chip: COLOR.magenta400 },
    dark: { card: COLOR.plum800, chip: COLOR.pink500 },
  },
  FLOW: {
    light: { card: COLOR.sky50, chip: COLOR.slate400 },
    dark: { card: COLOR.navy900, chip: COLOR.blue500 },
  },
  HASHI: {
    light: { card: COLOR.sand50, chip: COLOR.amber500 },
    dark: { card: COLOR.umber900, chip: COLOR.amber700 },
  },
  SLITHERLINK: {
    light: { card: COLOR.mint100, chip: COLOR.teal500 },
    dark: { card: COLOR.forest900, chip: COLOR.green600 },
  },
  MINESWEEPER: {
    light: { card: COLOR.indigo50, chip: COLOR.slate400 },
    dark: { card: COLOR.indigo800, chip: COLOR.slate600 },
  },
} as const;

export type PuzzlePalette = {
  card: string;
  chip: string;
};
