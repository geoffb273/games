import { COLOR } from './color';

export type PuzzlePalette = {
  card: string;
  middle: string;
  chip: string;
};

export const PuzzleTypeColors = {
  HANJI: {
    light: { card: COLOR.pink100, middle: COLOR.magenta400, chip: COLOR.pink500 },
    dark: { card: COLOR.plum800, middle: COLOR.red400, chip: COLOR.pink500 },
  },
  FLOW: {
    light: { card: COLOR.sky50, middle: COLOR.gray300, chip: COLOR.slate400 },
    dark: { card: COLOR.navy900, middle: COLOR.slate600, chip: COLOR.blue500 },
  },
  HASHI: {
    light: { card: COLOR.sand50, middle: COLOR.sand300, chip: COLOR.amber500 },
    dark: { card: COLOR.umber900, middle: COLOR.amber600, chip: COLOR.amber700 },
  },
  SLITHERLINK: {
    light: { card: COLOR.mint100, middle: COLOR.mint300, chip: COLOR.teal500 },
    dark: { card: COLOR.forest900, middle: COLOR.emerald700, chip: COLOR.green600 },
  },
  MINESWEEPER: {
    light: { card: COLOR.indigo50, middle: COLOR.indigo200, chip: COLOR.slate400 },
    dark: { card: COLOR.indigo800, middle: COLOR.indigo700, chip: COLOR.slate600 },
  },
} as const;
