import { useCallback, useEffect, useRef, useState } from 'react';

import { useRouter } from 'expo-router';
import { z } from 'zod';

import { PuzzleType } from '@/api/puzzle/puzzle';
import { getStorage } from '@/storage/mmkv';

const INSTRUCTIONS_SEEN_KEY = 'instructionsSeenByType';

const InstructionsSeenEnvelopeSchema = z.object({
  version: z.literal(1),
  data: z.record(z.enum(PuzzleType), z.boolean()),
});

type InstructionsSeenEnvelope = z.infer<typeof InstructionsSeenEnvelopeSchema>;

type InstructionsSeenMap = InstructionsSeenEnvelope['data'];

const initialState: InstructionsSeenMap = {
  [PuzzleType.Flow]: false,
  [PuzzleType.Hanji]: false,
  [PuzzleType.Hashi]: false,
  [PuzzleType.Minesweeper]: false,
  [PuzzleType.Slitherlink]: false,
};

function readInitialState(): InstructionsSeenMap {
  const storage = getStorage();
  try {
    const raw = storage.getString(INSTRUCTIONS_SEEN_KEY);
    if (raw == null) {
      return initialState;
    }

    const parsed = JSON.parse(raw);
    const result = InstructionsSeenEnvelopeSchema.safeParse(parsed);
    if (!result.success) {
      return initialState;
    }

    return result.data.data;
  } catch {
    return initialState;
  }
}

function writeState(next: InstructionsSeenMap): void {
  const storage = getStorage();
  const envelope: InstructionsSeenEnvelope = {
    version: 1,
    data: next,
  };

  try {
    storage.set(INSTRUCTIONS_SEEN_KEY, JSON.stringify(envelope));
  } catch {
    // Persistence is best-effort; ignore write errors.
  }
}

export function useInitialOpenInstructionsEffect({
  type,
  enabled = true,
}: {
  type: PuzzleType;
  enabled?: boolean;
}): void {
  const router = useRouter();

  const [state, setState] = useState<InstructionsSeenMap>(() => readInitialState());

  const hasSeen = useCallback(
    (puzzleType: PuzzleType): boolean => {
      return state[puzzleType] === true;
    },
    [state],
  );

  const markSeen = useCallback((puzzleType: PuzzleType): void => {
    setState((prev) => {
      if (prev[puzzleType] === true) {
        return prev;
      }
      const next: InstructionsSeenMap = {
        ...prev,
        [puzzleType]: true,
      };
      // Fire-and-forget write; do not block state update on storage.
      writeState(next);
      return next;
    });
  }, []);
  const hasTriggeredRef = useRef(false);

  useEffect(() => {
    if (!enabled) return;
    if (hasTriggeredRef.current) return;
    if (hasSeen(type)) return;

    hasTriggeredRef.current = true;
    markSeen(type);
    router.push({
      pathname: '/game/[type]/instructions',
      params: { type },
    });
  }, [enabled, hasSeen, markSeen, type, router]);
}
