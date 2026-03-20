import React, { useContext, useState } from 'react';
import { View as MockView } from 'react-native';

import { render, screen, userEvent } from '@testing-library/react-native';

import { Button as MockButton } from '@/components/common/Button';
import { GlobalErrorBoundary } from '@/components/common/GlobalErrorBoundary';
import { Text as MockText } from '@/components/common/Text';

const ThrowControlContext = React.createContext<((next: boolean) => void) | null>(null);

jest.mock('@/components/common/ErrorView', () => ({
  ErrorView: ({ title, onRetry }: { title?: string; onRetry?: () => void }) => (
    <MockView>
      <MockText>{title ?? 'Something went wrong'}</MockText>
      <MockRetryButton onRetry={onRetry} />
    </MockView>
  ),
}));

function MockRetryButton({ onRetry }: { onRetry?: () => void }) {
  const setShouldThrow = useContext(ThrowControlContext);

  return (
    <MockButton
      testID="retry"
      onPress={() => {
        setShouldThrow?.(false);
        onRetry?.();
      }}
    >
      Retry
    </MockButton>
  );
}

function ThrowUntilRetry({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) throw new Error('boom');
  return <MockText>Recovered</MockText>;
}

function TestApp() {
  const [shouldThrow, setShouldThrow] = useState(true);

  return (
    <ThrowControlContext.Provider value={setShouldThrow}>
      <GlobalErrorBoundary>
        <ThrowUntilRetry shouldThrow={shouldThrow} />
      </GlobalErrorBoundary>
    </ThrowControlContext.Provider>
  );
}

describe('GlobalErrorBoundary', () => {
  let consoleErrorSpy: jest.SpyInstance | undefined;

  beforeAll(() => {
    // ErrorBoundary tests intentionally throw; React logs `console.error` for recoverable errors.
    // Silence it so the test output stays clean.
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    // React 19's recoverable-error reporting expects a DOM-like `window.dispatchEvent`.
    // In this RN Jest environment, `window` may exist but not implement `dispatchEvent`.
    const w = (globalThis as any).window as { dispatchEvent?: unknown } | undefined;
    if (w != null && typeof w.dispatchEvent !== 'function') {
      w.dispatchEvent = () => true;
    }
  });

  afterAll(() => {
    consoleErrorSpy?.mockRestore();
  });

  it('renders fallback when child throws', () => {
    render(<TestApp />);

    expect(screen.getByText('Something went wrong')).toBeOnTheScreen();
  });

  it('retry resets boundary and allows children to recover', async () => {
    const user = userEvent.setup();

    render(<TestApp />);

    await user.press(screen.getByTestId('retry'));

    expect(screen.getByText('Recovered')).toBeOnTheScreen();
  });
});
