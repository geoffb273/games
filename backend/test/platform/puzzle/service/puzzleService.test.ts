import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  getCachedPuzzleAttemptSpeedPercentages,
  setCachedPuzzleAttemptSpeedPercentages,
} from '@/cache/puzzle/puzzleAttemptSpeedPercentage';
import { getPuzzleAttemptSpeedPercentages as getPuzzleAttemptSpeedPercentagesByAttemptDao } from '@/platform/puzzle/dao/userPuzzleAttemptDao';
import { getPuzzleAttemptSpeedPercentages } from '@/platform/puzzle/service/puzzleService';
import { serializePuzzleAttemptSpeedPercentageKey } from '@/utils/puzzle/attemptUtil';

vi.mock('@/cache/puzzle/puzzleAttemptSpeedPercentage');
vi.mock('@/platform/puzzle/dao/userPuzzleAttemptDao');

describe('getPuzzleAttemptSpeedPercentages', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns only requested keys when cache contains additional keys', async () => {
    const requestedKey = {
      puzzleId: 'puzzle-1',
      userId: 'user-1',
      durationMs: 1000,
    };
    const requestedSerialized = serializePuzzleAttemptSpeedPercentageKey(requestedKey);

    vi.mocked(getCachedPuzzleAttemptSpeedPercentages).mockResolvedValue(
      new Map([
        [
          requestedSerialized,
          {
            percentage: 20,
            expirationTimestampMs: Date.now() + 60_000,
          },
        ],
        [
          'other-puzzle:other-user:999',
          {
            percentage: 99,
            expirationTimestampMs: Date.now() + 60_000,
          },
        ],
      ]),
    );
    vi.mocked(getPuzzleAttemptSpeedPercentagesByAttemptDao).mockResolvedValue(new Map());

    const result = await getPuzzleAttemptSpeedPercentages({ keys: [requestedKey] });

    expect(result).toEqual(new Map([[requestedSerialized, 20]]));
  });

  it('does not write cache when all requested keys are cache hits', async () => {
    const requestedKey = {
      puzzleId: 'puzzle-2',
      userId: 'user-2',
      durationMs: 2000,
    };
    const requestedSerialized = serializePuzzleAttemptSpeedPercentageKey(requestedKey);

    vi.mocked(getCachedPuzzleAttemptSpeedPercentages).mockResolvedValue(
      new Map([
        [
          requestedSerialized,
          {
            percentage: 88,
            expirationTimestampMs: Date.now() + 60_000,
          },
        ],
      ]),
    );
    vi.mocked(getPuzzleAttemptSpeedPercentagesByAttemptDao).mockResolvedValue(new Map());

    const result = await getPuzzleAttemptSpeedPercentages({ keys: [requestedKey] });

    expect(getPuzzleAttemptSpeedPercentagesByAttemptDao).toHaveBeenCalledWith({ keys: [] });
    expect(setCachedPuzzleAttemptSpeedPercentages).not.toHaveBeenCalled();
    expect(result).toEqual(new Map([[requestedSerialized, 88]]));
  });

  it('fetches misses, writes only misses to cache, and returns full requested set', async () => {
    const hitKey = {
      puzzleId: 'puzzle-3',
      userId: 'user-3',
      durationMs: 3000,
    };
    const missKey = {
      puzzleId: 'puzzle-4',
      userId: 'user-4',
      durationMs: 4000,
    };
    const hitSerialized = serializePuzzleAttemptSpeedPercentageKey(hitKey);
    const missSerialized = serializePuzzleAttemptSpeedPercentageKey(missKey);

    vi.mocked(getCachedPuzzleAttemptSpeedPercentages).mockResolvedValue(
      new Map([
        [
          hitSerialized,
          {
            percentage: 10,
            expirationTimestampMs: Date.now() + 60_000,
          },
        ],
      ]),
    );
    vi.mocked(getPuzzleAttemptSpeedPercentagesByAttemptDao).mockResolvedValue(
      new Map([[missSerialized, 70]]),
    );

    const result = await getPuzzleAttemptSpeedPercentages({ keys: [hitKey, missKey] });

    expect(getPuzzleAttemptSpeedPercentagesByAttemptDao).toHaveBeenCalledWith({ keys: [missKey] });
    expect(setCachedPuzzleAttemptSpeedPercentages).toHaveBeenCalledWith({
      percentages: new Map([[missSerialized, { percentage: 70 }]]),
    });
    expect(result).toEqual(
      new Map([
        [hitSerialized, 10],
        [missSerialized, 70],
      ]),
    );
  });
});
