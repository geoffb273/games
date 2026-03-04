import React from 'react';

import { Stack } from 'expo-router';

import { MainProvider } from '@/provider/MainProvider';

export default function RootLayout() {
  return (
    <MainProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="game/[id]" options={{ headerShown: true, title: '' }} />
      </Stack>
    </MainProvider>
  );
}
