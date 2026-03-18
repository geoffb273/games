import { State } from 'react-native-gesture-handler';
import { fireGestureHandler, getByGestureTestId } from 'react-native-gesture-handler/jest-utils';

import { render, screen, waitFor } from '@testing-library/react-native';

import { HanjiCell } from '@/components/game/HanjiBoard/HanjiCell';

const mockTheme = {
  text: '#111',
  backgroundSelected: '#ddd',
  backgroundElement: '#eee',
};

jest.mock('@/hooks/useTheme', () => ({
  useTheme: () => mockTheme,
}));

const defaultProps = {
  size: 40,
  onTap: jest.fn(),
  onLongPress: jest.fn(),
  isLastInWave: false,
};

describe('HanjiCell', () => {
  it('renders empty cell without mark text', () => {
    render(<HanjiCell {...defaultProps} row={0} col={1} state="empty" />);
    expect(screen.queryByText('✕')).not.toBeOnTheScreen();
  });

  it('renders filled cell without mark text', () => {
    render(<HanjiCell {...defaultProps} row={1} col={2} state="filled" />);
    expect(screen.queryByText('✕')).not.toBeOnTheScreen();
  });

  it('renders marked cell with ✕', () => {
    render(<HanjiCell {...defaultProps} row={2} col={0} state="marked" />);
    expect(screen.getByText('✕')).toBeOnTheScreen();
  });

  it('calls onTap with row and col when tap gesture fires', async () => {
    const onTap = jest.fn();
    render(<HanjiCell {...defaultProps} row={3} col={4} state="empty" onTap={onTap} />);
    fireGestureHandler(getByGestureTestId('hanji-cell-tap'), [
      { state: State.BEGAN },
      { state: State.ACTIVE },
      { state: State.END },
    ]);
    await waitFor(() => {
      expect(onTap).toHaveBeenCalledTimes(1);
      expect(onTap).toHaveBeenCalledWith(3, 4);
    });
  });

  it('calls onLongPress with row and col when long press fires', async () => {
    const onLongPress = jest.fn();
    render(<HanjiCell {...defaultProps} row={1} col={2} state="empty" onLongPress={onLongPress} />);
    fireGestureHandler(getByGestureTestId('hanji-cell-longpress'), [
      { state: State.BEGAN },
      { state: State.ACTIVE },
      { state: State.END },
    ]);
    await waitFor(() => {
      expect(onLongPress).toHaveBeenCalledTimes(1);
      expect(onLongPress).toHaveBeenCalledWith(1, 2);
    });
  });

  it('calls onWaveComplete when completion wave animation completes for last cell', () => {
    jest.useFakeTimers();
    const onWaveComplete = jest.fn();

    render(
      <HanjiCell
        {...defaultProps}
        row={0}
        col={0}
        state="filled"
        completionWaveActive
        isLastInWave
        onWaveComplete={onWaveComplete}
      />,
    );

    jest.runAllTimers();

    expect(onWaveComplete).toHaveBeenCalledTimes(1);
    jest.useRealTimers();
  });
});
