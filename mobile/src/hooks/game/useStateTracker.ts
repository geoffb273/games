import { useRef, useState } from 'react';

/**
 * A hook to track the state of a game and allow for undo/redo.
 *
 * @returns An object with the current state, a function to push a new state snapshot, and a function to pop the last state snapshot.
 */
export function useStateTracker<T>() {
  const stateTrackerRef = useRef<T[]>([]);
  const [isEmpty, setIsEmpty] = useState(true);

  const pushStateSnapshot = (state: T) => {
    stateTrackerRef.current.push(state);
    setIsEmpty(false);
  };

  const popStateSnapshot = () => {
    const state = stateTrackerRef.current.pop();
    setIsEmpty(stateTrackerRef.current.length === 0);
    return state;
  };

  return {
    isEmpty,
    pushStateSnapshot,
    popStateSnapshot,
  };
}
