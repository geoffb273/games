import {
  type MutableRefObject,
  type ReactNode,
  type RefObject,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from 'react';
import { AppState } from 'react-native';

import { type PlaytimeClockApi, PlaytimeClockContext } from '@/context/PlaytimeClockContext';

function closeSegment(
  accumulatedMsRef: RefObject<number>,
  segmentStartRef: RefObject<Date | null>,
): void {
  const start = segmentStartRef.current;
  if (start != null) {
    accumulatedMsRef.current += Date.now() - start.getTime();
    segmentStartRef.current = null;
  }
}

function openSegment(
  pauseCountRef: MutableRefObject<number>,
  segmentStartRef: MutableRefObject<Date | null>,
): void {
  if (pauseCountRef.current === 0) {
    segmentStartRef.current = new Date();
  }
}

type PlaytimeClockProviderProps = {
  children: ReactNode;
};

export function PlaytimeClockProvider({ children }: PlaytimeClockProviderProps) {
  const accumulatedMsRef = useRef(0);
  /** Assumes the app is active when the game screen mounts; AppState listener handles background/inactive after that. */
  const segmentStartRef = useRef<Date | null>(new Date());
  const pauseCountRef = useRef(0);

  const pause = useCallback(() => {
    if (pauseCountRef.current === 0) {
      closeSegment(accumulatedMsRef, segmentStartRef);
    }
    pauseCountRef.current += 1;
  }, []);

  const resume = useCallback(() => {
    pauseCountRef.current = Math.max(0, pauseCountRef.current - 1);
    openSegment(pauseCountRef, segmentStartRef);
  }, []);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      if (next !== 'active') {
        pause();
      } else {
        resume();
      }
    });
    return () => {
      sub.remove();
    };
  }, [pause, resume]);

  const getElapsedMs = useCallback((): number => {
    const seg = segmentStartRef.current;
    return accumulatedMsRef.current + (seg != null ? Date.now() - seg.getTime() : 0);
  }, []);

  const getSolveTiming = useCallback(
    (completedAt: Date): { durationMs: number; startedAt: Date } => {
      const durationMs = Math.max(0, Math.round(getElapsedMs()));
      const startedAt = new Date(completedAt.getTime() - durationMs);
      return { durationMs, startedAt };
    },
    [getElapsedMs],
  );

  const replaceAccumulatedMs = useCallback((ms: number) => {
    accumulatedMsRef.current = Math.max(0, ms);
    if (pauseCountRef.current === 0) {
      segmentStartRef.current = new Date();
    }
  }, []);

  const value = useMemo(
    (): PlaytimeClockApi => ({
      getElapsedMs,
      getSolveTiming,
      replaceAccumulatedMs,
      pause,
      resume,
    }),
    [getElapsedMs, getSolveTiming, pause, replaceAccumulatedMs, resume],
  );

  return <PlaytimeClockContext.Provider value={value}>{children}</PlaytimeClockContext.Provider>;
}
