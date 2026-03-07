import { useRef } from 'react';

/**
 * A hook that returns a ref that always has the latest value
 *
 * @param value - The value to store in the ref
 * @returns A ref that always has the latest value
 */
export function useLatestRef<T>(value: T) {
  const ref = useRef<T>(value);
  ref.current = value;
  return ref;
}
