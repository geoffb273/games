import { act, renderHook } from '@testing-library/react-native';

import { type HanjiPuzzle, PuzzleType } from '@/api/puzzle/puzzle';
import { type PuzzleHint } from '@/api/puzzle/puzzleHint';
import { useHanjiGame } from '@/hooks/game/useHanjiGame';
import { isPuzzleComplete } from '@/utils/hanji/lineValidation';

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
  triggerHapticMedium: jest.fn(),
}));

jest.mock('@/utils/hanji/lineValidation');

describe('useHanjiGame', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(isPuzzleComplete).mockReturnValue(false);
  });

  function createPuzzle(width: number, height: number): HanjiPuzzle {
    return {
      id: 'test-puzzle',
      dailyChallengeId: 'test-daily-challenge',
      width,
      height,
      rowClues: Array.from({ length: height }, () => Array.from({ length: width }, () => 0)),
      colClues: Array.from({ length: width }, () => Array.from({ length: height }, () => 0)),
      attempt: null,
      description: 'Test puzzle',
      name: 'Test puzzle',
      type: PuzzleType.Hanji,
    };
  }

  it('creates a grid with expected dimensions from puzzle size', () => {
    const puzzle = createPuzzle(2, 3);
    const onSolve = jest.fn().mockResolvedValue(undefined);

    const { result } = renderHook(() => useHanjiGame({ puzzle, onSolve }));

    expect(result.current.cells).toHaveLength(3);
    expect(result.current.cells[0]).toHaveLength(2);
    expect(result.current.isComplete).toBe(false);
  });

  it('cycles a cell state on tap and saves state', async () => {
    const puzzle = createPuzzle(2, 2);
    const onSolve = jest.fn().mockResolvedValue(undefined);

    const { result } = renderHook(() => useHanjiGame({ puzzle, onSolve }));

    await act(async () => {
      result.current.onCellTap(0, 0);
    });

    expect(result.current.cells[0][0]).toBe('filled');
    expect(result.current.isComplete).toBe(false);
    expect(onSolve).not.toHaveBeenCalled();

    await act(async () => {
      result.current.onCellTap(0, 0);
    });

    expect(result.current.cells[0][0]).toBe('marked');
    expect(result.current.isComplete).toBe(false);
    expect(onSolve).not.toHaveBeenCalled();
  });

  it('marks a cell on long press and saves state', async () => {
    const puzzle = createPuzzle(2, 2);
    const onSolve = jest.fn().mockResolvedValue(undefined);

    const { result } = renderHook(() => useHanjiGame({ puzzle, onSolve }));

    await act(async () => {
      result.current.onCellLongPress(0, 0);
    });

    expect(result.current.cells[0][0]).toBe('marked');
    expect(result.current.isComplete).toBe(false);
    expect(onSolve).not.toHaveBeenCalled();
  });

  it('applies a hint and saves state via onHint', async () => {
    const puzzle = createPuzzle(2, 2);
    const onSolve = jest.fn().mockResolvedValue(undefined);

    const { result } = renderHook(() => useHanjiGame({ puzzle, onSolve }));

    const hint: Extract<PuzzleHint, { puzzleType: PuzzleType.Hanji }> = {
      puzzleType: PuzzleType.Hanji,
      row: 0,
      col: 0,
      value: 1,
    } satisfies PuzzleHint;

    await act(async () => {
      result.current.onHint(hint);
    });

    expect(result.current.cells[0][0]).toBe('filled');
    expect(result.current.isComplete).toBe(false);
    expect(onSolve).not.toHaveBeenCalled();
  });

  it('locks the hinted cell so taps and long presses cannot change it', async () => {
    const puzzle = createPuzzle(2, 2);
    const onSolve = jest.fn().mockResolvedValue(undefined);

    const { result } = renderHook(() => useHanjiGame({ puzzle, onSolve }));

    const hint: Extract<PuzzleHint, { puzzleType: PuzzleType.Hanji }> = {
      puzzleType: PuzzleType.Hanji,
      row: 0,
      col: 0,
      value: 1,
    } satisfies PuzzleHint;

    await act(async () => {
      result.current.onHint(hint);
    });

    expect(result.current.cells[0][0]).toBe('filled');

    await act(async () => {
      result.current.onCellTap(0, 0);
    });
    expect(result.current.cells[0][0]).toBe('filled');

    await act(async () => {
      result.current.onCellLongPress(0, 0);
    });
    expect(result.current.cells[0][0]).toBe('filled');

    await act(async () => {
      result.current.onCellTap(1, 1);
    });
    expect(result.current.cells[1][1]).toBe('filled');
  });

  it('disables undo immediately after a hint', async () => {
    const puzzle = createPuzzle(2, 2);
    const onSolve = jest.fn().mockResolvedValue(undefined);

    const { result } = renderHook(() => useHanjiGame({ puzzle, onSolve }));

    await act(async () => {
      result.current.onCellTap(1, 1);
    });
    expect(result.current.isUndoEnabled).toBe(true);

    const hint: Extract<PuzzleHint, { puzzleType: PuzzleType.Hanji }> = {
      puzzleType: PuzzleType.Hanji,
      row: 0,
      col: 0,
      value: 1,
    } satisfies PuzzleHint;

    await act(async () => {
      result.current.onHint(hint);
    });

    expect(result.current.isUndoEnabled).toBe(false);
  });

  it('calls onSolve when the puzzle is solved and returns isComplete', async () => {
    const puzzle = createPuzzle(2, 2);
    const onSolve = jest.fn().mockResolvedValue(undefined);
    jest.mocked(isPuzzleComplete).mockReturnValue(true);

    const { result } = renderHook(() => useHanjiGame({ puzzle, onSolve }));

    expect(result.current.isComplete).toBe(true);
    expect(onSolve).toHaveBeenCalled();
  });
});
