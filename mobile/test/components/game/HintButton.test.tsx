import { render, screen, userEvent, waitFor } from '@testing-library/react-native';

import { PuzzleType } from '@/api/puzzle/puzzle';
import { Text as MockText } from '@/components/common/Text';
import { HintButton } from '@/components/game/HintButton';

jest.mock('@expo/vector-icons', () => {
  return {
    FontAwesome: ({ name }: { name: string }) => <MockText>{name}</MockText>,
  };
});

jest.mock('@/hooks/useTheme', () => ({
  useTheme: () => ({
    accentInk: '#001122',
  }),
}));

const mockUseRequestPuzzleHint = jest.fn();
jest.mock('@/api/puzzle/requestPuzzleHintMutation', () => ({
  useRequestPuzzleHint: () => mockUseRequestPuzzleHint(),
}));

const mockUseTriggerAd = jest.fn();
jest.mock('@/hooks/ads/useTriggerAd', () => ({
  useTriggerAd: () => mockUseTriggerAd(),
}));

const defaultHintInput = {
  puzzleId: 'puzzle-1',
  puzzleType: PuzzleType.Hanji,
  hanjiCurrentState: null as number[][] | null,
} as const;

const hanjiHint = {
  puzzleType: PuzzleType.Hanji,
  row: 0,
  col: 1,
  value: 2,
};

function setupMocks(overrides?: {
  requestPuzzleHint?: jest.Mock;
  isLoading?: boolean;
  isError?: boolean;
  isDisabled?: boolean;
  isEarnedReward?: boolean;
  onPressShowAd?: jest.Mock;
}) {
  const requestPuzzleHint = overrides?.requestPuzzleHint ?? jest.fn().mockResolvedValue(hanjiHint);

  mockUseRequestPuzzleHint.mockReturnValue({
    requestPuzzleHint,
    isLoading: overrides?.isLoading ?? false,
    isError: overrides?.isError ?? false,
  });

  mockUseTriggerAd.mockReturnValue({
    isDisabled: overrides?.isDisabled ?? false,
    isEarnedReward: overrides?.isEarnedReward,
    isShowing: false,
    onPressShowAd: overrides?.onPressShowAd ?? jest.fn().mockResolvedValue(undefined),
  });

  return { requestPuzzleHint };
}

describe('HintButton', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupMocks();
  });

  it('renders the hint label and caption', () => {
    render(<HintButton {...defaultHintInput} onHint={jest.fn()} />);

    expect(screen.getByRole('button', { name: 'Hint' })).toBeOnTheScreen();
    expect(screen.getByText('Watch an ad to get a hint')).toBeOnTheScreen();
  });

  it('calls onPressShowAd when the button is pressed', async () => {
    const user = userEvent.setup();
    const onPressShowAd = jest.fn().mockResolvedValue(undefined);
    setupMocks({ onPressShowAd });

    render(<HintButton {...defaultHintInput} onHint={jest.fn()} />);

    await user.press(screen.getByRole('button', { name: 'Hint' }));

    expect(onPressShowAd).toHaveBeenCalledTimes(1);
  });

  it('disables the button while the hint mutation is loading', () => {
    setupMocks({ isLoading: true });

    render(<HintButton {...defaultHintInput} onHint={jest.fn()} />);

    expect(screen.getByRole('button', { name: 'Hint' })).toBeDisabled();
  });

  it('disables the button when the hint mutation is in error state', () => {
    setupMocks({ isError: true });

    render(<HintButton {...defaultHintInput} onHint={jest.fn()} />);

    expect(screen.getByRole('button', { name: 'Hint' })).toBeDisabled();
  });

  it('disables the button when the ad trigger reports disabled', () => {
    setupMocks({ isDisabled: true });

    render(<HintButton {...defaultHintInput} onHint={jest.fn()} />);

    expect(screen.getByRole('button', { name: 'Hint' })).toBeDisabled();
  });

  it('requests a hint and calls onHint after ad reward is earned', async () => {
    const onHint = jest.fn();
    const { requestPuzzleHint } = setupMocks({ isEarnedReward: true });

    render(<HintButton {...defaultHintInput} onHint={onHint} />);

    await waitFor(() => {
      expect(requestPuzzleHint).toHaveBeenCalledWith(defaultHintInput);
    });
    await waitFor(() => {
      expect(onHint).toHaveBeenCalledWith(hanjiHint);
    });
  });

  it('does not request a hint on mount when no reward has been earned yet', () => {
    const { requestPuzzleHint } = setupMocks({ isEarnedReward: false });

    render(<HintButton {...defaultHintInput} onHint={jest.fn()} />);

    expect(requestPuzzleHint).not.toHaveBeenCalled();
  });
});
