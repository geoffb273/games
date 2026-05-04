import React from 'react';

import { Tabs } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';

import { Spacing } from '@/constants/token';
import { useTheme } from '@/hooks/useTheme';

function HomeTabIcon({ color, size }: { color?: string; size?: number }) {
  const theme = useTheme();
  return <FontAwesome name="home" size={size ?? 24} color={color ?? theme.text} />;
}

function SettingsTabIcon({ color, size }: { color?: string; size?: number }) {
  const theme = useTheme();
  return <FontAwesome name="cog" size={size ?? 24} color={color ?? theme.textSecondary} />;
}

export function AppTabs() {
  const theme = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.text,
        tabBarInactiveTintColor: theme.rule,
        tabBarStyle: {
          backgroundColor: theme.background,
          borderTopColor: theme.borderSubtle,
          paddingTop: Spacing.two,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: HomeTabIcon,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: SettingsTabIcon,
        }}
      />
    </Tabs>
  );
}
