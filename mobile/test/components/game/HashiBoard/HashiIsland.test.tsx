import { StyleSheet } from 'react-native';

import { render, screen, userEvent } from '@testing-library/react-native';

import { HashiIsland } from '@/components/game/HashiBoard/HashiIsland';

const mockTheme = {
  text: '#111',
  background: '#fff',
  error: '#c00',
};

jest.mock('@/hooks/useTheme', () => ({
  useTheme: () => mockTheme,
}));

const defaultProps = {
  x: 50,
  y: 50,
  cellSize: 40,
  isLastInWave: false,
  isCompletionWaveActive: false,
  onPress: jest.fn(),
  isDisabled: false,
};

describe('HashiIsland', () => {
  it('renders the required bridges number', () => {
    render(<HashiIsland {...defaultProps} requiredBridges={3} currentBridges={0} />);
    expect(screen.getByText('3')).toBeOnTheScreen();
  });

  it('renders required bridges when current is below required', () => {
    render(<HashiIsland {...defaultProps} requiredBridges={2} currentBridges={1} />);
    expect(screen.getByText('2')).toBeOnTheScreen();
  });

  it('renders required bridges when current equals required', () => {
    render(<HashiIsland {...defaultProps} requiredBridges={4} currentBridges={4} />);
    expect(screen.getByText('4')).toBeOnTheScreen();
  });

  it('renders required bridges when current exceeds required', () => {
    render(<HashiIsland {...defaultProps} requiredBridges={1} currentBridges={2} />);
    expect(screen.getByText('1')).toBeOnTheScreen();
  });

  it('passes background color to Text when at max (current >= required)', () => {
    render(<HashiIsland {...defaultProps} requiredBridges={2} currentBridges={2} />);
    const text = screen.getByText('2');
    const style = StyleSheet.flatten(text.props.style);
    expect(style.color).toBe(mockTheme.background);
  });

  it('passes text color to Text when under max (current < required)', () => {
    render(<HashiIsland {...defaultProps} requiredBridges={2} currentBridges={0} />);
    const text = screen.getByText('2');
    const style = StyleSheet.flatten(text.props.style);
    expect(style.color).toBe(mockTheme.text);
  });

  it('calls onWaveComplete when completion wave animation completes for last island', () => {
    jest.useFakeTimers();
    const onWaveComplete = jest.fn();

    render(
      <HashiIsland
        {...defaultProps}
        requiredBridges={2}
        currentBridges={0}
        isLastInWave
        isCompletionWaveActive
        onWaveComplete={onWaveComplete}
      />,
    );

    jest.runAllTimers();

    expect(onWaveComplete).toHaveBeenCalledTimes(1);
    jest.useRealTimers();
  });

  it('calls onPress when island is pressed and enabled', async () => {
    const user = userEvent.setup();
    const onPress = jest.fn();
    render(
      <HashiIsland
        {...defaultProps}
        requiredBridges={2}
        currentBridges={0}
        onPress={onPress}
        isDisabled={false}
      />,
    );

    await user.press(screen.getByText('2'));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not call onPress when explicitly disabled', async () => {
    const user = userEvent.setup();
    const onPress = jest.fn();
    render(
      <HashiIsland
        {...defaultProps}
        requiredBridges={2}
        currentBridges={0}
        onPress={onPress}
        isDisabled
      />,
    );

    await user.press(screen.getByText('2'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('does not call onPress during completion wave even if enabled', async () => {
    const user = userEvent.setup();
    const onPress = jest.fn();
    render(
      <HashiIsland
        {...defaultProps}
        requiredBridges={2}
        currentBridges={0}
        onPress={onPress}
        isDisabled={false}
        isCompletionWaveActive
      />,
    );

    await user.press(screen.getByText('2'));
    expect(onPress).not.toHaveBeenCalled();
  });
});
