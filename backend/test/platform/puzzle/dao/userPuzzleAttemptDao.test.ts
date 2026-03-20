import { describe, expect, it } from 'vitest';

import { prisma } from '@/client/prisma';
import { getPuzzleAttemptSpeedPercentages } from '@/platform/puzzle/dao/userPuzzleAttemptDao';
import { createTestDailyChallenge, createTestUser, createUniqueDateTime } from '@/test/testUtils';

async function createTestPuzzleForAttemptStats() {
  const dailyChallenge = await createTestDailyChallenge({
    date: createUniqueDateTime(),
  });

  const { id: puzzleId } = await prisma.puzzle.create({
    data: {
      dailyChallengeId: dailyChallenge.id,
      type: 'HANJI',
      data: {
        width: 1,
        height: 1,
        rowClues: [[0]],
        colClues: [[0]],
        solution: [[0]],
      },
    },
  });

  return { puzzleId };
}

describe('userPuzzleAttemptDao:getPuzzleAttemptSpeedPercentages', () => {
  it('returns faster-than percentage for mixed peer durations', async () => {
    const { puzzleId } = await createTestPuzzleForAttemptStats();
    const user = await createTestUser();
    const slower = await createTestUser();
    const faster = await createTestUser();

    await prisma.userPuzzleAttempt.createMany({
      data: [
        {
          userId: user.id,
          puzzleId,
          startedAt: new Date('2030-01-01T00:00:00.000Z'),
          completedAt: new Date('2030-01-01T00:00:11.000Z'),
          durationMs: 11000,
        },
        {
          userId: slower.id,
          puzzleId,
          startedAt: new Date('2030-01-01T00:00:00.000Z'),
          completedAt: new Date('2030-01-01T00:00:15.000Z'),
          durationMs: 15000,
        },
        {
          userId: faster.id,
          puzzleId,
          startedAt: new Date('2030-01-01T00:00:00.000Z'),
          completedAt: new Date('2030-01-01T00:00:07.000Z'),
          durationMs: 7000,
        },
      ],
    });

    const result = await getPuzzleAttemptSpeedPercentages({
      keys: [{ puzzleId, userId: user.id, durationMs: 11000 }],
    });

    expect(result.get(`${puzzleId}:${user.id}:11000`)).toBe(50);
  });

  it('returns 100% when there are no peers', async () => {
    const { puzzleId } = await createTestPuzzleForAttemptStats();
    const user = await createTestUser();

    await prisma.userPuzzleAttempt.createMany({
      data: [
        {
          userId: user.id,
          puzzleId,
          startedAt: new Date('2030-01-01T00:00:00.000Z'),
          completedAt: new Date('2030-01-01T00:00:10.000Z'),
          durationMs: 10000,
        },
      ],
    });

    const result = await getPuzzleAttemptSpeedPercentages({
      keys: [{ puzzleId, userId: user.id, durationMs: 10000 }],
    });

    expect(result.get(`${puzzleId}:${user.id}:10000`)).toBe(100);
  });

  it('does counts ties as slower peers', async () => {
    const { puzzleId } = await createTestPuzzleForAttemptStats();
    const user = await createTestUser();
    const tiedUser = await createTestUser();
    const slower = await createTestUser();

    await prisma.userPuzzleAttempt.createMany({
      data: [
        {
          userId: user.id,
          puzzleId,
          startedAt: new Date('2030-01-01T00:00:00.000Z'),
          completedAt: new Date('2030-01-01T00:00:10.000Z'),
          durationMs: 10000,
        },
        {
          userId: tiedUser.id,
          puzzleId,
          startedAt: new Date('2030-01-01T00:00:00.000Z'),
          completedAt: new Date('2030-01-01T00:00:10.000Z'),
          durationMs: 10000,
        },
        {
          userId: slower.id,
          puzzleId,
          startedAt: new Date('2030-01-01T00:00:00.000Z'),
          completedAt: new Date('2030-01-01T00:00:12.000Z'),
          durationMs: 12000,
        },
      ],
    });

    const result = await getPuzzleAttemptSpeedPercentages({
      keys: [{ puzzleId, userId: user.id, durationMs: 10000 }],
    });

    expect(result.get(`${puzzleId}:${user.id}:10000`)).toBe(100);
  });

  it('returns 100% when there are no completed peers', async () => {
    const { puzzleId } = await createTestPuzzleForAttemptStats();
    const user = await createTestUser();
    const incompletePeer = await createTestUser();

    await prisma.userPuzzleAttempt.createMany({
      data: [
        {
          userId: user.id,
          puzzleId,
          startedAt: new Date('2030-01-01T00:00:00.000Z'),
          completedAt: new Date('2030-01-01T00:00:10.000Z'),
          durationMs: 10000,
        },
        {
          userId: incompletePeer.id,
          puzzleId,
          startedAt: new Date('2030-01-01T00:00:00.000Z'),
          completedAt: null,
          durationMs: null,
        },
      ],
    });

    const result = await getPuzzleAttemptSpeedPercentages({
      keys: [{ puzzleId, userId: user.id, durationMs: 10000 }],
    });

    expect(result.get(`${puzzleId}:${user.id}:10000`)).toBe(100);
  });

  it('returns 0 when no peers are slower than the user', async () => {
    const { puzzleId } = await createTestPuzzleForAttemptStats();
    const user = await createTestUser();
    const completedPeer = await createTestUser();

    await prisma.userPuzzleAttempt.createMany({
      data: [
        {
          userId: user.id,
          puzzleId,
          startedAt: new Date('2030-01-01T00:00:00.000Z'),
          completedAt: new Date('2030-01-01T00:00:14.000Z'),
          durationMs: 14000,
        },
        {
          userId: completedPeer.id,
          puzzleId,
          startedAt: new Date('2030-01-01T00:00:00.000Z'),
          completedAt: new Date('2030-01-01T00:00:08.000Z'),
          durationMs: 8000,
        },
      ],
    });

    const result = await getPuzzleAttemptSpeedPercentages({
      keys: [{ puzzleId, userId: user.id, durationMs: 14000 }],
    });

    expect(result.get(`${puzzleId}:${user.id}:14000`)).toBe(0);
  });

  it('returns empty map for empty input keys', async () => {
    const result = await getPuzzleAttemptSpeedPercentages({ keys: [] });
    expect(result.size).toBe(0);
  });
});
