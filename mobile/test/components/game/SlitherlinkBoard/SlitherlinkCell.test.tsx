import { fireEvent, render, screen } from '@testing-library/react-native';

import { SlitherlinkCell } from '@/components/game/SlitherlinkBoard/SlitherlinkCell';

const mockTheme = {
  text: '#111',
};

jest.mock('@/hooks/useTheme', () => ({
  useTheme: () => mockTheme,
}));

const defaultProps = {
  size: 48,
  clue: null as number | null,
  top: 'empty' as const,
  left: 'empty' as const,
  bottom: 'empty' as const,
  right: 'empty' as const,
  onPressTop: jest.fn(),
  onPressLeft: jest.fn(),
  onPressBottom: jest.fn(),
  onPressRight: jest.fn(),
  showBottomEdge: true,
  showRightEdge: true,
};

describe('SlitherlinkCell', () => {
  it('renders without a clue and shows no number', () => {
    render(<SlitherlinkCell {...defaultProps} clue={null} />);
    expect(screen.queryByText('0')).not.toBeOnTheScreen();
    expect(screen.queryByText('1')).not.toBeOnTheScreen();
  });

  it('renders clue when provided', () => {
    render(<SlitherlinkCell {...defaultProps} clue={3} />);
    expect(screen.getByText('3')).toBeOnTheScreen();
  });

  it('renders clue when lines exceed clue (error state still shows number)', () => {
    render(
      <SlitherlinkCell
        {...defaultProps}
        clue={2}
        top="line"
        left="line"
        bottom="line"
        right="line"
      />,
    );
    expect(screen.getByText('2')).toBeOnTheScreen();
  });

  it('does not render right edge pressable when showRightEdge is false', () => {
    render(<SlitherlinkCell {...defaultProps} showRightEdge={false} />);
    expect(screen.queryByTestId('slitherlink-cell-edge-right')).not.toBeOnTheScreen();
  });

  it('does not render bottom edge pressable when showBottomEdge is false', () => {
    render(<SlitherlinkCell {...defaultProps} showBottomEdge={false} />);
    expect(screen.queryByTestId('slitherlink-cell-edge-bottom')).not.toBeOnTheScreen();
  });

  it('calls onPressTop when top edge is pressed', () => {
    const onPressTop = jest.fn();
    render(<SlitherlinkCell {...defaultProps} onPressTop={onPressTop} />);
    fireEvent.press(screen.getByTestId('slitherlink-cell-edge-top'));
    expect(onPressTop).toHaveBeenCalledTimes(1);
  });

  it('calls onPressLeft when left edge is pressed', () => {
    const onPressLeft = jest.fn();
    render(<SlitherlinkCell {...defaultProps} onPressLeft={onPressLeft} />);
    fireEvent.press(screen.getByTestId('slitherlink-cell-edge-left'));
    expect(onPressLeft).toHaveBeenCalledTimes(1);
  });

  it('calls onPressRight when right edge is pressed', () => {
    const onPressRight = jest.fn();
    render(<SlitherlinkCell {...defaultProps} onPressRight={onPressRight} />);
    fireEvent.press(screen.getByTestId('slitherlink-cell-edge-right'));
    expect(onPressRight).toHaveBeenCalledTimes(1);
  });

  it('calls onPressBottom when bottom edge is pressed', () => {
    const onPressBottom = jest.fn();
    render(<SlitherlinkCell {...defaultProps} onPressBottom={onPressBottom} />);
    fireEvent.press(screen.getByTestId('slitherlink-cell-edge-bottom'));
    expect(onPressBottom).toHaveBeenCalledTimes(1);
  });

  it('calls onWaveComplete when completion wave animation completes for last cell', () => {
    jest.useFakeTimers();
    const onWaveComplete = jest.fn();

    render(
      <SlitherlinkCell
        {...defaultProps}
        isCompletionWaveActive
        waveDelayNumber={0}
        isLastInWave
        onWaveComplete={onWaveComplete}
      />,
    );

    jest.runAllTimers();

    expect(onWaveComplete).toHaveBeenCalledTimes(1);
    jest.useRealTimers();
  });
});
