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
} & (
  | {
      type: 'HANJI';
      data: HanjiPuzzleData;
    }
  | {
      type: 'HASHI';
      data: HashiPuzzleData;
    }
  | {
      type: 'MINESWEEPER';
      data: MinesweeperPuzzleData;
    }
);

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

const hashiIslandSchema = z.object({
  row: z.int().min(0),
  col: z.int().min(0),
  requiredBridges: z.int().min(1).max(8),
});

const hashiBridgeSchema = z.object({
  from: z.object({ row: z.int().min(0), col: z.int().min(0) }),
  to: z.object({ row: z.int().min(0), col: z.int().min(0) }),
  bridges: z.union([z.literal(1), z.literal(2)]),
});

export const hashiPuzzleDataSchema = z
  .object({
    width: z.int().min(1),
    height: z.int().min(1),
    islands: z.array(hashiIslandSchema).min(2),
    solution: z.array(hashiBridgeSchema),
  })
  .refine((d) => d.islands.every((i) => i.row < d.height && i.col < d.width), {
    message: 'all islands must be within grid bounds',
  });

export type HashiPuzzleData = z.infer<typeof hashiPuzzleDataSchema>;

const minesweeperRevealedCellSchema = z.object({
  row: z.int().min(0),
  col: z.int().min(0),
  value: z.int().min(0).max(8),
});

export const minesweeperPuzzleDataSchema = z
  .object({
    width: z.int().min(1),
    height: z.int().min(1),
    mineCount: z.int().min(1),
    revealedCells: z.array(minesweeperRevealedCellSchema).min(1),
    solution: z.array(z.array(z.boolean())),
  })
  .refine((d) => d.mineCount < d.width * d.height, {
    message: 'mineCount must be less than total cell count',
  })
  .refine((d) => d.solution.length === d.height && d.solution.every((r) => r.length === d.width), {
    message: 'solution dimensions must match width x height',
  })
  .refine((d) => d.solution.flat().filter(Boolean).length === d.mineCount, {
    message: 'number of mines in solution must match mineCount',
  })
  .refine(
    (d) =>
      d.revealedCells.every(
        (c) => c.row < d.height && c.col < d.width && !d.solution[c.row][c.col],
      ),
    { message: 'all revealed cells must be within bounds and not mines' },
  );

export type MinesweeperPuzzleData = z.infer<typeof minesweeperPuzzleDataSchema>;
