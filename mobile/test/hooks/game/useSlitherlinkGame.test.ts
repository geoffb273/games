import { act, renderHook } from '@testing-library/react-native';

import { PuzzleType, type SlitherlinkPuzzle } from '@/api/puzzle/puzzle';
import { type PuzzleHint } from '@/api/puzzle/puzzleHint';
import { useSlitherlinkGame } from '@/hooks/game/useSlitherlinkGame';
import { isSlitherlinkComplete } from '@/utils/slitherlink/validation';

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

jest.mock('@/utils/slitherlink/validation');

describe('useSlitherlinkGame', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(isSlitherlinkComplete).mockReturnValue(false);
  });

  function createPuzzle(width: number, height: number) {
    return {
      id: 'test-puzzle',
      width,
      height,
      clues: Array.from({ length: height }, () => Array.from({ length: width }, () => null)),
      attempt: null,
      description: 'Test puzzle',
      name: 'Test puzzle',
      type: PuzzleType.Slitherlink,
    } satisfies SlitherlinkPuzzle;
  }

  it('creates grids with expected dimensions from puzzle size', async () => {
    const puzzle = createPuzzle(2, 3);
    const onSolve = jest.fn().mockResolvedValue(undefined);

    const { result } = renderHook(() => useSlitherlinkGame({ puzzle, onSolve }));

    expect(result.current.horizontal).toHaveLength(3 + 1);
    expect(result.current.horizontal[0]).toHaveLength(2);

    expect(result.current.vertical).toHaveLength(3);
    expect(result.current.vertical[0]).toHaveLength(2 + 1);
    expect(onSolve).not.toHaveBeenCalled();
    expect(result.current.isComplete).toBe(false);
  });

  it('toggles a horizontal edge and saves state when pressed', async () => {
    const puzzle = createPuzzle(2, 2);
    const onSolve = jest.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useSlitherlinkGame({ puzzle, onSolve }));

    await act(async () => {
      result.current.onHorizontalEdgePress(0, 0);
    });

    expect(result.current.horizontal[0][0]).toBe('line');
    expect(onSolve).not.toHaveBeenCalled();
    expect(result.current.isComplete).toBe(false);
  });

  it('toggles a vertical edge and saves state when pressed', async () => {
    const puzzle = createPuzzle(2, 2);
    const onSolve = jest.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useSlitherlinkGame({ puzzle, onSolve }));

    await act(async () => {
      result.current.onVerticalEdgePress(0, 0);
    });

    expect(result.current.vertical[0][0]).toBe('line');
    expect(onSolve).not.toHaveBeenCalled();
    expect(result.current.isComplete).toBe(false);
  });

  it('applies a hint and saves state via onHint', async () => {
    const puzzle = createPuzzle(2, 2);
    const onSolve = jest.fn().mockResolvedValue(undefined);

    const { result } = renderHook(() => useSlitherlinkGame({ puzzle, onSolve }));

    const hint: Extract<PuzzleHint, { puzzleType: PuzzleType.Slitherlink }> = {
      puzzleType: PuzzleType.Slitherlink,
      row: 0,
      col: 0,
      edgeType: 'HORIZONTAL',
      filled: true,
    } satisfies PuzzleHint;

    await act(async () => {
      result.current.onHint(hint);
    });

    expect(result.current.horizontal[0][0]).toBe('line');
    expect(onSolve).not.toHaveBeenCalled();
    expect(result.current.isComplete).toBe(false);
  });

  it('calls onSolve when the puzzle is solved and returns the isComplete', async () => {
    const puzzle = createPuzzle(2, 2);
    const onSolve = jest.fn().mockResolvedValue(undefined);
    jest.mocked(isSlitherlinkComplete).mockReturnValue(true);

    const { result } = renderHook(() => useSlitherlinkGame({ puzzle, onSolve }));

    expect(result.current.isComplete).toBe(true);
    expect(onSolve).toHaveBeenCalled();
  });
});
