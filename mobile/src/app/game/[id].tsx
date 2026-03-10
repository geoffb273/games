import { StyleSheet, View } from 'react-native';

import { Stack, useLocalSearchParams } from 'expo-router';

import { GameView } from '@/components/view/GameView';
import { useTheme } from '@/hooks/useTheme';

export default function GameScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Stack.Screen options={{ title: '', headerBackButtonDisplayMode: 'minimal' }} />
      <GameView id={id} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
