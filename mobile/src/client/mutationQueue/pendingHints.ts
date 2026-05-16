import { useEffect, useState } from 'react';

import { z } from 'zod';

import { mapToPuzzleHint, type PuzzleHint } from '@/api/puzzle/puzzleHint';
import { type FragmentType } from '@/generated/gql';
import { type PuzzleHintFragmentFragmentDoc, PuzzleType } from '@/generated/gql/graphql';
import { getStorage } from '@/storage/mmkv';
import { aggressiveExhaustiveGuard } from '@/utils/guardUtils';

const PENDING_HINTS_STORAGE_KEY = 'mutation-queue:pending-hints:v1';

const pendingPuzzleHintSchema = z.discriminatedUnion('puzzleType', [
  z.object({
    puzzleType: z.literal(PuzzleType.Hanji),
    row: z.number(),
    col: z.number(),
    value: z.number(),
  }),
  z.object({
    puzzleType: z.literal(PuzzleType.Hashi),
    from: z.object({ row: z.number(), col: z.number() }),
    to: z.object({ row: z.number(), col: z.number() }),
    bridges: z.number(),
  }),
  z.object({
    puzzleType: z.literal(PuzzleType.Minesweeper),
    row: z.number(),
    col: z.number(),
    isMine: z.boolean(),
  }),
  z.object({
    puzzleType: z.literal(PuzzleType.Slitherlink),
    row: z.number(),
    col: z.number(),
    edgeType: z.enum(['HORIZONTAL', 'VERTICAL']),
    filled: z.boolean(),
  }),
]);

const pendingHintsSchema = z.record(z.string(), pendingPuzzleHintSchema);

type Listener = () => void;

const listeners = new Set<Listener>();

function notifyListeners(): void {
  listeners.forEach((listener) => listener());
}

function readPendingHints(): Record<string, PuzzleHint> {
  const storedHints = getStorage().getString(PENDING_HINTS_STORAGE_KEY);
  if (storedHints == null) return {};

  const parsedHints = pendingHintsSchema.safeParse(JSON.parse(storedHints));
  return parsedHints.success ? parsedHints.data : {};
}

function writePendingHints(hints: Record<string, PuzzleHint>): void {
  const hintCount = Object.keys(hints).length;
  if (hintCount === 0) {
    getStorage().delete(PENDING_HINTS_STORAGE_KEY);
  } else {
    getStorage().set(PENDING_HINTS_STORAGE_KEY, JSON.stringify(hints));
  }

  notifyListeners();
}

function subscribePendingHints(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function addPendingPuzzleHint({
  puzzleId,
  hint,
}: {
  puzzleId: string;
  hint: unknown;
}): void {
  if (hint == null) return;

  const mappedHint = mapToPuzzleHint(hint as FragmentType<typeof PuzzleHintFragmentFragmentDoc>);
  writePendingHints({
    ...readPendingHints(),
    [puzzleId]: mappedHint,
  });
}

export function consumePendingPuzzleHint(puzzleId: string): PuzzleHint | null {
  const hints = readPendingHints();
  const hint = hints[puzzleId];
  if (hint == null) return null;

  const { [puzzleId]: _consumedHint, ...remainingHints } = hints;
  writePendingHints(remainingHints);

  switch (hint.puzzleType) {
    case PuzzleType.Hanji:
    case PuzzleType.Hashi:
    case PuzzleType.Minesweeper:
    case PuzzleType.Slitherlink:
      return hint;
    default:
      return aggressiveExhaustiveGuard(hint);
  }
}

export function usePendingPuzzleHint(puzzleId: string): PuzzleHint | null {
  const [hint, setHint] = useState<PuzzleHint | null>(() => consumePendingPuzzleHint(puzzleId));

  useEffect(() => {
    return subscribePendingHints(() => {
      setHint(consumePendingPuzzleHint(puzzleId));
    });
  }, [puzzleId]);

  return hint;
}
