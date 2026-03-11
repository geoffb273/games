import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/common/Text';
import { useTheme } from '@/hooks/useTheme';
import { useColorBlindEnabled } from '@/store/colorBlindStore';

type FlowCellProps = {
  size: number;
  pairNumber: number | null;
  cellValue: number;
  color: string;
};

export function FlowCell({ size, pairNumber, cellValue, color }: FlowCellProps) {
  const theme = useTheme();
  const isColorBlind = useColorBlindEnabled();
  const isFilled = cellValue > 0;
  const backgroundColor = isFilled ? color : theme.backgroundElement;
  const showEndpoint = pairNumber != null;

  const numberToShow = pairNumber ?? cellValue;

  const showNumber = (isColorBlind || showEndpoint) && numberToShow > 0;

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
      {showNumber && (
        <Text type="emphasized_body" _colorOverride="#fff">
          {numberToShow}
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
