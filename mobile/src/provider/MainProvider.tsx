import { type ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { ApolloProvider } from '@apollo/client/react';

import client from '@/client/apollo';
import { Colors } from '@/constants/theme';

import { AuthFetchProvider } from './AuthFetchProvider';
import { InitialLoadGuard } from './InitialLoadGuard';

export function MainProvider({ children }: { children: ReactNode }) {
  const colorScheme = useColorScheme();
  const appColors = Colors[colorScheme === 'dark' ? 'dark' : 'light'];
  const navigationTheme = colorScheme === 'dark' ? DarkTheme : DefaultTheme;

  return (
    <GestureHandlerRootView>
      <ThemeProvider
        value={{
          ...navigationTheme,
          colors: {
            ...navigationTheme.colors,
            background: appColors.background,
            card: appColors.background,
            text: appColors.text,
            border: appColors.borderSubtle,
            primary: appColors.accentInk,
          },
        }}
      >
        <ApolloProvider client={client}>
          <AuthFetchProvider>
            <InitialLoadGuard>{children}</InitialLoadGuard>
          </AuthFetchProvider>
        </ApolloProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
