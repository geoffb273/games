import { randomUUID } from 'node:crypto';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { prisma } from '@/client/prisma';
import {
  createPuzzles,
  getDailyChallengeToPuzzlesMap,
  getPuzzle,
  getPuzzlesByDailyChallenge,
} from '@/platform/puzzle/dao/puzzleDao';
import type {
  FlowPuzzleData,
  HanjiPuzzleData,
  HashiPuzzleData,
  MinesweeperPuzzleData,
  SlitherlinkPuzzleData,
} from '@/platform/puzzle/resource/puzzle';
import { NotFoundError } from '@/schema/errors';
import { createTestDailyChallenge } from '@/test/testUtils';

// Minimal valid data per puzzle type for mapPuzzle / createPuzzles
const MINIMAL_FLOW_DATA: FlowPuzzleData = {
  width: 1,
  height: 1,
  pairs: [],
  solution: [[0]],
};

const MINIMAL_HANJI_DATA: HanjiPuzzleData = {
  width: 1,
  height: 1,
  rowClues: [[0]],
  colClues: [[0]],
  solution: [[0]],
};

const MINIMAL_HASHI_DATA: HashiPuzzleData = {
  width: 2,
  height: 2,
  islands: [
    { row: 0, col: 0, requiredBridges: 1 },
    { row: 1, col: 1, requiredBridges: 1 },
  ],
  solution: [],
};

const MINIMAL_MINESWEEPER_DATA: MinesweeperPuzzleData = {
  width: 2,
  height: 2,
  mineCount: 1,
  revealedCells: [{ row: 0, col: 0, value: 0 }],
  solution: [
    [false, false],
    [false, true],
  ],
};

const MINIMAL_SLITHERLINK_DATA: SlitherlinkPuzzleData = {
  width: 1,
  height: 1,
  clues: [[null]],
  solution: {
    horizontalEdges: [[false], [false]],
    verticalEdges: [[false, false]],
  },
};

async function createTestPuzzle({
  dailyChallengeId = randomUUID(),
  type,
  data,
}: {
  dailyChallengeId?: string;
  type: 'FLOW' | 'HANJI' | 'HASHI' | 'MINESWEEPER' | 'SLITHERLINK';
  data: object;
}) {
  const [_puzzleType, puzzle] = await prisma.$transaction([
    prisma.puzzleType.createMany({
      data: {
        name: type,
        description: type,
        type,
      },
      skipDuplicates: true,
    }),
    prisma.puzzle.create({
      data: {
        dailyChallengeId,
        data,
        type,
      },
    }),
  ]);

  return puzzle;
}

describe('puzzleDao', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('getPuzzle', () => {
    it('returns the puzzle when found', async () => {
      const created = await createTestPuzzle({
        type: 'HANJI',
        data: MINIMAL_HANJI_DATA,
      });

      const result = await getPuzzle({ id: created.id });

      expect(result.id).toEqual(created.id);
      expect(result.type).toEqual('HANJI');
      expect(result.dailyChallengeId).toEqual(created.dailyChallengeId);
      expect(result.data).toEqual(MINIMAL_HANJI_DATA);
      expect(result.name).toBeDefined();
      expect(result.createdAt).toEqual(created.createdAt);
      expect(result.updatedAt).toEqual(created.updatedAt);
    });

    it('throws NotFoundError when puzzle does not exist', async () => {
      await expect(getPuzzle({ id: randomUUID() })).rejects.toBeInstanceOf(NotFoundError);
    });
  });

  describe('getPuzzlesByDailyChallenge', () => {
    it('returns empty array when no puzzles exist for daily challenge', async () => {
      const dc = await createTestDailyChallenge({ date: new Date('2001-01-03') });

      const result = await getPuzzlesByDailyChallenge({ dailyChallengeId: dc.id });

      expect(result).toEqual([]);
    });

    it('returns all puzzles for the daily challenge', async () => {
      const dc = await createTestDailyChallenge({ date: new Date('2001-01-02') });
      await createTestPuzzle({
        dailyChallengeId: dc.id,
        type: 'FLOW',
        data: MINIMAL_FLOW_DATA,
      });
      await createTestPuzzle({
        dailyChallengeId: dc.id,
        type: 'HANJI',
        data: MINIMAL_HANJI_DATA,
      });

      const result = await getPuzzlesByDailyChallenge({ dailyChallengeId: dc.id });

      expect(result).toHaveLength(2);
      const types = result.map((p) => p.type).sort();
      expect(types).toEqual(['FLOW', 'HANJI']);
    });
  });

  describe('getDailyChallengeToPuzzlesMap', () => {
    it('returns empty map for empty array', async () => {
      const result = await getDailyChallengeToPuzzlesMap({ dailyChallengeIds: [] });
      expect(result.size).toBe(0);
    });

    it('omits daily challenge ids with no puzzles', async () => {
      const dc = await createTestDailyChallenge({ date: new Date('2001-01-04') });
      const result = await getDailyChallengeToPuzzlesMap({
        dailyChallengeIds: [dc.id],
      });
      expect(result.has(dc.id)).toBe(false);
    });

    it('returns map of daily challenge id to puzzles', async () => {
      const dc1 = await createTestDailyChallenge({ date: new Date('2020-01-03') });
      const dc2 = await createTestDailyChallenge({ date: new Date('2021-01-01') });
      await createTestPuzzle({
        dailyChallengeId: dc1.id,
        type: 'FLOW',
        data: MINIMAL_FLOW_DATA,
      });
      await createTestPuzzle({
        dailyChallengeId: dc1.id,
        type: 'HANJI',
        data: MINIMAL_HANJI_DATA,
      });
      await createTestPuzzle({
        dailyChallengeId: dc2.id,
        type: 'HASHI',
        data: MINIMAL_HASHI_DATA,
      });

      const result = await getDailyChallengeToPuzzlesMap({
        dailyChallengeIds: [dc1.id, dc2.id],
      });

      expect(result.get(dc1.id)).toHaveLength(2);
      expect(result.get(dc2.id)).toHaveLength(1);
      expect(
        result
          .get(dc1.id)
          ?.map((p) => p.type)
          .sort(),
      ).toEqual(['FLOW', 'HANJI']);
      expect(result.get(dc2.id)?.[0].type).toEqual('HASHI');
    });
  });

  describe('createPuzzles', () => {
    it('creates all five puzzles for the daily challenge', async () => {
      const dailyChallengeId = randomUUID();
      const result = await createPuzzles({
        dailyChallengeId,
        data: {
          flow: MINIMAL_FLOW_DATA,
          hanji: MINIMAL_HANJI_DATA,
          hashi: MINIMAL_HASHI_DATA,
          minesweeper: MINIMAL_MINESWEEPER_DATA,
          slitherlink: MINIMAL_SLITHERLINK_DATA,
        },
      });

      expect(result).toHaveLength(5);
      const types = result.map((p) => p.type).sort();
      expect(types).toEqual(['FLOW', 'HANJI', 'HASHI', 'MINESWEEPER', 'SLITHERLINK']);
      result.forEach((p) => {
        expect(p.dailyChallengeId).toEqual(dailyChallengeId);
        expect(p.id).toBeDefined();
        expect(p.name).toBeDefined();
      });

      const stored = await prisma.puzzle.findMany({
        where: { dailyChallengeId },
      });
      expect(stored).toHaveLength(5);
    });
  });
});
