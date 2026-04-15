import { State } from 'react-native-gesture-handler';
import { fireGestureHandler, getByGestureTestId } from 'react-native-gesture-handler/jest-utils';

import { render, screen, waitFor } from '@testing-library/react-native';

import { MinesweeperCell } from '@/components/game/MinesweeperBoard/MinesweeperCell';

const mockTheme = {
  background: '#f5f5f5',
  backgroundElement: '#e0e0e0',
  backgroundSelected: '#ddd',
  text: '#111',
};

jest.mock('@/hooks/useTheme', () => ({
  useTheme: () => mockTheme,
}));

const defaultProps = {
  row: 0,
  col: 0,
  size: 40,
  isRevealed: false,
  isFlagged: false,
  value: null as number | null,
  isTriggeredMine: false,
  onTap: jest.fn(),
  onLongPress: jest.fn(),
};

describe('MinesweeperCell', () => {
  it('renders unrevealed unflagged cell with no content', () => {
    render(<MinesweeperCell {...defaultProps} />);
    expect(screen.queryByText('▲')).not.toBeOnTheScreen();
    expect(screen.queryByText('1')).not.toBeOnTheScreen();
  });

  it('renders revealed cell with number when value > 0', () => {
    render(<MinesweeperCell {...defaultProps} isRevealed value={3} />);
    expect(screen.getByText('3')).toBeOnTheScreen();
  });

  it('renders revealed cell with value 1', () => {
    render(<MinesweeperCell {...defaultProps} isRevealed value={1} />);
    expect(screen.getByText('1')).toBeOnTheScreen();
  });

  it('does not show number when revealed but value is 0', () => {
    render(<MinesweeperCell {...defaultProps} isRevealed value={0} />);
    expect(screen.queryByText('0')).not.toBeOnTheScreen();
  });

  it('does not show number when revealed but value is null', () => {
    render(<MinesweeperCell {...defaultProps} isRevealed value={null} />);
    expect(screen.queryByText('0')).not.toBeOnTheScreen();
  });

  it('renders flagged cell with flag symbol', () => {
    render(<MinesweeperCell {...defaultProps} isFlagged />);
    expect(screen.getByText('▲')).toBeOnTheScreen();
  });

  it('calls onTap with row and col when tap gesture fires', async () => {
    const onTap = jest.fn();
    render(<MinesweeperCell {...defaultProps} row={2} col={3} onTap={onTap} />);
    fireGestureHandler(getByGestureTestId('minesweeper-cell-tap'), [
      { state: State.BEGAN },
      { state: State.ACTIVE },
      { state: State.END },
    ]);
    await waitFor(() => {
      expect(onTap).toHaveBeenCalledTimes(1);
      expect(onTap).toHaveBeenCalledWith(2, 3);
    });
  });

  it('calls onLongPress with row and col when long press fires', async () => {
    const onLongPress = jest.fn();
    render(<MinesweeperCell {...defaultProps} row={1} col={4} onLongPress={onLongPress} />);
    fireGestureHandler(getByGestureTestId('minesweeper-cell-longpress'), [
      { state: State.BEGAN },
      { state: State.ACTIVE },
      { state: State.END },
    ]);
    await waitFor(() => {
      expect(onLongPress).toHaveBeenCalledTimes(1);
      expect(onLongPress).toHaveBeenCalledWith(1, 4);
    });
  });

  it('calls onWaveComplete when explosion animation completes for last cell', () => {
    jest.useFakeTimers();
    const onWaveComplete = jest.fn();

    render(
      <MinesweeperCell
        {...defaultProps}
        row={0}
        col={0}
        isRevealed
        value={0}
        isCompletionAnimationActive
        isLastInWave
        completionAnimationType="explosion"
        onWaveComplete={onWaveComplete}
      />,
    );

    jest.runAllTimers();

    expect(onWaveComplete).toHaveBeenCalledTimes(1);
    jest.useRealTimers();
  });

  it('calls onWaveComplete when wave animation completes for last cell', () => {
    jest.useFakeTimers();
    const onWaveComplete = jest.fn();

    render(
      <MinesweeperCell
        {...defaultProps}
        row={1}
        col={2}
        isRevealed
        value={0}
        isCompletionAnimationActive
        isLastInWave
        completionAnimationType="wave"
        onWaveComplete={onWaveComplete}
      />,
    );

    jest.runAllTimers();

    expect(onWaveComplete).toHaveBeenCalledTimes(1);
    jest.useRealTimers();
  });
});
