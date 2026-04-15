import { getLatestDailyChallenge } from '@/platform/dailyChallenge/service/dailyChallengeService';
import {
  flowPuzzleDataSchema,
  hanjiPuzzleDataSchema,
  hashiPuzzleDataSchema,
  minesweeperPuzzleDataSchema,
  slitherlinkPuzzleDataSchema,
} from '@/platform/puzzle/resource/puzzle';
import {
  getPuzzle,
  getPuzzlesByDailyChallenge,
  requestPuzzleHint,
  solvePuzzle,
} from '@/platform/puzzle/service/puzzleService';
import { safeParse } from '@/utils/zodUtils';

import { builder } from '../builder';
import {
  AlreadyExistsError,
  NotFoundError,
  UnauthorizedError,
  UnknownError,
  ValidationError,
} from '../errors';
import {
  HashiBridgeInput,
  PuzzleAttemptRef,
  PuzzleHintRef,
  PuzzleRef,
  PuzzleTypeEnum,
  SlitherlinkSolutionInput,
} from './type';

builder.queryField('puzzle', (t) =>
  t.fieldWithInput({
    type: PuzzleRef,
    nullable: false,
    input: {
      id: t.input.id({ required: true }),
    },
    errors: {
      types: [UnknownError, NotFoundError],
    },
    resolve: async (_, { input: { id } }, { logger }) => {
      return getPuzzle({ id, logger });
    },
  }),
);

builder.queryField('puzzles', (t) =>
  t.fieldWithInput({
    type: [PuzzleRef],
    nullable: false,
    input: {
      dailyChallengeId: t.input.string({
        required: false,
        description:
          'The ID of the daily challenge to get puzzles for. If not provided, the latest daily challenge will be used.',
      }),
    },
    errors: {
      types: [UnknownError, NotFoundError],
    },
    resolve: async (_, { input: { dailyChallengeId } }, { logger }) => {
      const id = dailyChallengeId ?? (await getLatestDailyChallenge()).id;

      return getPuzzlesByDailyChallenge({
        dailyChallengeId: id,
        logger,
      });
    },
  }),
);

builder.mutationField('solvePuzzle', (t) =>
  t.fieldWithInput({
    description: 'Solves a puzzle for the logged in user',
    type: PuzzleAttemptRef,
    nullable: false,
    input: {
      puzzleId: t.input.id({ required: true }),
      puzzleType: t.input.field({ type: PuzzleTypeEnum, required: true }),
      hanjiSolution: t.input.field({
        type: t.input.listRef(t.input.listRef('Int')),
        required: false,
        description:
          'The solution to the Hanji puzzle. Should only be provided if the puzzle type is HANJI.',
      }),
      hashiSolution: t.input.field({
        type: [HashiBridgeInput],
        required: false,
        description:
          'The solution to the Hashi puzzle. Should only be provided if the puzzle type is HASHI.',
      }),
      minesweeperSolution: t.input.field({
        type: t.input.listRef(t.input.listRef('Boolean')),
        required: false,
        description:
          'The solution to the Minesweeper puzzle. Should only be provided if the puzzle type is MINESWEEPER.',
      }),
      slitherlinkSolution: t.input.field({
        type: SlitherlinkSolutionInput,
        required: false,
        description:
          'The solution to the Slitherlink puzzle. Should only be provided if the puzzle type is SLITHERLINK.',
      }),
      flowSolution: t.input.field({
        type: t.input.listRef(t.input.listRef('Int')),
        required: false,
        description:
          'The solution to the Flow puzzle. Should only be provided if the puzzle type is FLOW.',
      }),
      startedAt: t.input.field({
        type: 'DateTime',
        required: true,
        description: 'The time the user started the puzzle',
      }),
      completedAt: t.input.field({
        type: 'DateTime',
        required: false,
        description: 'The time the user completed the puzzle, if they completed it successfully',
      }),
      durationMs: t.input.int({
        required: false,
        description:
          'The duration of the puzzle in milliseconds, if they completed it successfully',
      }),
    },
    errors: {
      types: [UnknownError, ValidationError, NotFoundError, AlreadyExistsError, UnauthorizedError],
    },
    resolve: async (
      _,
      {
        input: {
          puzzleId,
          puzzleType,
          hanjiSolution,
          hashiSolution,
          minesweeperSolution,
          slitherlinkSolution,
          flowSolution,
          startedAt,
          completedAt,
          durationMs,
        },
      },
      { authorization, logger },
    ) => {
      const user = await authorization.expectUser;

      switch (puzzleType) {
        case 'FLOW':
          return solvePuzzle({
            puzzleId,
            userId: user.id,
            startedAt,
            completedAt,
            durationMs,
            puzzleType: 'FLOW',
            solution: safeParse({
              schema: flowPuzzleDataSchema.shape.solution,
              value: flowSolution,
              logger,
            }),
            logger,
          });
        case 'HANJI':
          return solvePuzzle({
            puzzleId,
            userId: user.id,
            startedAt,
            completedAt,
            durationMs,
            puzzleType: 'HANJI',
            solution: safeParse({
              schema: hanjiPuzzleDataSchema.shape.solution,
              value: hanjiSolution,
              logger,
            }),
            logger,
          });
        case 'HASHI':
          return solvePuzzle({
            puzzleId,
            userId: user.id,
            startedAt,
            completedAt,
            durationMs,
            puzzleType: 'HASHI',
            solution: safeParse({
              schema: hashiPuzzleDataSchema.shape.solution,
              value: hashiSolution,
              logger,
            }),
            logger,
          });
        case 'MINESWEEPER':
          return solvePuzzle({
            puzzleId,
            userId: user.id,
            startedAt,
            completedAt,
            durationMs,
            puzzleType: 'MINESWEEPER',
            solution: safeParse({
              schema: minesweeperPuzzleDataSchema.shape.solution,
              value: minesweeperSolution,
              logger,
            }),
            logger,
          });
        case 'SLITHERLINK':
          return solvePuzzle({
            puzzleId,
            userId: user.id,
            startedAt,
            completedAt,
            durationMs,
            puzzleType: 'SLITHERLINK',
            solution: safeParse({
              schema: slitherlinkPuzzleDataSchema.shape.solution,
              value: slitherlinkSolution,
              logger,
            }),
            logger,
          });
        default:
          // This should be unreachable because puzzleType is validated by GraphQL enum
          // but keeps TypeScript happy.
          throw new ValidationError('Unknown input puzzle type');
      }
    },
  }),
);

builder.mutationField('requestPuzzleHint', (t) =>
  t.fieldWithInput({
    description:
      'Returns one guaranteed part of the puzzle solution as a hint. FLOW is not supported.',
    type: PuzzleHintRef,
    nullable: false,
    input: {
      puzzleId: t.input.id({ required: true }),
      puzzleType: t.input.field({
        type: PuzzleTypeEnum,
        required: true,
      }),
      uniqueKey: t.input.string({
        required: false,
        description:
          'The unique key of the ad reward verification. Only provide when requesting a hint via an ad reward verification.',
      }),
      hanjiCurrentState: t.input.field({
        type: t.input.listRef(t.input.listRef('Int')),
        required: false,
        description:
          'Cells the user has already filled (0 or 1). Only provide when puzzle type is HANJI.',
      }),
      hashiCurrentState: t.input.field({
        type: [HashiBridgeInput],
        required: false,
        description: 'Bridges the user has already placed. Only provide when puzzle type is HASHI.',
      }),
      minesweeperCurrentState: t.input.field({
        type: t.input.listRef(t.input.listRef('Boolean')),
        required: false,
        description:
          'Cells the user has already marked. Only provide when puzzle type is MINESWEEPER.',
      }),
      slitherlinkCurrentState: t.input.field({
        type: SlitherlinkSolutionInput,
        required: false,
        description:
          'Edges the user has already set. Only provide when puzzle type is SLITHERLINK.',
      }),
    },
    errors: {
      types: [UnknownError, ValidationError, NotFoundError, AlreadyExistsError, UnauthorizedError],
    },
    resolve: async (
      _,
      {
        input: {
          puzzleId,
          puzzleType,
          uniqueKey,
          hanjiCurrentState,
          hashiCurrentState,
          minesweeperCurrentState,
          slitherlinkCurrentState,
        },
      },
      { authorization, logger },
    ) => {
      const user = await authorization.expectUser;

      if (puzzleType === 'FLOW') {
        throw new ValidationError('Hints are not supported for FLOW puzzles');
      }

      const base = { userId: user.id, puzzleId, puzzleType, uniqueKey, logger };
      switch (puzzleType) {
        case 'HANJI':
          return requestPuzzleHint({
            ...base,
            puzzleType: 'HANJI',
            hanjiCurrentState: safeParse({
              schema: hanjiPuzzleDataSchema.shape.solution,
              value: hanjiCurrentState,
              logger,
            }),
          });
        case 'HASHI':
          return requestPuzzleHint({
            ...base,
            puzzleType: 'HASHI',
            hashiCurrentState: safeParse({
              schema: hashiPuzzleDataSchema.shape.solution,
              value: hashiCurrentState,
              logger,
            }),
          });
        case 'MINESWEEPER':
          return requestPuzzleHint({
            ...base,
            puzzleType: 'MINESWEEPER',
            minesweeperCurrentState: safeParse({
              schema: minesweeperPuzzleDataSchema.shape.solution,
              value: minesweeperCurrentState,
              logger,
            }),
          });
        case 'SLITHERLINK':
          return requestPuzzleHint({
            ...base,
            puzzleType: 'SLITHERLINK',
            slitherlinkCurrentState: safeParse({
              schema: slitherlinkPuzzleDataSchema.shape.solution,
              value: slitherlinkCurrentState,
              logger,
            }),
          });
        default:
          throw new ValidationError('Unknown input puzzle type');
      }
    },
  }),
);
