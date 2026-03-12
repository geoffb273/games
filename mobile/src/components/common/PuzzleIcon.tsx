import { type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';

import { MaterialCommunityIcons } from '@expo/vector-icons';

import { type Puzzle } from '@/api/puzzle/puzzle';
import { getPuzzlePalette } from '@/constants/puzzleThemeConstants';
import { Radii } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

type PuzzleIconProps = {
  type: Puzzle['type'];
  size?: Size;
  style?: StyleProp<ViewStyle>;
};

const PUZZLE_TYPE_ICONS: Record<Puzzle['type'], keyof typeof MaterialCommunityIcons.glyphMap> = {
  FLOW: 'chart-bubble',
  HANJI: 'grid-large',
  HASHI: 'bridge',
  MINESWEEPER: 'bomb',
  SLITHERLINK: 'vector-polyline',
};

type Size = 'sm' | 'md' | 'lg';

const SIZE: Record<Size, { iconSize: number; chipSize: number }> = {
  sm: { iconSize: 28, chipSize: 44 },
  md: { iconSize: 56, chipSize: 72 },
  lg: { iconSize: 72, chipSize: 96 },
};

export function PuzzleIcon({ type, size = 'md', style }: PuzzleIconProps) {
  const theme = useTheme();
  const palette = getPuzzlePalette(type);
  const { iconSize, chipSize } = SIZE[size];

  return (
    <View
      style={[
        styles.chip,
        { backgroundColor: palette.chip, width: chipSize, height: chipSize },
        style,
      ]}
    >
      <MaterialCommunityIcons
        name={PUZZLE_TYPE_ICONS[type]}
        size={iconSize}
        color={theme.accentInk}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    width: 44,
    height: 44,
    borderRadius: Radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});
