import { StyleSheet } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { Text } from '@/components/common/Text';
import { Radii, Spacing } from '@/constants/token';
import { useTheme } from '@/hooks/useTheme';

export function GameCompleteText() {
  const theme = useTheme();

  return (
    <Animated.View
      entering={FadeIn.duration(1000)}
      style={[styles.successText, { backgroundColor: theme.success }]}
    >
      <Text type="h3" textAlign="center" color="successText">
        Complete
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  successText: {
    position: 'absolute',
    borderRadius: Radii.pill,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
  },
});
