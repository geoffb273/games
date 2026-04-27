import { useCallback, useEffect, useLayoutEffect, useMemo, useReducer, useRef } from 'react';

import { z } from 'zod';

import { type HashiPuzzle, PuzzleType } from '@/api/puzzle/puzzle';
import { type PuzzleHint } from '@/api/puzzle/puzzleHint';
import { usePlaytimeClockContext } from '@/context/PlaytimeClockContext';
import { usePersistedGameState } from '@/hooks/game/usePersistedGameState';
import { useStableCallback } from '@/hooks/useStableCallback';
import { triggerHapticHard, triggerHapticLight } from '@/utils/hapticUtils';
import { findConnections } from '@/utils/hashi/connections';
import { wouldNewBridgeCrossExisting } from '@/utils/hashi/crossing';
import { isHashiComplete } from '@/utils/hashi/validation';

import { useStateTracker } from './useStateTracker';

type BridgeCounts = number[];

type GameState = {
  bridgeCounts: BridgeCounts;
  hintedConnections: number[];
};

type GameAction =
  | { type: 'CYCLE_CONNECTION'; connectionIndex: number }
  | { type: 'RESET'; connectionCount: number }
  | { type: 'APPLY_HINT'; connectionIndex: number; bridges: number }
  | { type: 'REPLACE'; state: GameState };

function createInitialBridgeCounts(connectionCount: number): BridgeCounts {
  return Array.from({ length: connectionCount }, () => 0);
}

function createInitialState(connectionCount: number): GameState {
  return { bridgeCounts: createInitialBridgeCounts(connectionCount), hintedConnections: [] };
}

function cloneState(state: GameState): GameState {
  return { bridgeCounts: [...state.bridgeCounts], hintedConnections: [...state.hintedConnections] };
}

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'CYCLE_CONNECTION': {
      const { connectionIndex } = action;
      const current = state.bridgeCounts[connectionIndex];
      const next = current >= 2 ? 0 : current + 1;
      return {
        ...state,
        bridgeCounts: state.bridgeCounts.map((v, i) => (i === connectionIndex ? next : v)),
      };
    }
    case 'APPLY_HINT': {
      const { connectionIndex, bridges } = action;
      const clamped = Math.max(0, Math.min(2, bridges));
      const bridgeCounts = state.bridgeCounts.map((v, i) => (i === connectionIndex ? clamped : v));
      const hintedConnections = state.hintedConnections.includes(connectionIndex)
        ? state.hintedConnections
        : [...state.hintedConnections, connectionIndex];
      return { bridgeCounts, hintedConnections };
    }
    case 'REPLACE': {
      return action.state;
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
  isHinted: (connectionIndex: number) => boolean;
  isComplete: boolean;
  /** Returns true if adding a bridge on the given connection would not cross any existing bridges. */
  isValidBridge: (connectionIndex: number) => boolean;
  onConnectionTap: (connectionIndex: number) => void;
  onClearPress: () => void;
  onHint: (hint: Extract<PuzzleHint, { puzzleType: PuzzleType.Hashi }>) => void;
  currentState: {
    bridges: number;
    from: { row: number; col: number };
    to: { row: number; col: number };
  }[];
  onIslandPress: ({ row, col }: { row: number; col: number }) => void;
  isUndoEnabled: boolean;
  onUndoPress: () => void;
};

export type HashiOnSolve = (params: {
  hashiSolution: ReturnType<typeof buildHashiSolution>;
  durationMs: number;
  completedAt: Date;
  startedAt: Date;
}) => Promise<void>;

type HashiPersisted = {
  bridgeCounts: BridgeCounts;
  hintedConnections?: number[];
  elapsedMs: number;
};

function buildHashiSolution(
  connections: ReturnType<typeof findConnections>,
  bridgeCounts: number[],
  islands: { row: number; col: number }[],
) {
  return connections
    .map((conn, i) => {
      return {
        bridges: bridgeCounts[i],
        from: { row: islands[conn.a].row, col: islands[conn.a].col },
        to: { row: islands[conn.b].row, col: islands[conn.b].col },
      };
    })
    .filter((entry) => entry.bridges > 0);
}

function buildHashiCurrentState(
  connections: ReturnType<typeof findConnections>,
  bridgeCounts: number[],
  islands: { row: number; col: number }[],
) {
  return connections
    .map((conn, i) => ({
      bridges: bridgeCounts[i] ?? 0,
      from: { row: islands[conn.a].row, col: islands[conn.a].col },
      to: { row: islands[conn.b].row, col: islands[conn.b].col },
    }))
    .filter((entry) => entry.bridges > 0);
}

export function useHashiGame({
  puzzle: { id: puzzleId, islands },
  onSolve,
}: {
  puzzle: HashiPuzzle;
  onSolve: HashiOnSolve;
}): HashiGame {
  const lastIslandTapRef = useRef<{ row: number; col: number } | null>(null);

  const stableOnSolve = useStableCallback(onSolve);
  const { getElapsedMs, getSolveTiming, replaceAccumulatedMs } = usePlaytimeClockContext();
  const connections = useMemo(() => findConnections(islands), [islands]);
  const bridgeCountsSchema = useMemo(
    () =>
      z.array(z.number().int().min(0).max(2)).refine((arr) => arr.length === connections.length, {
        message: 'Invalid bridgeCounts length',
      }),
    [connections.length],
  );

  const persistedSchema = useMemo(
    () =>
      z.object({
        bridgeCounts: bridgeCountsSchema,
        hintedConnections: z.array(z.number().int().nonnegative()).optional(),
        elapsedMs: z.number().nonnegative(),
      }),
    [bridgeCountsSchema],
  );

  const { isEmpty, pushStateSnapshot, popStateSnapshot, clearSnapshots } =
    useStateTracker<GameState>();

  const { persistedState, saveState, clearState } = usePersistedGameState<HashiPersisted>({
    puzzleId,
    puzzleType: PuzzleType.Hashi,
    version: 1,
    schema: persistedSchema,
  });

  const [state, dispatch] = useReducer(
    gameReducer,
    { count: connections.length, persisted: persistedState },
    ({ count, persisted }) =>
      persisted == null
        ? createInitialState(count)
        : {
            bridgeCounts: persisted.bridgeCounts,
            hintedConnections: persisted.hintedConnections ?? [],
          },
  );
  const submittedRef = useRef(false);
  const hydratedPuzzleIdRef = useRef<string | null>(null);

  useLayoutEffect(() => {
    if (hydratedPuzzleIdRef.current === puzzleId) return;
    hydratedPuzzleIdRef.current = puzzleId;
    if (persistedState != null) {
      replaceAccumulatedMs(persistedState.elapsedMs);
    }
  }, [persistedState, puzzleId, replaceAccumulatedMs]);

  const isComplete = useMemo(
    () => isHashiComplete(islands, connections, state.bridgeCounts),
    [islands, connections, state.bridgeCounts],
  );

  const saveWithTime = (next: GameState) => {
    saveState({
      bridgeCounts: next.bridgeCounts,
      hintedConnections: next.hintedConnections,
      elapsedMs: getElapsedMs(),
    });
  };

  useEffect(() => {
    if (!isComplete || submittedRef.current) return;

    submittedRef.current = true;
    triggerHapticHard();
    const completedAt = new Date();
    const { durationMs, startedAt } = getSolveTiming(completedAt);

    stableOnSolve({
      hashiSolution: buildHashiSolution(connections, state.bridgeCounts, islands),
      durationMs,
      completedAt,
      startedAt,
    })
      .catch(() => {
        submittedRef.current = false;
      })
      .finally(() => {
        clearState();
      });
  }, [
    state.bridgeCounts,
    clearState,
    connections,
    getSolveTiming,
    islands,
    isComplete,
    stableOnSolve,
  ]);

  const isValidBridge = useCallback(
    (connectionIndex: number): boolean =>
      !wouldNewBridgeCrossExisting(connectionIndex, connections, state.bridgeCounts, islands),
    [connections, state.bridgeCounts, islands],
  );

  const onConnectionTap = useStableCallback((connectionIndex: number) => {
    if (state.hintedConnections.includes(connectionIndex)) return;
    triggerHapticLight();
    const next = gameReducer(state, { type: 'CYCLE_CONNECTION', connectionIndex });
    pushStateSnapshot(cloneState(state));
    saveWithTime(next);
    dispatch({ type: 'CYCLE_CONNECTION', connectionIndex });
  });

  const onHint = useStableCallback(
    (hint: Extract<PuzzleHint, { puzzleType: PuzzleType.Hashi }>) => {
      if (isComplete) return;

      const { from, to } = hint;

      const connectionIndex = connections.findIndex((conn) => {
        const a = islands[conn.a];
        const b = islands[conn.b];
        const matchesForward =
          a.row === from.row && a.col === from.col && b.row === to.row && b.col === to.col;
        const matchesBackward =
          a.row === to.row && a.col === to.col && b.row === from.row && b.col === from.col;
        return matchesForward || matchesBackward;
      });

      if (connectionIndex < 0) return;

      const next = gameReducer(state, {
        type: 'APPLY_HINT',
        connectionIndex,
        bridges: hint.bridges,
      });
      clearSnapshots();
      saveWithTime(next);
      dispatch({ type: 'APPLY_HINT', connectionIndex, bridges: hint.bridges });
    },
  );

  const onIslandPress = useStableCallback(({ row, col }: { row: number; col: number }) => {
    if (lastIslandTapRef.current != null) {
      const { row: fromRow, col: fromCol } = lastIslandTapRef.current;

      const connectionIndex = connections.findIndex((conn) => {
        const a = islands[conn.a];
        const b = islands[conn.b];
        return (
          (a.row === fromRow && a.col === fromCol && b.row === row && b.col === col) ||
          (a.row === row && a.col === col && b.row === fromRow && b.col === fromCol)
        );
      });

      if (connectionIndex >= 0 && isValidBridge(connectionIndex)) {
        onConnectionTap(connectionIndex);
      }
    }

    lastIslandTapRef.current = { row, col };
  });

  const onClearPress = useStableCallback(() => {
    const nextState = gameReducer(state, {
      type: 'RESET',
      connectionCount: connections.length,
    });
    pushStateSnapshot(cloneState(state));
    saveWithTime(nextState);
    dispatch({ type: 'RESET', connectionCount: connections.length });
    lastIslandTapRef.current = null;
  });

  const onUndoPress = useStableCallback(() => {
    const previous = popStateSnapshot();
    if (previous == null) return;
    saveWithTime(previous);
    dispatch({ type: 'REPLACE', state: previous });
  });

  const currentState = useMemo(
    () => buildHashiCurrentState(connections, state.bridgeCounts, islands),
    [connections, state.bridgeCounts, islands],
  );

  const isHinted = useCallback(
    (connectionIndex: number): boolean => state.hintedConnections.includes(connectionIndex),
    [state.hintedConnections],
  );

  return {
    connections,
    bridgeCounts: state.bridgeCounts,
    isHinted,
    isComplete,
    isValidBridge,
    onConnectionTap,
    onClearPress,
    onHint,
    currentState,
    onIslandPress,
    isUndoEnabled: !isEmpty,
    onUndoPress,
  };
}
