import { afterEach, describe, expect, it, vi } from 'vitest';

import { prisma } from '@/client/prisma';
import {
  getDailyChallengeCurrentStreakForUser,
  getDailyChallengeMaxStreakForUser,
} from '@/platform/dailyChallenge/dao/dailyChallengeDao';
import { createTestDailyChallenge, createTestUser } from '@/test/testUtils';
import { getTodayInAmericaNewYorkAsUtcMidnight } from '@/utils/dateUtils';

const MINIMAL_HANJI_DATA = {
  width: 1,
  height: 1,
  rowClues: [[0]],
  colClues: [[0]],
  solution: [[0]],
};
const MINIMAL_FLOW_DATA = {
  width: 1,
  height: 1,
  pairs: [[0, 0]],
  solution: [[0]],
};

function addUtcDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

function atNoonUtc(date: Date): Date {
  const result = new Date(date);
  result.setUTCHours(12, 0, 0, 0);
  return result;
}

async function createAttemptedDailyChallengeForUser({
  userId,
  date,
  qualifies,
}: {
  userId: string;
  date: Date;
  qualifies: boolean;
}) {
  const dailyChallenge = await createTestDailyChallenge({ date });
  const [hanjiPuzzle, flowPuzzle] = await Promise.all([
    prisma.puzzle.create({
      data: {
        dailyChallengeId: dailyChallenge.id,
        type: 'HANJI',
        data: MINIMAL_HANJI_DATA,
      },
    }),
    prisma.puzzle.create({
      data: {
        dailyChallengeId: dailyChallenge.id,
        type: 'FLOW',
        data: MINIMAL_FLOW_DATA,
      },
    }),
  ]);

  await Promise.all([
    prisma.userPuzzleAttempt.create({
      data: {
        userId,
        puzzleId: hanjiPuzzle.id,
        startedAt: atNoonUtc(date),
        completedAt: addUtcDays(date, 1),
        durationMs: 1000,
      },
    }),
    prisma.userPuzzleAttempt.create({
      data: {
        userId,
        puzzleId: flowPuzzle.id,
        startedAt: qualifies ? atNoonUtc(date) : addUtcDays(date, 2),
        completedAt: addUtcDays(date, 1),
        durationMs: 1000,
      },
    }),
  ]);
}

async function createPartiallyAttemptedDailyChallengeForUser({
  userId,
  date,
}: {
  userId: string;
  date: Date;
}) {
  const dailyChallenge = await createTestDailyChallenge({ date });
  const attemptedPuzzle = await prisma.puzzle.create({
    data: {
      dailyChallengeId: dailyChallenge.id,
      type: 'HANJI',
      data: MINIMAL_HANJI_DATA,
    },
  });

  await prisma.puzzle.create({
    data: {
      dailyChallengeId: dailyChallenge.id,
      type: 'FLOW',
      data: MINIMAL_FLOW_DATA,
    },
  });

  await prisma.userPuzzleAttempt.create({
    data: {
      userId,
      puzzleId: attemptedPuzzle.id,
      startedAt: atNoonUtc(date),
      completedAt: addUtcDays(date, 1),
      durationMs: 1000,
    },
  });
}

describe('getDailyChallengeStreakForUser', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('returns max streak from the longest qualifying run', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2050-01-10T12:00:00.000Z'));
    const user = await createTestUser();
    const today = getTodayInAmericaNewYorkAsUtcMidnight();

    await createAttemptedDailyChallengeForUser({
      userId: user.id,
      date: addUtcDays(today, -10),
      qualifies: true,
    });
    await createAttemptedDailyChallengeForUser({
      userId: user.id,
      date: addUtcDays(today, -9),
      qualifies: true,
    });
    await createAttemptedDailyChallengeForUser({
      userId: user.id,
      date: addUtcDays(today, -7),
      qualifies: true,
    });
    await createAttemptedDailyChallengeForUser({
      userId: user.id,
      date: addUtcDays(today, -6),
      qualifies: true,
    });
    await createAttemptedDailyChallengeForUser({
      userId: user.id,
      date: addUtcDays(today, -5),
      qualifies: true,
    });
    await createAttemptedDailyChallengeForUser({
      userId: user.id,
      date: addUtcDays(today, -3),
      qualifies: false,
    });

    const maxStreak = await getDailyChallengeMaxStreakForUser({ userId: user.id });

    expect(maxStreak).toBe(3);
  });

  it('anchors current streak to today when today qualifies', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2050-02-10T12:00:00.000Z'));
    const user = await createTestUser();
    const today = getTodayInAmericaNewYorkAsUtcMidnight();

    await createAttemptedDailyChallengeForUser({
      userId: user.id,
      date: addUtcDays(today, 0),
      qualifies: true,
    });
    await createAttemptedDailyChallengeForUser({
      userId: user.id,
      date: addUtcDays(today, -1),
      qualifies: true,
    });
    await createAttemptedDailyChallengeForUser({
      userId: user.id,
      date: addUtcDays(today, -2),
      qualifies: true,
    });
    await createAttemptedDailyChallengeForUser({
      userId: user.id,
      date: addUtcDays(today, -4),
      qualifies: true,
    });

    const currentStreak = await getDailyChallengeCurrentStreakForUser({ userId: user.id });

    expect(currentStreak).toBe(3);
  });

  it('anchors current streak to yesterday when today does not qualify', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2050-03-10T12:00:00.000Z'));
    const user = await createTestUser();
    const today = getTodayInAmericaNewYorkAsUtcMidnight();

    await createAttemptedDailyChallengeForUser({
      userId: user.id,
      date: addUtcDays(today, -1),
      qualifies: true,
    });
    await createAttemptedDailyChallengeForUser({
      userId: user.id,
      date: addUtcDays(today, -2),
      qualifies: true,
    });
    await createAttemptedDailyChallengeForUser({
      userId: user.id,
      date: addUtcDays(today, -4),
      qualifies: true,
    });

    const currentStreak = await getDailyChallengeCurrentStreakForUser({ userId: user.id });

    expect(currentStreak).toBe(2);
  });

  it('returns zero current streak when neither today nor yesterday qualify', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2050-04-10T12:00:00.000Z'));
    const user = await createTestUser();
    const today = getTodayInAmericaNewYorkAsUtcMidnight();

    await createAttemptedDailyChallengeForUser({
      userId: user.id,
      date: addUtcDays(today, -2),
      qualifies: true,
    });
    await createAttemptedDailyChallengeForUser({
      userId: user.id,
      date: addUtcDays(today, -3),
      qualifies: true,
    });

    const currentStreak = await getDailyChallengeCurrentStreakForUser({ userId: user.id });

    expect(currentStreak).toBe(0);
  });

  it('counts today when attempts started the same NY day at a non-midnight UTC time', async () => {
    // Regression: before the fix, dc.date was converted UTC->NY which shifted it
    // back one day and caused same-day completions to not qualify, returning 0.
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2050-01-10T20:00:00.000Z'));
    const user = await createTestUser();
    const today = getTodayInAmericaNewYorkAsUtcMidnight();

    const dailyChallenge = await createTestDailyChallenge({ date: today });
    const [hanjiPuzzle, flowPuzzle] = await Promise.all([
      prisma.puzzle.create({
        data: {
          dailyChallengeId: dailyChallenge.id,
          type: 'HANJI',
          data: MINIMAL_HANJI_DATA,
        },
      }),
      prisma.puzzle.create({
        data: {
          dailyChallengeId: dailyChallenge.id,
          type: 'FLOW',
          data: MINIMAL_FLOW_DATA,
        },
      }),
    ]);

    const startedAt = new Date('2050-01-10T20:00:00.000Z');
    await Promise.all([
      prisma.userPuzzleAttempt.create({
        data: {
          userId: user.id,
          puzzleId: hanjiPuzzle.id,
          startedAt,
          completedAt: startedAt,
          durationMs: 1000,
        },
      }),
      prisma.userPuzzleAttempt.create({
        data: {
          userId: user.id,
          puzzleId: flowPuzzle.id,
          startedAt,
          completedAt: startedAt,
          durationMs: 1000,
        },
      }),
    ]);

    const currentStreak = await getDailyChallengeCurrentStreakForUser({ userId: user.id });

    expect(currentStreak).toBe(1);
  });

  it('does not count partially completed daily challenges toward streaks', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2050-05-10T12:00:00.000Z'));
    const user = await createTestUser();
    const today = getTodayInAmericaNewYorkAsUtcMidnight();

    await createAttemptedDailyChallengeForUser({
      userId: user.id,
      date: addUtcDays(today, -3),
      qualifies: true,
    });
    await createPartiallyAttemptedDailyChallengeForUser({
      userId: user.id,
      date: addUtcDays(today, -2),
    });
    await createAttemptedDailyChallengeForUser({
      userId: user.id,
      date: addUtcDays(today, -1),
      qualifies: true,
    });

    const currentStreak = await getDailyChallengeCurrentStreakForUser({ userId: user.id });
    const maxStreak = await getDailyChallengeMaxStreakForUser({ userId: user.id });

    expect(currentStreak).toBe(1);
    expect(maxStreak).toBe(1);
  });
});
