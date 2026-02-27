import React from 'react';
import { useColorScheme } from 'react-native';

import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { ApolloProvider } from '@apollo/client/react';

import client from '@/client/apollo';
import AppTabs from '@/components/app-tabs';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  return (
    <ApolloProvider client={client}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <AppTabs />
      </ThemeProvider>
    </ApolloProvider>
  );
}
