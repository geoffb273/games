import { z } from 'zod';

export const PuzzleType = {
  FLOW: 'FLOW',
  HANJI: 'HANJI',
  HASHI: 'HASHI',
  MINESWEEPER: 'MINESWEEPER',
  SLITHERLINK: 'SLITHERLINK',
} as const;
export type PuzzleType = (typeof PuzzleType)[keyof typeof PuzzleType];

type BasePuzzle = {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  dailyChallengeId: string;
  type: PuzzleType;
  name: string;
  description?: string | null | undefined;
};

export type FlowPuzzle = BasePuzzle & {
  type: 'FLOW';
  data: FlowPuzzleData;
};

export type HanjiPuzzle = BasePuzzle & {
  type: 'HANJI';
  data: HanjiPuzzleData;
};

export type HashiPuzzle = BasePuzzle & {
  type: 'HASHI';
  data: HashiPuzzleData;
};

export type MinesweeperPuzzle = BasePuzzle & {
  type: 'MINESWEEPER';
  data: MinesweeperPuzzleData;
};

export type SlitherlinkPuzzle = BasePuzzle & {
  type: 'SLITHERLINK';
  data: SlitherlinkPuzzleData;
};

export type Puzzle = FlowPuzzle | HanjiPuzzle | HashiPuzzle | MinesweeperPuzzle | SlitherlinkPuzzle;

const flowCellSchema = z.object({
  row: z.int().min(0),
  col: z.int().min(0),
});

const flowPairSchema = z.object({
  number: z.int().min(1),
  ends: z.tuple([flowCellSchema, flowCellSchema]),
});

export const flowPuzzleDataSchema = z
  .object({
    width: z.int().min(1),
    height: z.int().min(1),
    pairs: z.array(flowPairSchema),
    solution: z.array(z.array(z.int().min(0))),
  })
  .refine((d) => d.solution.length === d.height && d.solution.every((r) => r.length === d.width), {
    message: 'solution dimensions must match width x height',
  })
  .refine(
    (d) =>
      d.pairs.every(
        (p) =>
          p.ends[0].row < d.height &&
          p.ends[0].col < d.width &&
          p.ends[1].row < d.height &&
          p.ends[1].col < d.width,
      ),
    { message: 'all pair endpoints must be within grid bounds' },
  );

export type FlowPuzzleData = z.infer<typeof flowPuzzleDataSchema>;

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

const slitherlinkClueSchema = z.union([z.int().min(0).max(4), z.null()]);

const slitherlinkSolutionSchema = z.object({
  horizontalEdges: z.array(z.array(z.boolean())),
  verticalEdges: z.array(z.array(z.boolean())),
});

export const slitherlinkPuzzleDataSchema = z
  .object({
    width: z.int().min(1),
    height: z.int().min(1),
    clues: z.array(z.array(slitherlinkClueSchema)),
    solution: slitherlinkSolutionSchema,
  })
  .refine((d) => d.clues.length === d.height && d.clues.every((row) => row.length === d.width), {
    message: 'clues dimensions must match width x height',
  })
  .refine(
    (d) =>
      d.solution.horizontalEdges.length === d.height + 1 &&
      d.solution.horizontalEdges.every((row) => row.length === d.width),
    {
      message: 'horizontalEdges dimensions must be (height + 1) x width',
    },
  )
  .refine(
    (d) =>
      d.solution.verticalEdges.length === d.height &&
      d.solution.verticalEdges.every((row) => row.length === d.width + 1),
    {
      message: 'verticalEdges dimensions must be height x (width + 1)',
    },
  );

export type SlitherlinkPuzzleData = z.infer<typeof slitherlinkPuzzleDataSchema>;
