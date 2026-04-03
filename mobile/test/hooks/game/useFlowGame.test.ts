import { act, renderHook } from '@testing-library/react-native';

import { type FlowPuzzle, PuzzleType } from '@/api/puzzle/puzzle';
import { useFlowGame } from '@/hooks/game/useFlowGame';
import { isFlowComplete } from '@/utils/flow/validation';

jest.mock('@/context/PlaytimeClockContext', () => {
  const actual = jest.requireActual<typeof import('@/context/PlaytimeClockContext')>(
    '@/context/PlaytimeClockContext',
  );
  return {
    ...actual,
    usePlaytimeClock: () => ({
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

jest.mock('@/utils/flow/validation');

describe('useFlowGame', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(isFlowComplete).mockReturnValue(false);
  });

  function createPuzzle(): FlowPuzzle {
    return {
      id: 'test-puzzle',
      dailyChallengeId: 'test-daily-challenge',
      width: 2,
      height: 2,
      pairs: [
        {
          number: 1,
          ends: [
            { row: 0, col: 0 },
            { row: 1, col: 1 },
          ],
        },
      ],
      attempt: null,
      description: 'Test puzzle',
      name: 'Test puzzle',
      type: PuzzleType.Flow,
    };
  }

  it('initializes grid with expected dimensions', () => {
    const puzzle = createPuzzle();
    const onSolve = jest.fn().mockResolvedValue(undefined);

    const { result } = renderHook(() => useFlowGame({ puzzle, onSolve }));

    expect(result.current.grid).toHaveLength(2);
    expect(result.current.grid[0]).toHaveLength(2);
    expect(result.current.isComplete).toBe(false);
  });

  it('sets a cell value and saves state', async () => {
    const puzzle = createPuzzle();
    const onSolve = jest.fn().mockResolvedValue(undefined);

    const { result } = renderHook(() => useFlowGame({ puzzle, onSolve }));

    await act(async () => {
      result.current.setCell(0, 0, 1);
    });

    expect(result.current.grid[0][0]).toBe(1);
    expect(result.current.isComplete).toBe(false);
    expect(onSolve).not.toHaveBeenCalled();
  });

  it('clears a path for a pair and saves state', async () => {
    const puzzle = createPuzzle();
    const onSolve = jest.fn().mockResolvedValue(undefined);

    const { result } = renderHook(() => useFlowGame({ puzzle, onSolve }));

    await act(async () => {
      result.current.setCell(0, 0, 1);
      result.current.setCell(0, 1, 1);
    });

    await act(async () => {
      result.current.clearPathForPair(1);
    });

    expect(result.current.grid[0][0]).toBe(0);
    expect(result.current.grid[0][1]).toBe(0);
    expect(onSolve).not.toHaveBeenCalled();
  });

  it('calls onSolve when the puzzle is solved and returns isComplete', async () => {
    const puzzle = createPuzzle();
    const onSolve = jest.fn().mockResolvedValue(undefined);
    jest.mocked(isFlowComplete).mockReturnValue(true);

    const { result } = renderHook(() => useFlowGame({ puzzle, onSolve }));

    expect(result.current.isComplete).toBe(true);
    expect(onSolve).toHaveBeenCalled();
  });
});
