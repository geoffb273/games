import { Stack } from 'expo-router';

import { COLOR } from '@/constants/color';
import { useTheme } from '@/hooks/useTheme';

export function RootNavigator() {
  const theme = useTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        headerStyle: { backgroundColor: COLOR.transparent },
        contentStyle: { backgroundColor: COLOR.transparent },
      }}
    >
      <Stack.Screen
        name="(tabs)"
        options={{ contentStyle: { backgroundColor: COLOR.transparent } }}
      />
      <Stack.Screen
        name="game/[id]"
        options={{
          headerShown: true,
          title: 'Puzzle',
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
