import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/common/Text';
import { useTheme } from '@/hooks/useTheme';

type FlowCellProps = {
  size: number;
  pairNumber: number | null;
  cellValue: number;
  color: string;
};

export function FlowCell({ size, pairNumber, cellValue, color }: FlowCellProps) {
  const theme = useTheme();
  const isFilled = cellValue > 0;
  const backgroundColor = isFilled ? color : theme.backgroundElement;
  const showEndpoint = pairNumber != null;

  return (
    <View
      style={[
        styles.cell,
        {
          width: size,
          height: size,
          backgroundColor,
          borderColor: theme.borderSubtle,
          borderWidth: 1,
        },
        showEndpoint && { backgroundColor: color },
      ]}
    >
      {showEndpoint && (
        <Text type="emphasized_body" _colorOverride="#fff">
          {pairNumber}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  cell: {
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
