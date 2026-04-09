export type DailyChallengeStreak = {
  current: number;
  max: number;
};

const MS_PER_UTC_DAY = 86_400_000;

function uniqueSortedChallengeDates(dates: readonly Date[]): number[] {
  const unique = [...new Set(dates.map((d) => d.getTime()))];
  unique.sort((a, b) => a - b);
  return unique;
}

function longestConsecutiveRun(sortedUtcMidnights: readonly number[]): number {
  if (sortedUtcMidnights.length === 0) return 0;
  let best = 1;
  let run = 1;
  for (let i = 1; i < sortedUtcMidnights.length; i++) {
    const prev = sortedUtcMidnights[i - 1]!;
    const cur = sortedUtcMidnights[i]!;
    if (cur - prev === MS_PER_UTC_DAY) {
      run += 1;
      best = Math.max(best, run);
    } else {
      run = 1;
    }
  }
  return best;
}

/**
 * @param qualifyingChallengeDates — `DailyChallenge.date` values (UTC midnight) for days the user fully attempted every puzzle on the challenge day (America/New_York).
 * @param todayUtcMidnight — from {@link getTodayInAmericaNewYorkAsUtcMidnight}
 */
export function computeDailyChallengeStreaks({
  qualifyingChallengeDates,
  todayUtcMidnight,
}: {
  qualifyingChallengeDates: readonly Date[];
  todayUtcMidnight: Date;
}): DailyChallengeStreak {
  const sorted = uniqueSortedChallengeDates(qualifyingChallengeDates);
  const max = longestConsecutiveRun(sorted);

  const qualifying = new Set(sorted);
  const todayTs = todayUtcMidnight.getTime();
  const yesterday = new Date(todayUtcMidnight);
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  const yesterdayTs = yesterday.getTime();

  const anchorTs = qualifying.has(todayTs)
    ? todayTs
    : qualifying.has(yesterdayTs)
      ? yesterdayTs
      : null;
  if (anchorTs === null) {
    return { current: 0, max };
  }

  let current = 0;
  let t = anchorTs;
  while (qualifying.has(t)) {
    current += 1;
    t -= MS_PER_UTC_DAY;
  }

  return { current, max };
}
