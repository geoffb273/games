import { type ReactNode } from 'react';
import { useColorScheme } from 'react-native';

import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { ApolloProvider } from '@apollo/client/react';

import client from '@/client/apollo';

import { AuthProvider } from './AuthProvider';

export function MainProvider({ children }: { children: ReactNode }) {
  const colorScheme = useColorScheme();
  return (
    <ApolloProvider client={client}>
      <AuthProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          {children}
        </ThemeProvider>
      </AuthProvider>
    </ApolloProvider>
  );
}
