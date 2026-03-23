import React from 'react';

import { type Router, useRouter } from 'expo-router';
import { render, screen, userEvent } from '@testing-library/react-native';

import { type Puzzle, PuzzleType } from '@/api/puzzle/puzzle';
import { usePuzzleQuery } from '@/api/puzzle/puzzleQuery';
import { Button as MockButton } from '@/components/common/Button';
import { Text as MockText } from '@/components/common/Text';
import { PuzzleCard, PuzzleListEmptyState } from '@/components/PuzzleCard';

jest.mock('expo-router', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@expo/vector-icons', () => ({
  MaterialCommunityIcons: ({ name }: { name: string }) => <MockText>{name}</MockText>,
}));

jest.mock('@/hooks/useTheme', () => ({
  useTheme: () => ({
    text: '#000000',
    textSecondary: '#666666',
    borderSubtle: '#cccccc',
    success: '#00ff00',
    successSurface: '#ddffdd',
    error: '#ff0000',
    errorSurface: '#ffdddd',
    accentInk: '#0000ff',
    highlightWash: '#ddeeff',
  }),
}));

jest.mock('@/hooks/usePuzzlePalette', () => ({
  usePuzzlePalette: () => ({
    card: '#ffffff',
    chip: '#0000ff',
  }),
}));

jest.mock('@/api/puzzle/puzzleQuery', () => ({
  usePuzzleQuery: jest.fn(),
}));

jest.mock('@/components/common/PuzzleIcon', () => ({
  PuzzleIcon: ({ type, size }: { type: PuzzleType; size: 'sm' | 'md' }) => (
    <MockText>{`${type}-${size}`}</MockText>
  ),
}));

jest.mock('@/components/common/ErrorView', () => ({
  ErrorView: ({ onRetry }: { onRetry: () => void }) => (
    <MockButton role="button" onPress={onRetry} variant="primary">
      Retry
    </MockButton>
  ),
}));

function createPuzzle(overrides: Partial<Puzzle> = {}): Puzzle {
  return {
    id: 'puzzle-1',
    name: 'Sample Puzzle',
    description: 'A fun puzzle',
    attempt: null,
    type: PuzzleType.Flow,
    width: 5,
    height: 5,
    pairs: [],
    ...overrides,
  } as Puzzle;
}

describe('PuzzleCard', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('preloads the puzzle via usePuzzleQuery', () => {
    const puzzle = createPuzzle({ id: 'puzzle-123' });
    const usePuzzleQueryMock = jest.mocked(usePuzzleQuery);

    render(<PuzzleCard puzzle={puzzle} />);

    expect(usePuzzleQueryMock).toHaveBeenCalledWith({ id: 'puzzle-123' });
  });

  it('renders puzzle name and description', () => {
    const puzzle = createPuzzle({
      name: 'Custom Puzzle',
      description: 'Custom description',
    });

    render(<PuzzleCard puzzle={puzzle} />);

    expect(screen.getByText('Custom Puzzle')).toBeOnTheScreen();
    expect(screen.getByText('Custom description')).toBeOnTheScreen();
  });

  it('falls back to default description when description is null', () => {
    const puzzle = createPuzzle({
      type: PuzzleType.Flow,
      description: null,
    });

    render(<PuzzleCard puzzle={puzzle} />);

    expect(screen.getByText('Connect matching colors without crossing paths.')).toBeOnTheScreen();
  });

  it('navigates to game screen on press', async () => {
    const user = userEvent.setup();
    const puzzle = createPuzzle({ id: 'puzzle-route' });
    const mockPush = jest.fn();

    jest.mocked(useRouter).mockReturnValue({
      push: mockPush,
    } as unknown as Router);

    render(<PuzzleCard puzzle={puzzle} />);

    await user.press(screen.getByText('Sample Puzzle'));

    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/game/[id]',
      params: { id: 'puzzle-route' },
    });
  });

  it('renders the solved status icon using the check glyph', () => {
    const puzzle = createPuzzle({
      attempt: { startedAt: new Date(), completedAt: new Date(), durationMs: 1000 },
    });

    render(<PuzzleCard puzzle={puzzle} />);

    expect(screen.getByText('check')).toBeOnTheScreen();
  });

  it('renders the lost status icon using the close glyph', () => {
    const puzzle = createPuzzle({
      attempt: { startedAt: new Date(), completedAt: null, durationMs: 1000 },
    });

    render(<PuzzleCard puzzle={puzzle} />);

    expect(screen.getByText('close')).toBeOnTheScreen();
  });

  describe('small variant', () => {
    it('renders the Play-prefixed title and hides descriptions', () => {
      const puzzle = createPuzzle({
        name: 'Custom Puzzle',
        description: 'Custom description',
      });

      render(<PuzzleCard puzzle={puzzle} variant="small" />);

      expect(screen.getByText('Play Custom Puzzle')).toBeOnTheScreen();
      expect(screen.queryByText('Custom description')).toBeNull();
    });

    it('navigates with replace instead of push on press', async () => {
      const user = userEvent.setup();
      const puzzle = createPuzzle({ id: 'puzzle-small-route' });
      const mockPush = jest.fn();
      const mockReplace = jest.fn();

      jest.mocked(useRouter).mockReturnValue({
        push: mockPush,
        replace: mockReplace,
      } as unknown as Router);

      render(<PuzzleCard puzzle={puzzle} variant="small" />);

      await user.press(screen.getByText('Play Sample Puzzle'));

      expect(mockReplace).toHaveBeenCalledWith({
        pathname: '/game/[id]',
        params: { id: 'puzzle-small-route' },
      });
      expect(mockPush).not.toHaveBeenCalled();
    });

    it('uses the small icon and does not render a status icon', () => {
      const puzzle = createPuzzle({
        attempt: { startedAt: new Date(), completedAt: new Date(), durationMs: 1000 },
      });

      render(<PuzzleCard puzzle={puzzle} variant="small" />);

      expect(screen.getByText(`${PuzzleType.Flow}-sm`)).toBeOnTheScreen();
      expect(screen.queryByText('check')).toBeNull();
    });
  });
});

describe('PuzzleListEmptyState', () => {
  it('shows loading indicator when loading', () => {
    render(<PuzzleListEmptyState isLoading />);

    expect(screen.queryByText('No puzzles available')).toBeNull();
  });

  it('shows generic empty message when not loading or error', () => {
    render(<PuzzleListEmptyState />);

    expect(screen.getByText('No puzzles available')).toBeOnTheScreen();
  });

  it('renders error view and calls onRetry', async () => {
    const user = userEvent.setup();
    const onRetry = jest.fn();

    render(<PuzzleListEmptyState isError onRetry={onRetry} />);

    await user.press(screen.getByRole('button', { name: 'Retry' }));

    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
