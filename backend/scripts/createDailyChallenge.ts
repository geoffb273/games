import { prisma } from '../src/client/prisma';
import { createDailyChallenge } from '../src/platform/dailyChallenge/service/dailyChallengeService';
import { AlreadyExistsError } from '../src/schema/errors';

function parseDate(arg: string): Date {
  const date = new Date(arg);
  if (isNaN(date.getTime())) {
    throw new Error(`Invalid date: "${arg}"`);
  }
  return date;
}

function startOfDayUTC(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

async function main() {
  const dateArg = process.argv[2];
  const date = startOfDayUTC(dateArg ? parseDate(dateArg) : new Date());

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
