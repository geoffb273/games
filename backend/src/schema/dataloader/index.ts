import { type Context } from '../context/context';
import { DailyChallengeDataLoader } from './dailyChallenge';
import { PuzzleDataLoader } from './puzzle';

export function createDataloaders(context: Omit<Context, 'dataloaders'>) {
  return {
    ...PuzzleDataLoader(context),
    ...DailyChallengeDataLoader(context),
  };
}

export type Dataloaders = ReturnType<typeof createDataloaders>;
