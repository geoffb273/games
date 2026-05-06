import { type MaterialCommunityIcons } from '@expo/vector-icons';

import { type Puzzle } from '@/api/puzzle/puzzle';
import { type PuzzlePalette } from '@/constants/puzzleTheme';
import { usePuzzlePalette } from '@/hooks/usePuzzlePalette';
import { useTheme } from '@/hooks/useTheme';

import { IconChip, type IconChipSize } from './IconChip';

type PuzzleIconProps = {
  type: Puzzle['type'];
  size?: IconChipSize;
  color?: keyof PuzzlePalette;
};

const PUZZLE_TYPE_ICONS: Record<Puzzle['type'], keyof typeof MaterialCommunityIcons.glyphMap> = {
  FLOW: 'chart-bubble',
  HANJI: 'grid-large',
  HASHI: 'bridge',
  MINESWEEPER: 'bomb',
  SLITHERLINK: 'vector-polyline',
};

export function PuzzleIcon({ type, size = 'md', color = 'chip' }: PuzzleIconProps) {
  const theme = useTheme();
  const palette = usePuzzlePalette(type);

  return (
    <IconChip
      size={size}
      name={PUZZLE_TYPE_ICONS[type]}
      backgroundColor={palette[color]}
      iconColor={theme.text}
    />
  );
}
