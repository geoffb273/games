import { useRef, useState } from 'react';

/**
 * A hook to track the state of a game and allow for undo/redo.
 *
 * @returns An object with the current state, a function to push a new state snapshot, and a function to pop the last state snapshot.
 */
export function useStateTracker<T>() {
  const stateTrackerRef = useRef<T[]>([]);
  const [isUndoEnabled, setIsUndoEnabled] = useState(false);

  const pushStateSnapshot = (state: T) => {
    stateTrackerRef.current.push(state);
    setIsUndoEnabled(true);
  };

  const popStateSnapshot = () => {
    const state = stateTrackerRef.current.pop();
    setIsUndoEnabled(stateTrackerRef.current.length > 0);
    return state;
  };

  return {
    isUndoEnabled,
    pushStateSnapshot,
    popStateSnapshot,
  };
}
