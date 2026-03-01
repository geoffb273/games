import { z } from 'zod';

export const PuzzleType = {
  HANJI: 'HANJI',
  HASHI: 'HASHI',
  MINESWEEPER: 'MINESWEEPER',
} as const;
export type PuzzleType = (typeof PuzzleType)[keyof typeof PuzzleType];

export type Puzzle = {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  dailyChallengeId: string;
  type: PuzzleType;
  name: string;
  description: string | null | undefined;
};

const hanjiCellSchema = z.union([z.literal(0), z.literal(1)]);

export const hanjiPuzzleDataSchema = z
  .object({
    width: z.int().min(1),
    height: z.int().min(1),
    rowClues: z.array(z.array(z.int().min(0))),
    colClues: z.array(z.array(z.int().min(0))),
    solution: z.array(z.array(hanjiCellSchema)),
  })
  .refine((d) => d.rowClues.length === d.height, {
    message: 'rowClues length must match height',
  })
  .refine((d) => d.colClues.length === d.width, {
    message: 'colClues length must match width',
  })
  .refine((d) => d.solution.length === d.height && d.solution.every((r) => r.length === d.width), {
    message: 'solution dimensions must match width x height',
  });

export type HanjiPuzzleData = z.infer<typeof hanjiPuzzleDataSchema>;
