import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@/components/common/Text';
import { Toggle } from '@/components/common/Toggle';
import { Radii, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { setHapticsPreference, useHapticsPreference } from '@/store/hapticsStore';
import { setThemePreference, useThemePreference } from '@/store/themeStore';

export function SettingsView() {
  const theme = useTheme();
  const { preference } = useThemePreference();
  const { preference: hapticsPreference } = useHapticsPreference();

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <Text type="h2">Settings</Text>
          <Text type="caption" color="textSecondary">
            Manage your app preferences.
          </Text>
        </View>

        <View style={styles.settingsSection}>
          <SettingsRow
            title="Haptics"
            description="Enable or disable haptic feedback throughout the app"
            rightContent={
              <Toggle
                value={hapticsPreference === 'on'}
                onValueChange={(isOn) => setHapticsPreference(isOn ? 'on' : 'off')}
              />
            }
          />

          <SettingsRow
            title="Dark Mode"
            description="Use a dark appearance throughout the app"
            rightContent={
              <Toggle
                value={preference === 'dark'}
                onValueChange={(isDark) => setThemePreference(isDark ? 'dark' : 'light')}
              />
            }
          />
        </View>
      </SafeAreaView>
    </View>
  );
}

type SettingsRowProps = {
  title: string;
  description: string;
  rightContent: React.ReactNode;
};

function SettingsRow({ title, description, rightContent }: SettingsRowProps) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.settingRow,
        {
          backgroundColor: theme.backgroundElement,
          borderColor: theme.borderSubtle,
        },
      ]}
    >
      <View style={styles.settingText}>
        <Text type="emphasized_body">{title}</Text>
        <Text type="caption" color="textSecondary">
          {description}
        </Text>
      </View>

      {rightContent}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: Spacing.four,
  },
  settingsSection: {
    gap: Spacing.two,
  },
  header: {
    gap: Spacing.half,
    paddingBottom: Spacing.three,
  },
  settingRow: {
    borderWidth: 1,
    borderRadius: Radii.md,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  settingText: {
    flex: 1,
    gap: Spacing.one,
  },
});
