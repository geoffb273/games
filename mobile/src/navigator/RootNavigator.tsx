import { Stack } from 'expo-router';

import { useTheme } from '@/hooks/useTheme';

export function RootNavigator() {
  const theme = useTheme();

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="game/[id]"
        options={{
          headerShown: true,
          title: 'Puzzle',
          headerStyle: { backgroundColor: theme.background },
          headerTitleStyle: { color: theme.text },
          headerTintColor: theme.accentInk,
          headerShadowVisible: false,
        }}
      />
      <Stack.Screen
        name="game/[type]/instructions"
        options={{
          presentation: 'modal',
          headerShown: false,
        }}
      />
    </Stack>
  );
}
