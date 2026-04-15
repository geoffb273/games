import { StyleSheet, View } from 'react-native';

import { Stack, useLocalSearchParams } from 'expo-router';

import { GameView } from '@/components/view/GameView';

export default function GameScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <View style={styles.container}>
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
