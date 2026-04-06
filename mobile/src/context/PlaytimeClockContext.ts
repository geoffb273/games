import { createContext, use } from 'react';

export type PlaytimeClockContextType = {
  getElapsedMs: () => number;
  getSolveTiming: (completedAt: Date) => { durationMs: number; startedAt: Date };
  /** Replace accumulated active ms (e.g. after loading persisted game state). */
  replaceAccumulatedMs: (ms: number) => void;
  /** Ref-counted: pair every call with `resume` (e.g. app background + fullscreen ad). */
  pause: () => void;
  /** Decrements pause depth; the clock runs only when depth is 0. */
  resume: () => void;
};

export const PlaytimeClockContext = createContext<PlaytimeClockContextType | null>(null);

export function usePlaytimeClockContext(): PlaytimeClockContextType {
  const ctx = use(PlaytimeClockContext);

  if (ctx == null) {
    throw new Error('usePlaytimeClock must be used within PlaytimeClockProvider');
  }

  return ctx;
}
