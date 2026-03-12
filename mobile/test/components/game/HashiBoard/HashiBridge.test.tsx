import { render, screen, userEvent } from '@testing-library/react-native';

import { HashiBridge } from '@/components/game/HashiBoard/HashiBridge';

const mockTheme = {
  text: '#333',
};

jest.mock('@/hooks/useTheme', () => ({
  useTheme: () => mockTheme,
}));

const defaultProps = {
  x1: 0,
  y1: 0,
  x2: 100,
  y2: 0,
  onPress: jest.fn(),
};

describe('HashiBridge', () => {
  beforeEach(() => {
    defaultProps.onPress.mockClear();
  });

  it('renders with count 0', () => {
    render(<HashiBridge {...defaultProps} count={0} />);
    expect(screen.getByTestId('hashi-bridge')).toBeOnTheScreen();
  });

  it('renders with count 1', () => {
    render(<HashiBridge {...defaultProps} count={1} />);
    expect(screen.getByTestId('hashi-bridge')).toBeOnTheScreen();
  });

  it('renders with count 2', () => {
    render(<HashiBridge {...defaultProps} count={2} />);
    expect(screen.getByTestId('hashi-bridge')).toBeOnTheScreen();
  });

  it('calls onPress when pressed', async () => {
    const user = userEvent.setup();
    const onPress = jest.fn();
    render(<HashiBridge {...defaultProps} count={1} onPress={onPress} />);
    await user.press(screen.getByTestId('hashi-bridge'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not call onPress when disabled', async () => {
    const user = userEvent.setup();
    const onPress = jest.fn();
    render(<HashiBridge {...defaultProps} count={1} disabled onPress={onPress} />);
    await user.press(screen.getByTestId('hashi-bridge'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('sets pointerEvents to none when disabled', () => {
    render(<HashiBridge {...defaultProps} count={0} disabled onPress={jest.fn()} />);
    const bridge = screen.getByTestId('hashi-bridge');
    expect(bridge.props.pointerEvents).toBe('none');
  });

  it('sets pointerEvents to auto when not disabled', () => {
    render(<HashiBridge {...defaultProps} count={0} onPress={jest.fn()} />);
    const bridge = screen.getByTestId('hashi-bridge');
    expect(bridge.props.pointerEvents).toBe('auto');
  });
});
