import { act, renderHook } from '@testing-library/react-native';

import { useTimeoutEffect } from '@/hooks/useTimeoutEffect';

jest.useFakeTimers();

describe('useTimeoutEffect', () => {
  it('calls the callback after the specified delay', () => {
    const callback = jest.fn();

    renderHook(() => useTimeoutEffect(callback, [], 1000));

    expect(callback).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('clears the previous timeout when dependencies change', () => {
    const callback = jest.fn();

    const { rerender } = renderHook(
      ({ deps }: { deps: number[] }) => useTimeoutEffect(callback, deps, 1000),
      {
        initialProps: { deps: [1] },
      },
    );

    act(() => {
      jest.advanceTimersByTime(500);
    });

    // Change dependencies before the original timeout completes.
    rerender({ deps: [2] });

    act(() => {
      jest.advanceTimersByTime(500);
    });

    // The original timeout should have been cleared before firing.
    expect(callback).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(500);
    });

    // Only the new timeout should fire once.
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('clears the timeout on unmount', () => {
    const callback = jest.fn();

    const { unmount } = renderHook(() => useTimeoutEffect(callback, [], 1000));

    unmount();

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(callback).not.toHaveBeenCalled();
  });
});
