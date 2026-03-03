import { type Authorization } from '@/schema/context/authorization';

import { PuzzleDataLoader } from './puzzle';

export function createDataloaders(authorization: Authorization) {
  return {
    ...PuzzleDataLoader(authorization),
  };
}

export type Dataloaders = ReturnType<typeof createDataloaders>;
