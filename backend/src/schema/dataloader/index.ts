import { type Authorization } from '@/schema/context/authorization';

import { DailyChallengeDataLoader } from './dailyChallenge';
import { PuzzleDataLoader } from './puzzle';

export function createDataloaders(authorization: Authorization) {
  return {
    ...PuzzleDataLoader(authorization),
    ...DailyChallengeDataLoader(authorization),
  };
}

export type Dataloaders = ReturnType<typeof createDataloaders>;
