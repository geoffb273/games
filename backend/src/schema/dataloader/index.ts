import { type Context } from '../context/context';
import { DailyChallengeDataLoader } from './dailyChallenge';
import { PuzzleDataLoader } from './puzzle';

export function createDataloaders(context: Context) {
  return {
    ...PuzzleDataLoader(context),
    ...DailyChallengeDataLoader(context),
  };
}

export type Dataloaders = ReturnType<typeof createDataloaders>;
