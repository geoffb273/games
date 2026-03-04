import { StyleSheet, View } from 'react-native';

import { type HanjiPuzzle } from '@/api/puzzle/puzzle';
import { Text } from '@/components/common/Text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

type HanjiBoardProps = {
  puzzle: HanjiPuzzle;
};

export function HanjiBoard({ puzzle }: HanjiBoardProps) {
  const { name } = puzzle;
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <Text type="h3" textAlign="center">
        {name}
      </Text>
      <View style={[styles.placeholder, { backgroundColor: theme.backgroundElement }]}>
        <Text type="body" color="textSecondary" textAlign="center">
          Hanji board coming soon
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.four,
    paddingTop: Spacing.four,
  },
  placeholder: {
    width: 280,
    height: 280,
    borderRadius: Spacing.three,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
