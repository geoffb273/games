import { useMemo, useReducer } from 'react';

import { type HashiPuzzle } from '@/api/puzzle/puzzle';
import { useStableCallback } from '@/hooks/useStableCallback';
import { findConnections } from '@/utils/hashi/connections';
import { isHashiComplete } from '@/utils/hashi/validation';

type GameState = number[];

type GameAction =
  | { type: 'CYCLE_CONNECTION'; connectionIndex: number }
  | { type: 'RESET'; connectionCount: number };

function createInitialState(connectionCount: number): GameState {
  return Array.from({ length: connectionCount }, () => 0);
}

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'CYCLE_CONNECTION': {
      const { connectionIndex } = action;
      const current = state[connectionIndex];
      const next = current >= 2 ? 0 : current + 1;
      return state.map((v, i) => (i === connectionIndex ? next : v));
    }
    case 'RESET':
      return createInitialState(action.connectionCount);
    default:
      return state;
  }
}

export type HashiGame = {
  connections: ReturnType<typeof findConnections>;
  bridgeCounts: number[];
  isComplete: boolean;
  onConnectionTap: (connectionIndex: number) => void;
};

export function useHashiGame(puzzle: HashiPuzzle): HashiGame {
  const connections = useMemo(() => findConnections(puzzle.islands), [puzzle.islands]);
  const [bridgeCounts, dispatch] = useReducer(gameReducer, connections.length, createInitialState);

  const isComplete = useMemo(
    () => isHashiComplete(puzzle.islands, connections, bridgeCounts),
    [puzzle.islands, connections, bridgeCounts],
  );

  const onConnectionTap = useStableCallback((connectionIndex: number) => {
    dispatch({ type: 'CYCLE_CONNECTION', connectionIndex });
  });

  return {
    connections,
    bridgeCounts,
    isComplete,
    onConnectionTap,
  };
}
