import { State } from 'react-native-gesture-handler';
import { fireGestureHandler, getByGestureTestId } from 'react-native-gesture-handler/jest-utils';

import { render, screen, waitFor } from '@testing-library/react-native';

import { HashiBridge } from '@/components/game/HashiBoard/HashiBridge';

const mockTheme = {
  text: '#333',
  warning: '#f7c948',
};

jest.mock('@/hooks/useTheme', () => ({
  useTheme: () => mockTheme,
}));

const defaultProps = {
  x1: 0,
  y1: 0,
  x2: 100,
  y2: 0,
  cellSize: 44,
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
    const onPress = jest.fn();
    render(<HashiBridge {...defaultProps} count={1} onPress={onPress} />);
    fireGestureHandler(getByGestureTestId('hashi-bridge-tap'), [
      { state: State.BEGAN },
      { state: State.ACTIVE },
      { state: State.END },
    ]);
    await waitFor(() => {
      expect(onPress).toHaveBeenCalledTimes(1);
    });
  });

  it('does not call onPress when disabled', async () => {
    const onPress = jest.fn();
    render(<HashiBridge {...defaultProps} count={1} disabled onPress={onPress} />);
    fireGestureHandler(getByGestureTestId('hashi-bridge-tap'), [
      { state: State.BEGAN },
      { state: State.ACTIVE },
      { state: State.END },
    ]);
    await waitFor(() => {
      expect(onPress).not.toHaveBeenCalled();
    });
  });

  it('calls onPress when swiped along the bridge', async () => {
    const onPress = jest.fn();
    render(<HashiBridge {...defaultProps} count={1} onPress={onPress} />);

    // For this test setup x1=0,y1=0,x2=100,y2=0 so the bridge axis is horizontal.
    fireGestureHandler(getByGestureTestId('hashi-bridge-swipe'), [
      { state: State.BEGAN, translationX: 0, translationY: 0 },
      { state: State.ACTIVE, translationX: 20, translationY: 0 },
      { state: State.END, translationX: 20, translationY: 0 },
    ]);

    await waitFor(() => {
      expect(onPress).toHaveBeenCalledTimes(1);
    });
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
