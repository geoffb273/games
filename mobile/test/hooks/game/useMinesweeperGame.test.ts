import { act, renderHook } from '@testing-library/react-native';

import { type MinesweeperPuzzle, PuzzleType } from '@/api/puzzle/puzzle';
import { type PuzzleHint } from '@/api/puzzle/puzzleHint';
import { buildMinesweeperSolution, useMinesweeperGame } from '@/hooks/game/useMinesweeperGame';
import { getCellsToReveal } from '@/utils/minesweeper/reveal';

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

jest.mock('@/utils/minesweeper/reveal');

describe('useMinesweeperGame', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  function createPuzzle(): MinesweeperPuzzle {
    return {
      id: 'test-puzzle',
      dailyChallengeId: 'test-daily-challenge',
      width: 2,
      height: 2,
      mineCount: 1,
      mineField: [
        [0, 'MINE'],
        [0, 0],
      ],
      revealedCells: [],
      attempt: null,
      description: 'Test puzzle',
      name: 'Test puzzle',
      type: PuzzleType.Minesweeper,
    };
  }

  it('initializes cells and remaining mines from puzzle size', () => {
    const puzzle = createPuzzle();
    const onSolve = jest.fn().mockResolvedValue(undefined);

    const { result } = renderHook(() => useMinesweeperGame({ puzzle, onSolve }));

    expect(result.current.cells).toHaveLength(2);
    expect(result.current.cells[0]).toHaveLength(2);
    expect(result.current.remaining).toBe(puzzle.mineCount);
    expect(result.current.isWin).toBe(false);
    expect(result.current.isLoss).toBe(false);
  });

  it('toggles a flag on tap in flag mode and updates remaining', async () => {
    const puzzle = createPuzzle();
    const onSolve = jest.fn().mockResolvedValue(undefined);

    const { result } = renderHook(() => useMinesweeperGame({ puzzle, onSolve }));

    await act(async () => {
      result.current.onCellTap(0, 0);
    });

    expect(result.current.cells[0][0]).toBe('flagged');
    expect(result.current.remaining).toBe(puzzle.mineCount - 1);
    expect(result.current.isWin).toBe(false);
    expect(result.current.isLoss).toBe(false);
    expect(onSolve).not.toHaveBeenCalled();
  });

  it('reveals cells on tap in reveal mode and does not end game when no mine is hit', async () => {
    const puzzle = createPuzzle();
    const onSolve = jest.fn().mockResolvedValue(undefined);

    jest.mocked(getCellsToReveal).mockReturnValue({
      hitMine: false,
      cells: [{ row: 0, col: 0, value: 0 }],
    });

    const { result } = renderHook(() => useMinesweeperGame({ puzzle, onSolve }));

    await act(async () => {
      result.current.toggleMode(); // switch to reveal mode
    });

    await act(async () => {
      result.current.onCellTap(0, 0);
    });

    expect(result.current.revealedMap.has('0,0')).toBe(true);
    expect(result.current.isWin).toBe(false);
    expect(result.current.isLoss).toBe(false);
    expect(onSolve).not.toHaveBeenCalled();
  });

  it('sets game over when a mine is revealed', async () => {
    const puzzle = createPuzzle();
    const onSolve = jest.fn().mockResolvedValue(undefined);

    jest.mocked(getCellsToReveal).mockReturnValue({
      hitMine: true,
      cells: [],
    });

    const { result } = renderHook(() => useMinesweeperGame({ puzzle, onSolve }));

    await act(async () => {
      result.current.toggleMode(); // switch to reveal mode
    });

    await act(async () => {
      result.current.onCellTap(0, 1);
    });

    expect(result.current.isWin).toBe(false);
    expect(result.current.isLoss).toBe(true);
    expect(onSolve).toHaveBeenCalled();
  });

  it('applies a mine hint by flagging and a safe hint by revealing', async () => {
    const puzzle = createPuzzle();
    const onSolve = jest.fn().mockResolvedValue(undefined);

    jest.mocked(getCellsToReveal).mockReturnValue({
      hitMine: false,
      cells: [{ row: 1, col: 0, value: 0 }],
    });

    const { result } = renderHook(() => useMinesweeperGame({ puzzle, onSolve }));

    const mineHint: Extract<PuzzleHint, { puzzleType: PuzzleType.Minesweeper }> = {
      puzzleType: PuzzleType.Minesweeper,
      row: 0,
      col: 1,
      isMine: true,
    } satisfies PuzzleHint;

    const safeHint: Extract<PuzzleHint, { puzzleType: PuzzleType.Minesweeper }> = {
      puzzleType: PuzzleType.Minesweeper,
      row: 1,
      col: 0,
      isMine: false,
    } satisfies PuzzleHint;

    await act(async () => {
      result.current.onHint(mineHint);
    });

    expect(result.current.cells[0][1]).toBe('flagged');

    await act(async () => {
      result.current.onHint(safeHint);
    });

    expect(result.current.revealedMap.has('1,0')).toBe(true);
  });

  it('calls onSolve when the puzzle is completed successfully', async () => {
    const basePuzzle = createPuzzle();
    const puzzle: MinesweeperPuzzle = {
      ...basePuzzle,
      // All non-mine cells are revealed, which should trigger a win
      revealedCells: [
        { row: 0, col: 0, value: 0 },
        { row: 1, col: 0, value: 0 },
        { row: 1, col: 1, value: 0 },
      ],
    };
    const onSolve = jest.fn().mockResolvedValue(undefined);

    renderHook(() => useMinesweeperGame({ puzzle, onSolve }));

    expect(onSolve).toHaveBeenCalled();
  });

  it('buildMinesweeperSolution maps mines correctly', () => {
    const puzzle = createPuzzle();

    const solution = buildMinesweeperSolution(puzzle.mineField);

    expect(solution).toEqual([
      [false, true],
      [false, false],
    ]);
  });
});
