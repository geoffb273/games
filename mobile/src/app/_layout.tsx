import React from 'react';

import { Stack } from 'expo-router';

import { GlobalErrorBoundary } from '@/components/common/GlobalErrorBoundary';
import { useTheme } from '@/hooks/useTheme';
import { MainProvider } from '@/provider/MainProvider';

function RootLayoutInner() {
  const theme = useTheme();

  return (
    <MainProvider>
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
    </MainProvider>
  );
}

export default function RootLayout() {
  return (
    <GlobalErrorBoundary>
      <RootLayoutInner />
    </GlobalErrorBoundary>
  );
}
