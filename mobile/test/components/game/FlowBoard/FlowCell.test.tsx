import { render, screen } from '@testing-library/react-native';

import { FlowCell } from '@/components/game/FlowBoard/FlowCell';

const mockTheme = {
  backgroundElement: '#e0e0e0',
  borderSubtle: '#ccc',
};

jest.mock('@/hooks/useTheme', () => ({
  useTheme: () => mockTheme,
}));

const mockUseColorBlindEnabled = jest.fn(() => false);
jest.mock('@/store/colorBlindStore', () => ({
  useColorBlindEnabled: () => mockUseColorBlindEnabled(),
}));

const defaultProps = {
  size: 40,
  pairNumber: null,
  cellValue: 0,
  color: '#ff0000',
  row: 0,
  col: 0,
  isCompletionWaveActive: false,
  isLastInWave: false,
  onWaveComplete: jest.fn(),
};

describe('FlowCell', () => {
  beforeEach(() => {
    mockUseColorBlindEnabled.mockReturnValue(false);
  });

  it('does not show a number for empty cell when not color blind', () => {
    render(<FlowCell {...defaultProps} />);
    expect(screen.queryByText('0')).not.toBeOnTheScreen();
  });

  it('does not show a number for filled non-endpoint cell when not color blind', () => {
    render(<FlowCell {...defaultProps} cellValue={1} />);
    expect(screen.queryByText('1')).not.toBeOnTheScreen();
  });

  it('shows pair number for endpoint cell', () => {
    render(<FlowCell {...defaultProps} pairNumber={3} />);
    expect(screen.getByText('3')).toBeOnTheScreen();
  });

  it('shows cell value for endpoint when pairNumber is same as cellValue', () => {
    render(<FlowCell {...defaultProps} pairNumber={2} cellValue={2} />);
    expect(screen.getByText('2')).toBeOnTheScreen();
  });

  it('shows number for filled cell when color blind mode is enabled', () => {
    mockUseColorBlindEnabled.mockReturnValue(true);
    render(<FlowCell {...defaultProps} pairNumber={null} cellValue={2} />);
    expect(screen.getByText('2')).toBeOnTheScreen();
  });

  it('does not show number for empty cell when color blind', () => {
    mockUseColorBlindEnabled.mockReturnValue(true);
    render(<FlowCell {...defaultProps} pairNumber={null} cellValue={0} />);
    expect(screen.queryByText('0')).not.toBeOnTheScreen();
  });

  it('calls onWaveComplete when completion wave animation completes for last cell', () => {
    jest.useFakeTimers();
    const onWaveComplete = jest.fn();

    render(
      <FlowCell
        {...defaultProps}
        isCompletionWaveActive
        isLastInWave
        onWaveComplete={onWaveComplete}
      />,
    );

    jest.runAllTimers();

    expect(onWaveComplete).toHaveBeenCalledTimes(1);
    jest.useRealTimers();
  });

  it('does not call onWaveComplete when completion wave animation completes for non-last cell', () => {
    jest.useFakeTimers();
    const onWaveComplete = jest.fn();

    render(
      <FlowCell
        {...defaultProps}
        isCompletionWaveActive
        isLastInWave={false}
        onWaveComplete={onWaveComplete}
      />,
    );

    jest.runAllTimers();

    expect(onWaveComplete).toHaveBeenCalledTimes(0);
    jest.useRealTimers();
  });
});
