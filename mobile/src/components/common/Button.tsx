import { Pressable, type PressableProps, StyleSheet, View, type ViewStyle } from 'react-native';

import { FontAwesome } from '@expo/vector-icons';

import { Text, type TextColor } from '@/components/common/Text';
import { Radii, Spacing } from '@/constants/token';
import { useTheme } from '@/hooks/useTheme';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';

type Align = 'left' | 'center' | 'right';

type NativePressableProps = Omit<PressableProps, 'style' | 'children' | 'onPress'>;

type ButtonProps = NativePressableProps & {
  variant?: ButtonVariant;
  children?: string;
  onPress: () => void | Promise<void>;
  disabled?: boolean;
  leadingIcon?: keyof typeof FontAwesome.glyphMap;
  trailingIcon?: keyof typeof FontAwesome.glyphMap;
  align?: Align;
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
  disabled: boolean,
): VariantStyles {
  if (variant === 'primary') {
    return {
      backgroundColor: disabled ? theme.borderSubtle : theme.accentInk,
      textColor: disabled ? 'textSecondary' : 'background',
    };
  }

  if (variant === 'secondary') {
    return {
      backgroundColor: disabled ? theme.borderSubtle : theme.backgroundElement,
      textColor: disabled ? 'textSecondary' : 'text',
    };
  }

  if (variant === 'outline') {
    return {
      backgroundColor: 'transparent',
      borderColor: theme.borderSubtle,
      borderWidth: 1,
      textColor: disabled ? 'textSecondary' : 'text',
    };
  }

  // ghost
  return {
    backgroundColor: 'transparent',
    textColor: disabled ? 'textSecondary' : 'text',
  };
}

function getJustifyContent(align: Align): ViewStyle['justifyContent'] {
  switch (align) {
    case 'left':
      return 'flex-start';
    case 'right':
      return 'flex-end';
    default:
      return 'center';
  }
}

export function Button({
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
  const { backgroundColor, borderColor, borderWidth, textColor } = getVariantStyles(
    theme,
    variant,
    disabled,
  );

  const containerStyle: ViewStyle = {
    backgroundColor,
    borderColor,
    borderWidth,
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
        variant !== 'ghost' && styles.padding,
        containerStyle,
        fullWidth && styles.fullWidth,
        pressed && !disabled && styles.pressed,
      ]}
    >
      <View
        style={[
          styles.content,
          {
            justifyContent: getJustifyContent(align),
          },
          fullWidth && styles.contentStretch,
        ]}
      >
        {leadingIcon != null && <ButtonIcon icon={leadingIcon} color={textColor} />}
        {children != null && (
          <Text type="emphasized_body" color={textColor}>
            {children}
          </Text>
        )}
        {trailingIcon != null && <ButtonIcon icon={trailingIcon} color={textColor} />}
      </View>
    </Pressable>
  );
}

function ButtonIcon({
  icon,
  color,
}: {
  icon: keyof typeof FontAwesome.glyphMap;
  color: TextColor;
}) {
  const theme = useTheme();

  return (
    <View style={styles.icon}>
      <FontAwesome name={icon} size={20} color={theme[color]} solid />
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: Radii.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  padding: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
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
});
