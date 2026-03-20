import { type PuzzleAttemptSpeedPercentageKey } from '@/platform/puzzle/resource/userPuzzleAttempt';

export function serializePuzzleAttemptSpeedPercentageKey({
  puzzleId,
  userId,
  durationMs,
}: PuzzleAttemptSpeedPercentageKey): string {
  return `${puzzleId}:${userId}:${durationMs}`;
}
