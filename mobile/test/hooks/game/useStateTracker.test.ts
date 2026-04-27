import { act, renderHook } from '@testing-library/react-native';

import { useStateTracker } from '@/hooks/game/useStateTracker';

describe('useStateTracker', () => {
  it('starts empty', () => {
    const { result } = renderHook(() => useStateTracker<number>());

    expect(result.current.isEmpty).toBe(true);
  });

  it('becomes non-empty after pushing a snapshot', () => {
    const { result } = renderHook(() => useStateTracker<number>());

    act(() => {
      result.current.pushStateSnapshot(123);
    });

    expect(result.current.isEmpty).toBe(false);
  });

  it('pops snapshots in LIFO order and updates emptiness', () => {
    const { result } = renderHook(() => useStateTracker<string>());

    act(() => {
      result.current.pushStateSnapshot('first');
      result.current.pushStateSnapshot('second');
    });

    let popped: string | undefined;
    act(() => {
      popped = result.current.popStateSnapshot();
    });
    expect(popped).toBe('second');
    expect(result.current.isEmpty).toBe(false);

    act(() => {
      popped = result.current.popStateSnapshot();
    });
    expect(popped).toBe('first');
    expect(result.current.isEmpty).toBe(true);
  });

  it('returns undefined when popping from empty tracker', () => {
    const { result } = renderHook(() => useStateTracker<object>());

    let popped: object | undefined;
    act(() => {
      popped = result.current.popStateSnapshot();
    });

    expect(popped).toBeUndefined();
    expect(result.current.isEmpty).toBe(true);
  });

  it('empties the tracker when clearSnapshots is called', () => {
    const { result } = renderHook(() => useStateTracker<string>());

    act(() => {
      result.current.pushStateSnapshot('first');
      result.current.pushStateSnapshot('second');
    });
    expect(result.current.isEmpty).toBe(false);

    act(() => {
      result.current.clearSnapshots();
    });
    expect(result.current.isEmpty).toBe(true);

    let popped: string | undefined;
    act(() => {
      popped = result.current.popStateSnapshot();
    });
    expect(popped).toBeUndefined();
  });
});
