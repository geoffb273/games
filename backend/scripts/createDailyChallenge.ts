import { prisma } from '../src/client/prisma';
import { createDailyChallenge } from '../src/platform/dailyChallenge/service/dailyChallengeService';
import { AlreadyExistsError } from '../src/schema/errors';

const TZ_EST = 'America/New_York';

/** Start of day (midnight) in Eastern time (America/New_York). */
function startOfDayEST(date: Date): Date {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ_EST,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const [{ value: year }, , { value: month }, , { value: day }] = formatter.formatToParts(date);
  const noonUtc = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day), 12, 0, 0));
  const hourInNY = Number(
    new Intl.DateTimeFormat('en-US', {
      timeZone: TZ_EST,
      hour: 'numeric',
      hour12: false,
    }).formatToParts(noonUtc)[0].value,
  );
  const offsetHours = (12 - hourInNY + 24) % 24;
  return new Date(Date.UTC(Number(year), Number(month) - 1, Number(day), offsetHours, 0, 0));
}

async function main() {
  const date = startOfDayEST(new Date());

  console.log(`Creating daily challenge for ${date.toISOString().split('T')[0]}...`);

  try {
    const challenge = await createDailyChallenge({ date });
    console.log(`Daily challenge created: ${challenge.id}`);
  } catch (error) {
    if (error instanceof AlreadyExistsError) {
      console.error(`A daily challenge already exists for ${date.toISOString().split('T')[0]}.`);
      process.exitCode = 1;
    } else {
      throw error;
    }
  }
}

main().finally(() => prisma.$disconnect());
