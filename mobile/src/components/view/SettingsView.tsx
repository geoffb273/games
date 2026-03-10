import React from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useApolloClient } from '@apollo/client/react';

import { useDeleteProgress } from '@/api/user/deleteProgressMutation';
import { Button } from '@/components/common/Button';
import { Text } from '@/components/common/Text';
import { Toggle } from '@/components/common/Toggle';
import { Radii, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { setHapticsPreference, useHapticsPreference } from '@/store/hapticsStore';
import { setThemePreference, useThemePreference } from '@/store/themeStore';
import { clearToken } from '@/store/token';

export function SettingsView() {
  const theme = useTheme();
  const client = useApolloClient();
  const { preference } = useThemePreference();
  const { preference: hapticsPreference } = useHapticsPreference();
  const { deleteProgress, isLoading: isDeleting } = useDeleteProgress();

  const handleDeleteProgress = () => {
    Alert.alert(
      'Delete all progress?',
      'This will delete your account and all puzzle attempts. This cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              try {
                await deleteProgress();
                await clearToken();
                await client.clearStore();
              } catch {
                Alert.alert(
                  'Unable to delete progress',
                  'Something went wrong while deleting your progress. Please try again.',
                );
              }
            })();
          },
        },
      ],
    );
  };

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

          <View style={styles.dangerSection}>
            <Text type="emphasized_body" color="text">
              Danger zone
            </Text>
            <Text type="caption" color="textSecondary">
              Delete your account and all puzzle progress. This cannot be undone.
            </Text>

            <Button
              variant="secondary"
              onPress={handleDeleteProgress}
              disabled={isDeleting}
              fullWidth
            >
              {isDeleting ? 'Deleting progress…' : 'Delete all progress'}
            </Button>
          </View>
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
  dangerSection: {
    marginTop: Spacing.four,
    gap: Spacing.one,
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
