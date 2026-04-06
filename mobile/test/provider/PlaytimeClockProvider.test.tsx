import { type ReactNode } from 'react';
import { AppState } from 'react-native';

import { act, renderHook } from '@testing-library/react-native';

import { usePlaytimeClockContext } from '@/context/PlaytimeClockContext';
import { PlaytimeClockProvider } from '@/provider/PlaytimeClockProvider';

function wrapper({ children }: { children: ReactNode }) {
  return <PlaytimeClockProvider>{children}</PlaytimeClockProvider>;
}

describe('usePlaytimeClockContext', () => {
  it('throws when used outside PlaytimeClockProvider', () => {
    expect(() => {
      renderHook(() => usePlaytimeClockContext());
    }).toThrow('usePlaytimeClock must be used within PlaytimeClockProvider');
  });
});

describe('PlaytimeClockProvider', () => {
  let appStateChangeHandler: ((state: string) => void) | undefined;
  let addListenerSpy: jest.SpiedFunction<typeof AppState.addEventListener>;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-06-01T12:00:00.000Z'));

    appStateChangeHandler = undefined;
    addListenerSpy = jest
      .spyOn(AppState, 'addEventListener')
      .mockImplementation((event, listener) => {
        if (event === 'change') {
          appStateChangeHandler = listener as (state: string) => void;
        }
        return { remove: jest.fn() };
      });
  });

  afterEach(() => {
    addListenerSpy.mockRestore();
    jest.useRealTimers();
  });

  it('exposes getElapsedMs that advances while the clock is running', () => {
    const { result } = renderHook(() => usePlaytimeClockContext(), { wrapper });

    expect(result.current.getElapsedMs()).toBe(0);

    act(() => {
      jest.advanceTimersByTime(2_000);
    });

    expect(result.current.getElapsedMs()).toBe(2_000);
  });

  it('pause and resume control whether elapsed time accumulates', () => {
    const { result } = renderHook(() => usePlaytimeClockContext(), { wrapper });

    act(() => {
      jest.advanceTimersByTime(1_000);
    });
    expect(result.current.getElapsedMs()).toBe(1_000);

    act(() => {
      result.current.pause();
      jest.advanceTimersByTime(5_000);
    });
    expect(result.current.getElapsedMs()).toBe(1_000);

    act(() => {
      result.current.resume();
      jest.advanceTimersByTime(2_000);
    });
    expect(result.current.getElapsedMs()).toBe(3_000);
  });

  it('replaceAccumulatedMs sets the base elapsed value', () => {
    const { result } = renderHook(() => usePlaytimeClockContext(), { wrapper });

    act(() => {
      result.current.replaceAccumulatedMs(10_000);
      jest.advanceTimersByTime(500);
    });

    expect(result.current.getElapsedMs()).toBe(10_500);
  });

  it('getSolveTiming derives startedAt from completedAt and elapsed duration', () => {
    const { result } = renderHook(() => usePlaytimeClockContext(), { wrapper });

    act(() => {
      jest.advanceTimersByTime(3_000);
    });

    const completedAt = new Date('2024-06-01T12:01:00.000Z');
    const { durationMs, startedAt } = result.current.getSolveTiming(completedAt);

    expect(durationMs).toBe(3_000);
    expect(startedAt.getTime()).toBe(completedAt.getTime() - 3_000);
  });

  it('subscribes to AppState and pauses on background, resumes on active', () => {
    const { result } = renderHook(() => usePlaytimeClockContext(), { wrapper });

    expect(addListenerSpy).toHaveBeenCalledWith('change', expect.any(Function));
    expect(appStateChangeHandler).toBeDefined();

    act(() => {
      jest.advanceTimersByTime(1_000);
    });
    expect(result.current.getElapsedMs()).toBe(1_000);

    act(() => {
      appStateChangeHandler?.('background');
      jest.advanceTimersByTime(4_000);
    });
    expect(result.current.getElapsedMs()).toBe(1_000);

    act(() => {
      appStateChangeHandler?.('active');
      jest.advanceTimersByTime(500);
    });
    expect(result.current.getElapsedMs()).toBe(1_500);
  });
});
