import { useCallback, useInsertionEffect, useRef } from 'react';

/**
 * Returns a stable callback that can be used to avoid re-creating the callback function on every render.
 *
 * @param callback - The callback function to make stable.
 * @returns A stable callback function.
 */
export function useStableCallback<T extends (...args: any[]) => any>(callback: T): T {
  const callbackRef = useRef<T>(callback);
  useInsertionEffect(() => {
    callbackRef.current = callback;
  });

  return useCallback((...args: Parameters<T>) => callbackRef.current(...args), []) as T;
}
