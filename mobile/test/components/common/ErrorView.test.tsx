import React from 'react';

import { render, screen, userEvent } from '@testing-library/react-native';

import { logError } from '@/client/newRelic';
import { ErrorView } from '@/components/common/ErrorView';
import { EVENT } from '@/constants/event';

jest.mock('@/client/newRelic', () => ({
  logError: jest.fn(),
}));

jest.mock('@/hooks/useTheme', () => ({
  useTheme: () => ({
    warningSurface: '#fff3cd',
    warning: '#856404',
    background: '#ffffff',
  }),
}));

describe('ErrorView', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

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

  describe('logError', () => {
    it('logs Unknown error when error prop is omitted', () => {
      render(<ErrorView />);

      expect(logError).toHaveBeenCalledTimes(1);
      expect(logError).toHaveBeenCalledWith({ event: EVENT.ERROR_VIEW_ERROR }, 'Unknown error');
    });

    it('logs Error.message when error is an Error instance', () => {
      render(<ErrorView error={new Error('GraphQL failure')} />);

      expect(logError).toHaveBeenCalledTimes(1);
      expect(logError).toHaveBeenCalledWith({ event: EVENT.ERROR_VIEW_ERROR }, 'GraphQL failure');
    });

    it('logs error.toString() when error is not an Error', () => {
      render(<ErrorView error="timeout" />);

      expect(logError).toHaveBeenCalledWith({ event: EVENT.ERROR_VIEW_ERROR }, 'timeout');
    });

    it('logs again when error prop changes', () => {
      const { rerender } = render(<ErrorView error={new Error('first')} />);

      expect(logError).toHaveBeenLastCalledWith({ event: EVENT.ERROR_VIEW_ERROR }, 'first');

      rerender(<ErrorView error={new Error('second')} />);

      expect(logError).toHaveBeenCalledTimes(2);
      expect(logError).toHaveBeenLastCalledWith({ event: EVENT.ERROR_VIEW_ERROR }, 'second');
    });
  });
});
