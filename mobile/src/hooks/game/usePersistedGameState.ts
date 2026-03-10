import { useCallback, useState } from 'react';

import { type ZodType } from 'zod';

import { getStorage } from '@/storage/mmkv';

type UsePersistedGameStateParams<T> = {
  puzzleId: string;
  puzzleType: string;
  /**
   * Bump this when the stored shape changes. Old data will be ignored.
   */
  version: number;
  /**
   * Zod schema used to validate and parse persisted data.
   */
  schema: ZodType<T>;
};

type PersistedEnvelope<T> = {
  version: number;
  data: T;
};

export type UsePersistedGameStateResult<T> = {
  /**
   * The hydrated state, or null if nothing was stored or hydration failed.
   */
  persistedState: T | null;
  /**
   * Save the latest state snapshot.
   */
  saveState: (next: T) => void;
  /**
   * Remove any persisted state for this puzzle.
   */
  clearState: () => void;
};

function buildStorageKey(puzzleType: string, puzzleId: string, version: number): string {
  return `puzzleState:${puzzleType}:${puzzleId}:v${version}`;
}

/**
 * Hook to persist and hydrate game state using MMKV.
 */
export function usePersistedGameState<T>({
  puzzleId,
  puzzleType,
  version,
  schema,
}: UsePersistedGameStateParams<T>): UsePersistedGameStateResult<T> {
  const storageKey = buildStorageKey(puzzleType, puzzleId, version);
  const storage = getStorage();
  const [persistedState, setPersistedState] = useState<T | null>(() => {
    try {
      const raw = storage.getString(storageKey);
      if (raw == null) return null;

      const parsed = JSON.parse(raw) as PersistedEnvelope<unknown>;
      if (parsed == null || typeof parsed !== 'object') {
        return null;
      }

      if (parsed.version !== version) {
        return null;
      }

      const data = (parsed as PersistedEnvelope<unknown>).data;
      const result = schema.safeParse(data);
      if (!result.success) {
        return null;
      }

      return result.data;
    } catch {
      return null;
    }
  });

  const saveState = useCallback(
    (next: T) => {
      setPersistedState(next);
      const envelope: PersistedEnvelope<T> = { version, data: next };
      try {
        storage.set(storageKey, JSON.stringify(envelope));
      } catch {
        // Ignore write errors; persistence is best-effort.
      }
    },
    [storageKey, storage, version],
  );

  const clearState = useCallback(() => {
    setPersistedState(null);
    try {
      storage.delete(storageKey);
    } catch {
      // Ignore errors.
    }
  }, [storage, storageKey]);

  return {
    persistedState,
    saveState,
    clearState,
  };
}
