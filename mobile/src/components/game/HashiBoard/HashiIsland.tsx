import { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/common/Text';
import { useTheme } from '@/hooks/useTheme';

const ISLAND_RADIUS_RATIO = 0.4;

type HashiIslandProps = {
  requiredBridges: number;
  x: number;
  y: number;
  cellSize: number;
};

export const HashiIsland = memo(function HashiIsland({
  requiredBridges,
  x,
  y,
  cellSize,
}: HashiIslandProps) {
  const theme = useTheme();
  const radius = cellSize * ISLAND_RADIUS_RATIO;

  return (
    <View
      style={[
        styles.island,
        {
          left: x - radius,
          top: y - radius,
          width: radius * 2,
          height: radius * 2,
          borderRadius: radius,
          borderWidth: 2,
          borderColor: theme.text,
          backgroundColor: theme.background,
        },
      ]}
    >
      <Text type="emphasized_body">{requiredBridges}</Text>
    </View>
  );
});

const styles = StyleSheet.create({
  island: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
