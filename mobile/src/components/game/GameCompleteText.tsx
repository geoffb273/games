import { StyleSheet } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { Text, type TextColor } from '@/components/common/Text';
import { type ThemeColor } from '@/constants/theme';
import { Radii, Spacing } from '@/constants/token';
import { useTheme } from '@/hooks/useTheme';

type CompleteVariant = 'success' | 'failure';

type GameCompleteTextProps = {
  variant?: CompleteVariant;
};

const COMPLETE_VARIANT: Record<
  CompleteVariant,
  { backgroundColor: ThemeColor; textColor: TextColor; text: string }
> = {
  success: { backgroundColor: 'success', textColor: 'successText', text: 'Complete' },
  failure: { backgroundColor: 'warning', textColor: 'warningText', text: 'Incorrect' },
};

export function GameCompleteText({ variant = 'success' }: GameCompleteTextProps) {
  const theme = useTheme();

  const { backgroundColor, textColor, text } = COMPLETE_VARIANT[variant];

  return (
    <Animated.View
      entering={FadeIn.duration(1000)}
      style={[styles.completeText, { backgroundColor: theme[backgroundColor] }]}
    >
      <Text type="h3" textAlign="center" color={textColor}>
        {text}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  completeText: {
    position: 'absolute',
    borderRadius: Radii.pill,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
  },
});
