import { useCallback, useEffect, useMemo, useReducer, useRef } from 'react';

import { z } from 'zod';

import { type HashiPuzzle, PuzzleType } from '@/api/puzzle/puzzle';
import { type PuzzleHint } from '@/api/puzzle/puzzleHint';
import { usePersistedGameState } from '@/hooks/game/usePersistedGameState';
import { useStableCallback } from '@/hooks/useStableCallback';
import { triggerHapticHard, triggerHapticLight } from '@/utils/hapticUtils';
import { findConnections } from '@/utils/hashi/connections';
import { wouldNewBridgeCrossExisting } from '@/utils/hashi/crossing';
import { isHashiComplete } from '@/utils/hashi/validation';

type GameState = number[];

type GameAction =
  | { type: 'CYCLE_CONNECTION'; connectionIndex: number }
  | { type: 'RESET'; connectionCount: number }
  | { type: 'SET_CONNECTION'; connectionIndex: number; bridges: number };

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
    case 'SET_CONNECTION': {
      const { connectionIndex, bridges } = action;
      const clamped = Math.max(0, Math.min(2, bridges));
      return state.map((v, i) => (i === connectionIndex ? clamped : v));
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
};

export type HashiOnSolve = (params: {
  hashiSolution: ReturnType<typeof buildHashiSolution>;
  durationMs: number;
  completedAt: Date;
  startedAt: Date;
}) => Promise<void>;

type HashiPersisted = {
  bridgeCounts: GameState;
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
    .filter((state) => state.bridges > 0);
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
    .filter((state) => state.bridges > 0);
}

export function useHashiGame({
  puzzle: { id: puzzleId, islands, attempt },
  onSolve,
}: {
  puzzle: HashiPuzzle;
  onSolve: HashiOnSolve;
}): HashiGame {
  const lastIslandTapRef = useRef<{ row: number; col: number } | null>(null);

  const stableOnSolve = useStableCallback(onSolve);
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
        elapsedMs: z.number().nonnegative(),
      }),
    [bridgeCountsSchema],
  );

  const { persistedState, saveState, clearState } = usePersistedGameState<HashiPersisted>({
    puzzleId,
    puzzleType: PuzzleType.Hashi,
    version: 1,
    schema: persistedSchema,
  });

  const [bridgeCounts, dispatch] = useReducer(
    gameReducer,
    { count: connections.length, persisted: persistedState?.bridgeCounts },
    ({ count, persisted }) => persisted ?? createInitialState(count),
  );
  const startedAtRef = useRef<Date>(
    persistedState != null
      ? new Date(Date.now() - persistedState.elapsedMs)
      : (attempt?.startedAt ?? new Date()),
  );
  const submittedRef = useRef(false);

  const isComplete = useMemo(
    () => isHashiComplete(islands, connections, bridgeCounts),
    [islands, connections, bridgeCounts],
  );

  const saveWithTime = (next: GameState) => {
    const elapsedMs = Date.now() - startedAtRef.current.getTime();
    saveState({ bridgeCounts: next, elapsedMs });
  };

  useEffect(() => {
    if (!isComplete || submittedRef.current) return;

    submittedRef.current = true;
    triggerHapticHard();
    const completedAt = new Date();
    const durationMs = completedAt.getTime() - startedAtRef.current.getTime();

    stableOnSolve({
      hashiSolution: buildHashiSolution(connections, bridgeCounts, islands),
      durationMs,
      completedAt,
      startedAt: startedAtRef.current,
    })
      .catch(() => {
        submittedRef.current = false;
      })
      .finally(() => {
        clearState();
      });
  }, [bridgeCounts, clearState, connections, islands, isComplete, stableOnSolve]);

  const isValidBridge = useCallback(
    (connectionIndex: number): boolean =>
      !wouldNewBridgeCrossExisting(connectionIndex, connections, bridgeCounts, islands),
    [connections, bridgeCounts, islands],
  );

  const onConnectionTap = useStableCallback((connectionIndex: number) => {
    triggerHapticLight();
    const next = gameReducer(bridgeCounts, { type: 'CYCLE_CONNECTION', connectionIndex });
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

      const next = gameReducer(bridgeCounts, {
        type: 'SET_CONNECTION',
        connectionIndex,
        bridges: hint.bridges,
      });
      saveWithTime(next);
      dispatch({ type: 'SET_CONNECTION', connectionIndex, bridges: hint.bridges });
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
    const nextState = gameReducer(bridgeCounts, {
      type: 'RESET',
      connectionCount: connections.length,
    });
    saveWithTime(nextState);
    dispatch({ type: 'RESET', connectionCount: connections.length });
    lastIslandTapRef.current = null;
  });

  const currentState = useMemo(
    () => buildHashiCurrentState(connections, bridgeCounts, islands),
    [connections, bridgeCounts, islands],
  );

  return {
    connections,
    bridgeCounts,
    isComplete,
    isValidBridge,
    onConnectionTap,
    onClearPress,
    onHint,
    currentState,
    onIslandPress,
  };
}
