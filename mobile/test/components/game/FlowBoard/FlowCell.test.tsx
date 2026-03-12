import { render, screen } from '@testing-library/react-native';

import { FlowCell } from '@/components/game/FlowBoard/FlowCell';

const mockTheme = {
  backgroundElement: '#e0e0e0',
  borderSubtle: '#ccc',
};

jest.mock('@/hooks/useTheme', () => ({
  useTheme: () => mockTheme,
}));

const mockUseColorBlindEnabled = jest.fn(() => false);
jest.mock('@/store/colorBlindStore', () => ({
  useColorBlindEnabled: () => mockUseColorBlindEnabled(),
}));

describe('FlowCell', () => {
  beforeEach(() => {
    mockUseColorBlindEnabled.mockReturnValue(false);
  });

  it('does not show a number for empty cell when not color blind', () => {
    render(<FlowCell size={40} pairNumber={null} cellValue={0} color="#ff0000" />);
    expect(screen.queryByText('0')).not.toBeOnTheScreen();
  });

  it('does not show a number for filled non-endpoint cell when not color blind', () => {
    render(<FlowCell size={40} pairNumber={null} cellValue={1} color="#ff0000" />);
    expect(screen.queryByText('1')).not.toBeOnTheScreen();
  });

  it('shows pair number for endpoint cell', () => {
    render(<FlowCell size={40} pairNumber={3} cellValue={1} color="#00ff00" />);
    expect(screen.getByText('3')).toBeOnTheScreen();
  });

  it('shows cell value for endpoint when pairNumber is same as cellValue', () => {
    render(<FlowCell size={40} pairNumber={2} cellValue={2} color="#0000ff" />);
    expect(screen.getByText('2')).toBeOnTheScreen();
  });

  it('shows number for filled cell when color blind mode is enabled', () => {
    mockUseColorBlindEnabled.mockReturnValue(true);
    render(<FlowCell size={40} pairNumber={null} cellValue={2} color="#ff0000" />);
    expect(screen.getByText('2')).toBeOnTheScreen();
  });

  it('does not show number for empty cell when color blind', () => {
    mockUseColorBlindEnabled.mockReturnValue(true);
    render(<FlowCell size={40} pairNumber={null} cellValue={0} color="#ff0000" />);
    expect(screen.queryByText('0')).not.toBeOnTheScreen();
  });
});
