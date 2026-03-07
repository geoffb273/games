import { type DependencyList, useEffect } from 'react';

import { useStableCallback } from './useStableCallback';

/**
 * A hook that executes a callback after a delay
 *
 * @param callback - The callback to execute after the delay. The callback is stabilized to prevent unnecessary re-renders.
 * @param dependencies - The dependencies are used to determine if the callback should be executed again.
 * Timeouts still waiting to execute will be cleared and a new timeout will be set.
 * @param delay - The delay in milliseconds before executing the callback.
 */
export function useTimeoutEffect(
  callback: () => void,
  dependencies: DependencyList,
  delay: number,
) {
  const stableCallback = useStableCallback(callback);
  useEffect(() => {
    const timeout = setTimeout(stableCallback, delay);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [delay, stableCallback, ...dependencies]);
}
