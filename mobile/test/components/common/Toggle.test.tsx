import React from 'react';

import { fireEvent, render, screen } from '@testing-library/react-native';

import { Toggle } from '@/components/common/Toggle';

jest.mock('@/hooks/useTheme', () => ({
  useTheme: () => ({
    borderSubtle: '#ccc',
    success: '#0a0',
    background: '#fff',
  }),
}));

const mockTriggerHapticLight = jest.fn();
jest.mock('@/utils/hapticUtils', () => ({
  triggerHapticLight: (...args: unknown[]) => mockTriggerHapticLight(...args),
}));

describe('Toggle', () => {
  beforeEach(() => {
    mockTriggerHapticLight.mockClear();
  });

  it('renders as a switch with accessibility role and label', () => {
    render(<Toggle value={false} onValueChange={() => {}} />);
    expect(screen.getByRole('switch', { name: 'Toggle' })).toBeOnTheScreen();
  });

  it('calls onValueChange with new value when toggled on', () => {
    const onValueChange = jest.fn();
    render(<Toggle value={false} onValueChange={onValueChange} />);
    fireEvent(screen.getByRole('switch', { name: 'Toggle' }), 'valueChange', true);
    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(onValueChange).toHaveBeenCalledWith(true);
  });

  it('calls onValueChange with false when toggled off', () => {
    const onValueChange = jest.fn();
    render(<Toggle value={true} onValueChange={onValueChange} />);
    fireEvent(screen.getByRole('switch', { name: 'Toggle' }), 'valueChange', false);
    expect(onValueChange).toHaveBeenCalledWith(false);
  });

  it('triggers haptic feedback when value is changed', () => {
    render(<Toggle value={false} onValueChange={() => {}} />);
    fireEvent(screen.getByRole('switch', { name: 'Toggle' }), 'valueChange', true);
    expect(mockTriggerHapticLight).toHaveBeenCalledTimes(1);
  });
});
