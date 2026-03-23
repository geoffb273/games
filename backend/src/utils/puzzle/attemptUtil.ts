import { type PuzzleAttemptSpeedPercentageKey } from '@/platform/puzzle/resource/userPuzzleAttempt';

export function serializePuzzleAttemptSpeedPercentageKey({
  puzzleId,
  durationMs,
}: PuzzleAttemptSpeedPercentageKey): string {
  return `${puzzleId}:${durationMs}`;
}
