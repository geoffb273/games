// eslint-disable-next-line no-restricted-imports
import { Switch } from 'react-native';

import { useTheme } from '@/hooks/useTheme';
import { triggerHapticLight } from '@/utils/hapticUtils';

/**
 * A toggle component that uses the light haptic feedback and theme colors
 */
export function Toggle({
  value,
  onValueChange,
  disabled = false,
}: {
  /** The value of the toggle */
  value: boolean;
  /** The function to call when the value changes */
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
}) {
  const theme = useTheme();

  return (
    <Switch
      value={value}
      disabled={disabled}
      accessibilityLabel="Toggle"
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      onValueChange={(isOn) => {
        onValueChange(isOn);
        triggerHapticLight();
      }}
      trackColor={{
        false: theme.borderSubtle,
        true: theme.success,
      }}
      thumbColor={theme.background}
    />
  );
}
