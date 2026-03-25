import { randomUUID } from 'node:crypto';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  getCachedPuzzle,
  getCachedPuzzles,
  setCachedPuzzle,
  setCachedPuzzles,
} from '@/cache/puzzle/puzzle';
import {
  getCachedPuzzleAttemptSpeedPercentages,
  setCachedPuzzleAttemptSpeedPercentages,
} from '@/cache/puzzle/puzzleAttemptSpeedPercentage';
import {
  getPuzzle as getPuzzleDao,
  getPuzzlesByDailyChallenge as getPuzzlesByDailyChallengeDao,
} from '@/platform/puzzle/dao/puzzleDao';
import { getPuzzleAttemptSpeedPercentages as getPuzzleAttemptSpeedPercentagesByAttemptDao } from '@/platform/puzzle/dao/userPuzzleAttemptDao';
import type { Puzzle } from '@/platform/puzzle/resource/puzzle';
import {
  getPuzzle,
  getPuzzleAttemptSpeedPercentages,
  getPuzzlesByDailyChallenge,
} from '@/platform/puzzle/service/puzzleService';
import { serializePuzzleAttemptSpeedPercentageKey } from '@/utils/puzzle/attemptUtil';

vi.mock('@/cache/puzzle/puzzle');
vi.mock('@/cache/puzzle/puzzleAttemptSpeedPercentage');
vi.mock('@/platform/puzzle/dao/puzzleDao');
vi.mock('@/platform/puzzle/dao/userPuzzleAttemptDao');

function minimalFlowPuzzle({
  id,
  dailyChallengeId,
}: {
  id: string;
  dailyChallengeId: string;
}): Puzzle {
  const created = new Date('2024-06-01T12:00:00.000Z');
  const updated = new Date('2024-06-02T15:30:00.000Z');
  return {
    id,
    createdAt: created,
    updatedAt: updated,
    dailyChallengeId,
    name: 'Service test flow',
    description: null,
    type: 'FLOW',
    data: {
      width: 2,
      height: 2,
      pairs: [],
      solution: [
        [0, 0],
        [0, 0],
      ],
    },
  };
}

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

describe('getPuzzle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns a cache hit without calling the DAO', async () => {
    const id = randomUUID();
    const dailyChallengeId = randomUUID();
    const puzzle = minimalFlowPuzzle({ id, dailyChallengeId });
    vi.mocked(getCachedPuzzle).mockResolvedValue(puzzle);

    const result = await getPuzzle({ id });

    expect(result).toEqual(puzzle);
    expect(getPuzzleDao).not.toHaveBeenCalled();
    expect(setCachedPuzzle).not.toHaveBeenCalled();
  });

  it('loads from the DAO on a cache miss and populates the cache', async () => {
    const id = randomUUID();
    const dailyChallengeId = randomUUID();
    const puzzle = minimalFlowPuzzle({ id, dailyChallengeId });
    vi.mocked(getCachedPuzzle).mockResolvedValue(null);
    vi.mocked(getPuzzleDao).mockResolvedValue(puzzle);

    const result = await getPuzzle({ id });

    expect(getPuzzleDao).toHaveBeenCalledWith({ id });
    expect(setCachedPuzzle).toHaveBeenCalledWith({ puzzle });
    expect(result).toEqual(puzzle);
  });
});

describe('getPuzzlesByDailyChallenge', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns a non-empty cache hit without calling the DAO', async () => {
    const dailyChallengeId = randomUUID();
    const id = randomUUID();
    const puzzles: Puzzle[] = [minimalFlowPuzzle({ id, dailyChallengeId })];
    vi.mocked(getCachedPuzzles).mockResolvedValue(puzzles);

    const result = await getPuzzlesByDailyChallenge({ dailyChallengeId });

    expect(result).toEqual(puzzles);
    expect(getPuzzlesByDailyChallengeDao).not.toHaveBeenCalled();
    expect(setCachedPuzzles).not.toHaveBeenCalled();
  });

  it('loads from the DAO when the cache is empty and caches the result', async () => {
    const dailyChallengeId = randomUUID();
    const id = randomUUID();
    const puzzles: Puzzle[] = [minimalFlowPuzzle({ id, dailyChallengeId })];
    vi.mocked(getCachedPuzzles).mockResolvedValue(null);
    vi.mocked(getPuzzlesByDailyChallengeDao).mockResolvedValue(puzzles);

    const result = await getPuzzlesByDailyChallenge({ dailyChallengeId });

    expect(getPuzzlesByDailyChallengeDao).toHaveBeenCalledWith({ dailyChallengeId });
    expect(setCachedPuzzles).toHaveBeenCalledWith({ dailyChallengeId, puzzles });
    expect(result).toEqual(puzzles);
  });
});
