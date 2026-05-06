import { StyleSheet, View } from 'react-native';

import { MaterialCommunityIcons } from '@expo/vector-icons';

import { Radii } from '@/constants/token';

export type IconChipSize = 'sm' | 'md' | 'lg' | 'xl';

const ICON_CHIP_SIZE: Record<
  IconChipSize,
  { iconSize: number; chipSize: number; borderRadius: number }
> = {
  sm: { iconSize: 20, chipSize: 32, borderRadius: Radii.xs },
  md: { iconSize: 28, chipSize: 44, borderRadius: Radii.sm },
  lg: { iconSize: 56, chipSize: 72, borderRadius: Radii.sm },
  xl: { iconSize: 72, chipSize: 96, borderRadius: Radii.sm },
};

export function IconChip({
  size = 'md',
  name,
  iconColor,
  backgroundColor,
}: {
  size?: IconChipSize;
  name: keyof typeof MaterialCommunityIcons.glyphMap;
  iconColor: string;
  backgroundColor: string;
}) {
  const { iconSize, chipSize, borderRadius } = ICON_CHIP_SIZE[size];

  return (
    <View
      style={[
        {
          width: chipSize,
          height: chipSize,
          borderRadius,
          backgroundColor,
        },
        styles.chip,
      ]}
    >
      <MaterialCommunityIcons name={name} size={iconSize} color={iconColor} />
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
