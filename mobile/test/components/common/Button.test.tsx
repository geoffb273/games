import { render, screen, userEvent } from '@testing-library/react-native';

import { Button } from '@/components/common/Button';
import { Text as MockText } from '@/components/common/Text';

jest.mock('@expo/vector-icons', () => ({
  FontAwesome: jest.fn(({ name }: { name: string }) => <MockText>{name}</MockText>),
}));

jest.mock('@/hooks/useTheme', () => ({
  useTheme: () => ({
    accentInk: '#000',
    backgroundElement: '#eee',
    borderSubtle: '#ccc',
  }),
}));

describe('Button', () => {
  it('renders children text', () => {
    render(<Button onPress={() => {}}>Submit</Button>);
    expect(screen.getByText('Submit')).toBeOnTheScreen();
  });

  it('calls onPress when pressed', async () => {
    const user = userEvent.setup();
    const onPress = jest.fn();
    render(<Button onPress={onPress}>Press me</Button>);
    await user.press(screen.getByRole('button', { name: 'Press me' }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not call onPress when disabled and pressed', async () => {
    const user = userEvent.setup();
    const onPress = jest.fn();
    render(
      <Button onPress={onPress} disabled>
        Disabled
      </Button>,
    );
    await user.press(screen.getByRole('button', { name: 'Disabled' }));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('renders leading icon when provided', () => {
    render(
      <Button onPress={() => {}} leadingIcon="arrow-left">
        With icon
      </Button>,
    );
    expect(screen.getByText('arrow-left')).toBeOnTheScreen();
    expect(screen.getByText('With icon')).toBeOnTheScreen();
  });

  it('renders trailing icon when provided', () => {
    render(
      <Button onPress={() => {}} trailingIcon="arrow-right">
        With icon
      </Button>,
    );
    expect(screen.getByText('arrow-right')).toBeOnTheScreen();
    expect(screen.getByText('With icon')).toBeOnTheScreen();
  });

  it('can render with both leading and trailing icons', () => {
    render(
      <Button onPress={() => {}} leadingIcon="arrow-left" trailingIcon="arrow-right">
        Both
      </Button>,
    );
    expect(screen.getByText('arrow-left')).toBeOnTheScreen();
    expect(screen.getByText('arrow-right')).toBeOnTheScreen();
    expect(screen.getByText('Both')).toBeOnTheScreen();
  });

  it('calls onPress only once per press when not disabled', async () => {
    const user = userEvent.setup();
    const onPress = jest.fn();
    render(<Button onPress={onPress}>Tap</Button>);
    await user.press(screen.getByRole('button', { name: 'Tap' }));
    await user.press(screen.getByRole('button', { name: 'Tap' }));
    expect(onPress).toHaveBeenCalledTimes(2);
  });
});
