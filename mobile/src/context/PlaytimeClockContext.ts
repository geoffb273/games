import { createContext, use } from 'react';

export type PlaytimeClockApi = {
  getElapsedMs: () => number;
  getSolveTiming: (completedAt: Date) => { durationMs: number; startedAt: Date };
  /** Replace accumulated active ms (e.g. after loading persisted game state). */
  replaceAccumulatedMs: (ms: number) => void;
  /** Ref-counted: pair every call with `resume` (e.g. app background + fullscreen ad). */
  pause: () => void;
  /** Decrements pause depth; the clock runs only when depth is 0. */
  resume: () => void;
};

export const PlaytimeClockContext = createContext<PlaytimeClockApi | null>(null);

export function usePlaytimeClock(): PlaytimeClockApi {
  const ctx = use(PlaytimeClockContext);

  if (ctx == null) {
    throw new Error('usePlaytimeClock must be used within PlaytimeClockProvider');
  }

  return ctx;
}

/** Returns null when no provider (e.g. HintButton used outside a game). */
export function useOptionalPlaytimeClock(): PlaytimeClockApi | null {
  return use(PlaytimeClockContext);
}
