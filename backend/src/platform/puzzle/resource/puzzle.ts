export const PuzzleType = {
  HANJI: 'HANJI',
  HASHI: 'HASHI',
  MINESWEEPER: 'MINESWEEPER',
} as const;
export type PuzzleType = (typeof PuzzleType)[keyof typeof PuzzleType];

export type Puzzle = {
  id: string;
  //   data: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  dailyChallengeId: string;
  type: PuzzleType;
  name: string;
  description: string | null | undefined;
};
