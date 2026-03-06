import { ZodError } from 'zod';

import { getLatestDailyChallenge } from '@/platform/dailyChallenge/service/dailyChallengeService';
import {
  hanjiPuzzleDataSchema,
  hashiPuzzleDataSchema,
  minesweeperPuzzleDataSchema,
} from '@/platform/puzzle/resource/puzzle';
import {
  getPuzzle,
  getPuzzlesByDailyChallenge,
  solvePuzzle,
} from '@/platform/puzzle/service/puzzleService';

import { builder } from '../builder';
import {
  AlreadyExistsError,
  NotFoundError,
  UnauthorizedError,
  UnknownError,
  ValidationError,
} from '../errors';
import { HashiBridgeInput, PuzzleAttemptRef, PuzzleRef, PuzzleTypeEnum } from './type';

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
    resolve: async (_, { input: { id } }) => {
      return getPuzzle({ id });
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
    resolve: async (_, { input: { dailyChallengeId } }) => {
      const id = dailyChallengeId ?? (await getLatestDailyChallenge()).id;

      return getPuzzlesByDailyChallenge({
        dailyChallengeId: id,
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
          startedAt,
          completedAt,
          durationMs,
        },
      },
      { authorization },
    ) => {
      const user = await authorization.expectUser;

      try {
        switch (puzzleType) {
          case 'HANJI':
            return solvePuzzle({
              puzzleId,
              userId: user.id,
              startedAt,
              completedAt,
              durationMs,
              puzzleType: 'HANJI',
              solution:
                hanjiSolution != null
                  ? hanjiPuzzleDataSchema.shape.solution.parse(hanjiSolution)
                  : null,
            });
          case 'HASHI':
            return solvePuzzle({
              puzzleId,
              userId: user.id,
              startedAt,
              completedAt,
              durationMs,
              puzzleType: 'HASHI',
              solution:
                hashiSolution != null
                  ? hashiPuzzleDataSchema.shape.solution.parse(hashiSolution)
                  : null,
            });
          case 'MINESWEEPER':
            return solvePuzzle({
              puzzleId,
              userId: user.id,
              startedAt,
              completedAt,
              durationMs,
              puzzleType: 'MINESWEEPER',
              solution:
                minesweeperSolution != null
                  ? minesweeperPuzzleDataSchema.shape.solution.parse(minesweeperSolution)
                  : null,
            });
          default:
            // This should be unreachable because puzzleType is validated by GraphQL enum
            // but keeps TypeScript happy.
            throw new ValidationError('Unknown input puzzle type');
        }
      } catch (error) {
        if (error instanceof ZodError) {
          throw new ValidationError(error.message);
        }
        throw error;
      }
    },
  }),
);
