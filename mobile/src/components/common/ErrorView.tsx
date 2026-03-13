import { type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';
import Svg, { Circle, Line, Path } from 'react-native-svg';

import { Text } from '@/components/common/Text';
import { Spacing } from '@/constants/token';
import { useTheme } from '@/hooks/useTheme';

import { Button } from './Button';

type ErrorViewProps = {
  title?: string;
  message?: string | null;
  containerStyle?: StyleProp<ViewStyle>;
  onRetry?: () => void;
};

export function ErrorView({
  title = 'Something went wrong',
  message = 'Please try again.',
  containerStyle,
  onRetry,
}: ErrorViewProps) {
  return (
    <View style={[styles.container, containerStyle]}>
      <ErrorIllustration />
      <Text type="h3" textAlign="center">
        {title}
      </Text>
      {message != null ? (
        <Text type="body" color="textSecondary" textAlign="center">
          {message}
        </Text>
      ) : null}
      {onRetry != null ? <Button onPress={onRetry}>Retry</Button> : null}
    </View>
  );
}

function ErrorIllustration() {
  const theme = useTheme();

  return (
    <Svg
      width={88}
      height={88}
      viewBox="0 0 88 88"
      fill="none"
      accessibilityLabel="Error illustration"
    >
      <Circle
        cx={44}
        cy={44}
        r={42}
        fill={theme.warningSurface}
        stroke={theme.warning}
        strokeWidth={2}
      />
      <Path
        d="M44 22L62 56H26L44 22Z"
        fill={theme.background}
        stroke={theme.warning}
        strokeWidth={2}
        strokeLinejoin="round"
      />
      <Line
        x1={44}
        y1={34}
        x2={44}
        y2={46}
        stroke={theme.warning}
        strokeWidth={3}
        strokeLinecap="round"
      />
      <Circle cx={44} cy={52} r={2.2} fill={theme.warning} />
    </Svg>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.four,
  },
});
