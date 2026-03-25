import { randomUUID } from 'node:crypto';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { setCachedPuzzles } from '@/cache/puzzle/puzzle';
import { createPuzzles } from '@/platform/puzzle/dao/puzzleDao';
import type { Puzzle } from '@/platform/puzzle/resource/puzzle';
import { createPuzzlesForDailyChallenge } from '@/platform/puzzle/service/createPuzzlesForDailyChallenge';

vi.mock('@/cache/puzzle/puzzle');
vi.mock('@/platform/puzzle/dao/puzzleDao');

function minimalFlowPuzzle(overrides: { id: string; dailyChallengeId: string }): Puzzle {
  const created = new Date('2024-06-01T12:00:00.000Z');
  const updated = new Date('2024-06-02T15:30:00.000Z');
  return {
    id: overrides.id,
    createdAt: created,
    updatedAt: updated,
    dailyChallengeId: overrides.dailyChallengeId,
    name: 'Test flow',
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

describe('createPuzzlesForDailyChallenge', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('persists generated puzzles via DAO and writes the list to cache', async () => {
    const dailyChallengeId = randomUUID();
    const id = randomUUID();
    const puzzles: Puzzle[] = [minimalFlowPuzzle({ id, dailyChallengeId })];
    vi.mocked(createPuzzles).mockResolvedValue(puzzles);

    const result = await createPuzzlesForDailyChallenge({ dailyChallengeId });

    expect(createPuzzles).toHaveBeenCalledWith(
      expect.objectContaining({
        dailyChallengeId,
        data: expect.objectContaining({
          flow: expect.any(Object),
          hanji: expect.any(Object),
          hashi: expect.any(Object),
          minesweeper: expect.any(Object),
          slitherlink: expect.any(Object),
        }),
      }),
    );
    expect(setCachedPuzzles).toHaveBeenCalledWith({ dailyChallengeId, puzzles });
    expect(result).toEqual(puzzles);
  });
});
