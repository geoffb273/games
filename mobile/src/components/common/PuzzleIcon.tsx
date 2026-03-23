import { type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';

import { MaterialCommunityIcons } from '@expo/vector-icons';

import { type Puzzle } from '@/api/puzzle/puzzle';
import { Radii } from '@/constants/token';
import { usePuzzlePalette } from '@/hooks/usePuzzlePalette';
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

type Size = 'sm' | 'md' | 'lg' | 'xl';

const SIZE: Record<Size, { iconSize: number; chipSize: number; borderRadius: number }> = {
  sm: { iconSize: 20, chipSize: 32, borderRadius: Radii.xs },
  md: { iconSize: 28, chipSize: 44, borderRadius: Radii.sm },
  lg: { iconSize: 56, chipSize: 72, borderRadius: Radii.sm },
  xl: { iconSize: 72, chipSize: 96, borderRadius: Radii.sm },
};

export function PuzzleIcon({ type, size = 'md', style }: PuzzleIconProps) {
  const theme = useTheme();
  const palette = usePuzzlePalette(type);
  const { iconSize, chipSize, borderRadius } = SIZE[size];

  return (
    <View
      style={[
        styles.chip,
        { backgroundColor: palette.chip, width: chipSize, height: chipSize, borderRadius },
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
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});
