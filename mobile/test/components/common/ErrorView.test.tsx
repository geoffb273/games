import React from 'react';

import { render, screen, userEvent } from '@testing-library/react-native';

import { ErrorView } from '@/components/common/ErrorView';

jest.mock('@/hooks/useTheme', () => ({
  useTheme: () => ({
    warningSurface: '#fff3cd',
    warning: '#856404',
    background: '#ffffff',
  }),
}));

describe('ErrorView', () => {
  it('renders default title and message when none are provided', () => {
    render(<ErrorView />);

    expect(screen.getByText('Something went wrong')).toBeOnTheScreen();
    expect(screen.getByText('Please try again.')).toBeOnTheScreen();
    expect(screen.queryByText('Retry')).toBeNull();
  });

  it('renders a custom title and message', () => {
    render(<ErrorView title="Custom title" message="Custom message" />);

    expect(screen.getByText('Custom title')).toBeOnTheScreen();
    expect(screen.getByText('Custom message')).toBeOnTheScreen();
  });

  it('does not render a message when message is null', () => {
    render(<ErrorView message={null} />);

    expect(screen.getByText('Something went wrong')).toBeOnTheScreen();
    expect(screen.queryByText('Please try again.')).toBeNull();
  });

  it('renders a retry button and calls onRetry when pressed', async () => {
    const user = userEvent.setup();
    const onRetry = jest.fn();

    render(<ErrorView onRetry={onRetry} />);

    const retryButton = screen.getByText('Retry');
    await user.press(retryButton);

    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('renders the error illustration with an accessible label', () => {
    render(<ErrorView />);

    expect(screen.getByLabelText('Error illustration')).toBeOnTheScreen();
  });
});
