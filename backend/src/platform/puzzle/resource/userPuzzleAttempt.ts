export type UserPuzzleAttempt = {
  id: string;
  startedAt: Date;
  completedAt: Date | null;
  durationMs: number | null;
  userId: string;
  puzzleId: string;
};
