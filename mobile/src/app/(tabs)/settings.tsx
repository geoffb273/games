import { useState } from 'react';
import { StyleSheet, Switch, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@/components/common/Text';
import { Radii, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

export default function SettingsScreen() {
  const theme = useTheme();
  const [soundEnabled, setSoundEnabled] = useState(true);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <Text type="h2">Settings</Text>
          <Text type="caption" color="textSecondary">
            Manage your app preferences.
          </Text>
        </View>

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
            <Text type="emphasized_body">Sound Effects</Text>
            <Text type="caption" color="textSecondary">
              Toggle in-game sound effects on or off.
            </Text>
          </View>

          <Switch
            value={soundEnabled}
            onValueChange={setSoundEnabled}
            trackColor={{
              false: theme.borderSubtle,
              true: theme.success,
            }}
            thumbColor={theme.background}
          />
        </View>
      </SafeAreaView>
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
