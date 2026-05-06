import { Pressable, type PressableProps, StyleSheet, View, type ViewStyle } from 'react-native';

import { FontAwesome } from '@expo/vector-icons';

import { Text, type TextColor, type TextSize } from '@/components/common/Text';
import { Radii, Spacing } from '@/constants/token';
import { useTheme } from '@/hooks/useTheme';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

export type ButtonAlign = 'left' | 'center' | 'right';

type NativePressableProps = Omit<PressableProps, 'style' | 'children' | 'onPress'>;

type ButtonProps = NativePressableProps & {
  size?: ButtonSize;
  variant?: ButtonVariant;
  children?: string;
  onPress: () => void | Promise<void>;
  disabled?: boolean;
  leadingIcon?: keyof typeof FontAwesome.glyphMap;
  trailingIcon?: keyof typeof FontAwesome.glyphMap;
  align?: ButtonAlign;
  fullWidth?: boolean;
};

type VariantStyles = {
  backgroundColor: string;
  borderColor?: string;
  borderWidth?: number;
  textColor: TextColor;
};

function getVariantStyles(
  theme: ReturnType<typeof useTheme>,
  variant: ButtonVariant,
): VariantStyles {
  if (variant === 'primary') {
    return { backgroundColor: theme.accentInk, textColor: 'background' };
  }

  if (variant === 'secondary') {
    return {
      backgroundColor: theme.backgroundElement,
      textColor: 'text',
    };
  }

  if (variant === 'outline') {
    return {
      backgroundColor: 'transparent',
      borderColor: theme.borderSubtle,
      borderWidth: 1,
      textColor: 'text',
    };
  }

  // ghost
  return {
    backgroundColor: 'transparent',
    textColor: 'text',
  };
}

const ALIGN_TO_JUSTIFY_CONTENT: Record<ButtonAlign, ViewStyle['justifyContent']> = {
  left: 'flex-start',
  right: 'flex-end',
  center: 'center',
};

const SIZE_MAPPING: Record<
  ButtonSize,
  {
    padding: { paddingVertical: number; paddingHorizontal: number };
    iconSize: number;
    textSize: TextSize;
    borderRadius: Radii;
  }
> = {
  sm: {
    padding: { paddingVertical: Spacing.one, paddingHorizontal: Spacing.two },
    iconSize: 16,
    textSize: 'sm',
    borderRadius: 'sm',
  },
  md: {
    padding: { paddingVertical: Spacing.two, paddingHorizontal: Spacing.three },
    iconSize: 20,
    textSize: 'md',
    borderRadius: 'md',
  },
  lg: {
    padding: { paddingVertical: Spacing.three, paddingHorizontal: Spacing.four },
    iconSize: 24,
    textSize: 'lg',
    borderRadius: 'lg',
  },
};

export function Button({
  size = 'md',
  variant = 'primary',
  children,
  onPress,
  disabled = false,
  leadingIcon,
  trailingIcon,
  align = 'center',
  fullWidth = false,
  ...pressableProps
}: ButtonProps) {
  const theme = useTheme();
  const { padding, iconSize, textSize, borderRadius } = SIZE_MAPPING[size];
  const { backgroundColor, borderColor, borderWidth, textColor } = getVariantStyles(theme, variant);

  const containerStyle: ViewStyle = {
    backgroundColor,
    borderColor,
    borderWidth,
    borderRadius: Radii[borderRadius],
    justifyContent: ALIGN_TO_JUSTIFY_CONTENT[align],
  };

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      {...pressableProps}
      onPress={() => {
        if (disabled) return;
        void onPress();
      }}
      style={({ pressed }) => [
        styles.base,
        variant !== 'ghost' && padding,
        containerStyle,
        fullWidth && styles.fullWidth,
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      <View
        style={[
          styles.content,
          {
            justifyContent: ALIGN_TO_JUSTIFY_CONTENT[align],
          },
          fullWidth && styles.contentStretch,
        ]}
      >
        {leadingIcon != null && <ButtonIcon icon={leadingIcon} color={textColor} size={iconSize} />}
        {children != null && (
          <Text size={textSize} color={textColor} fontWeight="semibold">
            {children}
          </Text>
        )}
        {trailingIcon != null && (
          <ButtonIcon icon={trailingIcon} color={textColor} size={iconSize} />
        )}
      </View>
    </Pressable>
  );
}

function ButtonIcon({
  icon,
  color,
  size,
}: {
  icon: keyof typeof FontAwesome.glyphMap;
  color: TextColor;
  size: number;
}) {
  const theme = useTheme();

  return (
    <View style={styles.icon}>
      <FontAwesome name={icon} size={size} color={theme[color]} solid />
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fullWidth: {
    alignSelf: 'stretch',
  },
  pressed: {
    opacity: 0.9,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  contentStretch: {
    flex: 1,
  },
  icon: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabled: {
    opacity: 0.6,
  },
});
