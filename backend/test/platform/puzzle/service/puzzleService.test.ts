import { randomUUID } from 'node:crypto';
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
    const userId = randomUUID();
    const requestedKey = {
      puzzleId: randomUUID(),
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
          'other-puzzle:999',
          {
            percentage: 99,
            expirationTimestampMs: Date.now() + 60_000,
          },
        ],
      ]),
    );
    vi.mocked(getPuzzleAttemptSpeedPercentagesByAttemptDao).mockResolvedValue(new Map());

    const result = await getPuzzleAttemptSpeedPercentages({ userId, keys: [requestedKey] });

    expect(result).toEqual(new Map([[requestedSerialized, 20]]));
  });

  it('does not write cache when all requested keys are cache hits', async () => {
    const userId = randomUUID();
    const requestedKey = {
      puzzleId: randomUUID(),
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

    const result = await getPuzzleAttemptSpeedPercentages({ userId, keys: [requestedKey] });

    expect(getPuzzleAttemptSpeedPercentagesByAttemptDao).toHaveBeenCalledWith({
      userId,
      keys: [],
    });
    expect(setCachedPuzzleAttemptSpeedPercentages).not.toHaveBeenCalled();
    expect(result).toEqual(new Map([[requestedSerialized, 88]]));
  });

  it('fetches misses, writes only misses to cache, and returns full requested set', async () => {
    const userId = randomUUID();
    const hitKey = {
      puzzleId: randomUUID(),
      durationMs: 3000,
    };
    const missKey = {
      puzzleId: randomUUID(),
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

    const result = await getPuzzleAttemptSpeedPercentages({ userId, keys: [hitKey, missKey] });

    expect(getPuzzleAttemptSpeedPercentagesByAttemptDao).toHaveBeenCalledWith({
      userId,
      keys: [missKey],
    });
    expect(setCachedPuzzleAttemptSpeedPercentages).toHaveBeenCalledWith({
      userId,
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
