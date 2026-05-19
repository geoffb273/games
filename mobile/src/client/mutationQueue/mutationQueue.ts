import { type ApolloClient } from '@apollo/client';
import { z } from 'zod';

import { isOnline } from '@/client/networkState';
import { logError, logInfo } from '@/client/newRelic';
import { EVENT } from '@/constants/event';
import {
  DeleteProgressMutationDocument,
  type MutationRequestPuzzleHintInput,
  type MutationSolvePuzzleInput,
  PuzzleType,
  RequestPuzzleHintMutationDocument,
  SolvePuzzleMutationDocument,
} from '@/generated/gql/graphql';
import { getStorage } from '@/storage/mmkv';

import { addPendingPuzzleHint } from './pendingHints';

const QUEUE_STORAGE_KEY = 'mutation-queue:v1';

const puzzleTypeSchema = z.enum([
  PuzzleType.Flow,
  PuzzleType.Hanji,
  PuzzleType.Hashi,
  PuzzleType.Minesweeper,
  PuzzleType.Slitherlink,
]);

const cellSchema = z.object({
  row: z.number(),
  col: z.number(),
});

const hashiBridgeSchema = z.object({
  bridges: z.number(),
  from: cellSchema,
  to: cellSchema,
});

const slitherlinkSolutionSchema = z.object({
  horizontalEdges: z.array(z.array(z.boolean())),
  verticalEdges: z.array(z.array(z.boolean())),
});

const solvePuzzleInputSchema = z.object({
  puzzleId: z.string(),
  puzzleType: puzzleTypeSchema,
  startedAt: z.string(),
  completedAt: z.string().nullable().optional(),
  durationMs: z.number().nullable().optional(),
  flowSolution: z.array(z.array(z.number())).nullable().optional(),
  hanjiSolution: z.array(z.array(z.number())).nullable().optional(),
  hashiSolution: z.array(hashiBridgeSchema).nullable().optional(),
  minesweeperSolution: z.array(z.array(z.boolean())).nullable().optional(),
  slitherlinkSolution: slitherlinkSolutionSchema.nullable().optional(),
});

const requestPuzzleHintInputSchema = z.object({
  puzzleId: z.string(),
  puzzleType: puzzleTypeSchema,
  uniqueKey: z.string().nullable().optional(),
  hanjiCurrentState: z.array(z.array(z.number())).nullable().optional(),
  hashiCurrentState: z.array(hashiBridgeSchema).nullable().optional(),
  minesweeperCurrentState: z.array(z.array(z.boolean())).nullable().optional(),
  slitherlinkCurrentState: slitherlinkSolutionSchema.nullable().optional(),
});

const baseQueuedMutationSchema = z.object({
  id: z.string(),
  enqueuedAt: z.string(),
  failedAttemptCount: z.number().optional(),
  lastErrorMessage: z.string().optional(),
});

const queuedMutationSchema = z.discriminatedUnion('operation', [
  baseQueuedMutationSchema.extend({
    operation: z.literal('SolvePuzzle'),
    variables: z.object({ input: solvePuzzleInputSchema }),
  }),
  baseQueuedMutationSchema.extend({
    operation: z.literal('RequestPuzzleHint'),
    variables: z.object({ input: requestPuzzleHintInputSchema }),
  }),
  baseQueuedMutationSchema.extend({
    operation: z.literal('DeleteProgress'),
    variables: z.object({}).optional(),
  }),
]);

const queuedMutationsSchema = z.array(queuedMutationSchema);

export type QueuedMutation = z.infer<typeof queuedMutationSchema>;

type MutationClient = Pick<ApolloClient, 'mutate'>;

type ProcessQueuedMutationsInput = {
  client: MutationClient;
  onDeleteProgressSynced?: () => void | Promise<void>;
};

let isProcessing = false;

function createId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function serializeDate(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : value;
}

function serializeNullableDate(value: Date | string | null | undefined): string | null | undefined {
  if (value == null) return value;
  return serializeDate(value);
}

function serializeSolvePuzzleInput(input: MutationSolvePuzzleInput): QueuedMutation['variables'] {
  return {
    input: {
      ...input,
      startedAt: serializeDate(input.startedAt),
      completedAt: serializeNullableDate(input.completedAt),
    },
  };
}

function deserializeSolvePuzzleVariables(
  variables: Extract<QueuedMutation, { operation: 'SolvePuzzle' }>['variables'],
): { input: MutationSolvePuzzleInput } {
  return {
    input: {
      ...variables.input,
      startedAt: new Date(variables.input.startedAt),
      completedAt:
        variables.input.completedAt == null
          ? variables.input.completedAt
          : new Date(variables.input.completedAt),
    },
  };
}

function readQueueFromStorage(): QueuedMutation[] {
  const storedQueue = getStorage().getString(QUEUE_STORAGE_KEY);
  if (storedQueue == null) return [];

  const parsedQueue = queuedMutationsSchema.safeParse(JSON.parse(storedQueue));
  if (!parsedQueue.success) {
    logError({ event: EVENT.MUTATION_QUEUE_ERROR }, 'Stored mutation queue is invalid');
    return [];
  }

  return parsedQueue.data;
}

function writeQueueToStorage(queue: QueuedMutation[]): void {
  if (queue.length === 0) {
    getStorage().delete(QUEUE_STORAGE_KEY);
    return;
  }

  getStorage().set(QUEUE_STORAGE_KEY, JSON.stringify(queue));
}

function appendQueuedMutation(mutation: QueuedMutation): void {
  writeQueueToStorage([...readQueueFromStorage(), mutation]);
}

function updateQueuedMutation(updatedMutation: QueuedMutation): void {
  const [firstMutation, ...rest] = readQueueFromStorage();
  if (firstMutation?.id !== updatedMutation.id) return;

  writeQueueToStorage([updatedMutation, ...rest]);
}

function dequeueQueuedMutation(mutation: QueuedMutation): void {
  const [firstMutation, ...rest] = readQueueFromStorage();
  if (firstMutation?.id !== mutation.id) return;

  writeQueueToStorage(rest);
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return 'Unknown mutation queue error';
}

function isAlreadyCompletedResult(result: { __typename?: string } | null | undefined): boolean {
  return result?.__typename === 'AlreadyExistsError';
}

function isSuccessfulResult(result: { __typename?: string } | null | undefined): boolean {
  return result?.__typename?.endsWith('Success') === true;
}

function getQueuedMutationResult(
  mutation: QueuedMutation,
  data: unknown,
): { status: 'success' } | { status: 'retry'; message: string } {
  switch (mutation.operation) {
    case 'SolvePuzzle': {
      const result = (
        data as { solvePuzzle?: { __typename?: string; message?: string | null } } | null
      )?.solvePuzzle;
      if (isSuccessfulResult(result) || isAlreadyCompletedResult(result))
        return { status: 'success' };
      return { status: 'retry', message: result?.message ?? 'Unable to sync solved puzzle' };
    }
    case 'RequestPuzzleHint': {
      const result = (
        data as {
          requestPuzzleHint?: {
            __typename?: string;
            message?: string | null;
            data?: unknown;
          };
        } | null
      )?.requestPuzzleHint;
      if (result != null && isSuccessfulResult(result)) {
        addPendingPuzzleHint({
          puzzleId: mutation.variables.input.puzzleId,
          hint: result.data,
        });
        return { status: 'success' };
      }
      if (isAlreadyCompletedResult(result)) return { status: 'success' };
      return { status: 'retry', message: result?.message ?? 'Unable to sync puzzle hint' };
    }
    case 'DeleteProgress': {
      const result = (
        data as { deleteProgress?: { __typename?: string; message?: string | null } } | null
      )?.deleteProgress;
      if (isSuccessfulResult(result)) return { status: 'success' };
      return { status: 'retry', message: result?.message ?? 'Unable to sync delete progress' };
    }
  }
}

async function processQueuedMutation({
  client,
  mutation,
}: {
  client: MutationClient;
  mutation: QueuedMutation;
}): Promise<{ status: 'success' } | { status: 'retry'; message: string }> {
  switch (mutation.operation) {
    case 'SolvePuzzle': {
      const { data } = await client.mutate({
        mutation: SolvePuzzleMutationDocument,
        variables: deserializeSolvePuzzleVariables(mutation.variables),
      });
      return getQueuedMutationResult(mutation, data);
    }
    case 'RequestPuzzleHint': {
      const { data } = await client.mutate({
        mutation: RequestPuzzleHintMutationDocument,
        variables: mutation.variables,
      });
      return getQueuedMutationResult(mutation, data);
    }
    case 'DeleteProgress': {
      const { data } = await client.mutate({
        mutation: DeleteProgressMutationDocument,
      });
      return getQueuedMutationResult(mutation, data);
    }
  }
}

export function readQueuedMutations(): QueuedMutation[] {
  return readQueueFromStorage();
}

export function enqueueSolvePuzzle(input: MutationSolvePuzzleInput): void {
  appendQueuedMutation({
    id: createId(),
    operation: 'SolvePuzzle',
    enqueuedAt: new Date().toISOString(),
    variables: serializeSolvePuzzleInput(input),
  } as QueuedMutation);
}

export function enqueueRequestPuzzleHint(input: MutationRequestPuzzleHintInput): void {
  appendQueuedMutation({
    id: createId(),
    operation: 'RequestPuzzleHint',
    enqueuedAt: new Date().toISOString(),
    variables: { input },
  });
}

export function enqueueDeleteProgress(): void {
  appendQueuedMutation({
    id: createId(),
    operation: 'DeleteProgress',
    enqueuedAt: new Date().toISOString(),
  });
}

export async function processQueuedMutations({
  client,
  onDeleteProgressSynced,
}: ProcessQueuedMutationsInput): Promise<void> {
  if (isProcessing || !isOnline()) return;

  isProcessing = true;
  try {
    while (isOnline()) {
      const [mutation] = readQueueFromStorage();
      if (mutation == null) return;

      try {
        const result = await processQueuedMutation({ client, mutation });
        if (result.status === 'retry') {
          updateQueuedMutation({
            ...mutation,
            failedAttemptCount: (mutation.failedAttemptCount ?? 0) + 1,
            lastErrorMessage: result.message,
          });
          logError({ event: EVENT.MUTATION_QUEUE_ERROR }, result.message);
          return;
        }

        dequeueQueuedMutation(mutation);
        logInfo({ event: EVENT.MUTATION_QUEUE_ERROR }, `Synced queued ${mutation.operation}`);

        if (mutation.operation === 'DeleteProgress') {
          await onDeleteProgressSynced?.();
          return;
        }
      } catch (error) {
        const message = getErrorMessage(error);
        updateQueuedMutation({
          ...mutation,
          failedAttemptCount: (mutation.failedAttemptCount ?? 0) + 1,
          lastErrorMessage: message,
        });
        logError({ event: EVENT.MUTATION_QUEUE_ERROR }, message);
        return;
      }
    }
  } finally {
    isProcessing = false;
  }
}

export function clearQueuedMutationsForTest(): void {
  writeQueueToStorage([]);
  isProcessing = false;
}
