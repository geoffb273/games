import { act, renderHook } from '@testing-library/react-native';

import { type HashiPuzzle, PuzzleType } from '@/api/puzzle/puzzle';
import { type PuzzleHint } from '@/api/puzzle/puzzleHint';
import { useHashiGame } from '@/hooks/game/useHashiGame';
import { findConnections, type HashiConnection } from '@/utils/hashi/connections';
import { wouldNewBridgeCrossExisting } from '@/utils/hashi/crossing';
import { isHashiComplete } from '@/utils/hashi/validation';

jest.mock('@/context/PlaytimeClockContext', () => {
  return {
    usePlaytimeClockContext: () => ({
      getElapsedMs: () => 0,
      getSolveTiming: (completedAt: Date) => ({
        durationMs: 0,
        startedAt: new Date(completedAt.getTime()),
      }),
      replaceAccumulatedMs: jest.fn(),
      pause: jest.fn(),
      resume: jest.fn(),
    }),
  };
});

jest.mock('@/hooks/game/usePersistedGameState', () => {
  return {
    usePersistedGameState: jest.fn(() => ({
      persistedState: null,
      saveState: jest.fn(),
      clearState: jest.fn(),
    })),
  };
});

jest.mock('@/utils/hapticUtils', () => ({
  triggerHapticHard: jest.fn(),
  triggerHapticLight: jest.fn(),
}));

jest.mock('@/utils/hashi/connections');
jest.mock('@/utils/hashi/crossing');
jest.mock('@/utils/hashi/validation');

describe('useHashiGame', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(isHashiComplete).mockReturnValue(false);
  });

  const islands = [
    { row: 0, col: 0, requiredBridges: 1 },
    { row: 0, col: 1, requiredBridges: 1 },
  ];

  const mockConnections: HashiConnection[] = [{ a: 0, b: 1, isHorizontal: true }];

  function createPuzzle(): HashiPuzzle {
    return {
      id: 'test-puzzle',
      dailyChallengeId: 'test-daily-challenge',
      width: 2,
      height: 1,
      islands,
      attempt: null,
      description: 'Test puzzle',
      name: 'Test puzzle',
      type: PuzzleType.Hashi,
    };
  }

  it('initializes bridgeCounts with connection length and isComplete false', () => {
    jest.mocked(findConnections).mockReturnValue(mockConnections as any);
    jest.mocked(wouldNewBridgeCrossExisting).mockReturnValue(false);

    const puzzle = createPuzzle();
    const onSolve = jest.fn().mockResolvedValue(undefined);

    const { result } = renderHook(() => useHashiGame({ puzzle, onSolve }));

    expect(result.current.connections).toHaveLength(1);
    expect(result.current.bridgeCounts).toHaveLength(1);
    expect(result.current.bridgeCounts[0]).toBe(0);
    expect(result.current.isComplete).toBe(false);
  });

  it('cycles a connection on tap and saves state', async () => {
    jest.mocked(findConnections).mockReturnValue(mockConnections as any);
    jest.mocked(wouldNewBridgeCrossExisting).mockReturnValue(false);

    const puzzle = createPuzzle();
    const onSolve = jest.fn().mockResolvedValue(undefined);

    const { result } = renderHook(() => useHashiGame({ puzzle, onSolve }));

    await act(async () => {
      result.current.onConnectionTap(0);
    });

    expect(result.current.bridgeCounts[0]).toBe(1);
    expect(result.current.isComplete).toBe(false);
    expect(onSolve).not.toHaveBeenCalled();
  });

  it('applies a hint and saves state via onHint', async () => {
    jest.mocked(findConnections).mockReturnValue(mockConnections as any);
    jest.mocked(wouldNewBridgeCrossExisting).mockReturnValue(false);

    const puzzle = createPuzzle();
    const onSolve = jest.fn().mockResolvedValue(undefined);

    const { result } = renderHook(() => useHashiGame({ puzzle, onSolve }));

    const hint: Extract<PuzzleHint, { puzzleType: PuzzleType.Hashi }> = {
      puzzleType: PuzzleType.Hashi,
      from: { row: 0, col: 0 },
      to: { row: 0, col: 1 },
      bridges: 2,
    } satisfies PuzzleHint;

    await act(async () => {
      result.current.onHint(hint);
    });

    expect(result.current.bridgeCounts[0]).toBe(2);
    expect(result.current.isComplete).toBe(false);
    expect(onSolve).not.toHaveBeenCalled();
  });

  it('isValidBridge returns true when no crossing would occur', () => {
    jest.mocked(findConnections).mockReturnValue(mockConnections);
    jest.mocked(wouldNewBridgeCrossExisting).mockReturnValue(false);

    const puzzle = createPuzzle();
    const onSolve = jest.fn().mockResolvedValue(undefined);

    const { result } = renderHook(() => useHashiGame({ puzzle, onSolve }));

    expect(result.current.isValidBridge(0)).toBe(true);
  });

  it('isValidBridge returns false when a crossing would occur', () => {
    jest.mocked(findConnections).mockReturnValue(mockConnections);
    jest.mocked(wouldNewBridgeCrossExisting).mockReturnValue(true);

    const puzzle = createPuzzle();
    const onSolve = jest.fn().mockResolvedValue(undefined);

    const { result } = renderHook(() => useHashiGame({ puzzle, onSolve }));

    expect(result.current.isValidBridge(0)).toBe(false);
  });

  it('calls onSolve when the puzzle is solved and returns isComplete', async () => {
    jest.mocked(findConnections).mockReturnValue(mockConnections as any);
    jest.mocked(wouldNewBridgeCrossExisting).mockReturnValue(false);

    const puzzle = createPuzzle();
    const onSolve = jest.fn().mockResolvedValue(undefined);
    jest.mocked(isHashiComplete).mockReturnValue(true);

    const { result } = renderHook(() => useHashiGame({ puzzle, onSolve }));

    expect(result.current.isComplete).toBe(true);
    expect(onSolve).toHaveBeenCalled();
  });
});
