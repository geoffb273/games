import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { Stack, useLocalSearchParams } from 'expo-router';

import { type Puzzle } from '@/api/puzzle/puzzle';
import { usePuzzleQuery } from '@/api/puzzle/puzzleQuery';
import { ErrorView } from '@/components/common/ErrorView';
import { HanjiBoard } from '@/components/game/HanjiBoard/HanjiBoard';
import { HashiBoard } from '@/components/game/HashiBoard/HashiBoard';
import { MinesweeperBoard } from '@/components/game/MinesweeperBoard/MinesweeperBoard';
import { PuzzleCompletedView } from '@/components/game/PuzzleCompletedView';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

export default function GameScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { puzzle, isLoading, isError, isNotFound } = usePuzzleQuery({ id });
  const theme = useTheme();

  if (isLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.background }]}>
        <Stack.Screen options={{ title: 'Puzzle', headerBackTitle: 'Book' }} />
        <ActivityIndicator size="large" color={theme.text} />
      </View>
    );
  }

  if (isNotFound) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.background }]}>
        <Stack.Screen options={{ title: 'Puzzle', headerBackTitle: 'Book' }} />
        <ErrorView title="Puzzle not found" />
      </View>
    );
  }

  if (isError || puzzle == null) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.background }]}>
        <Stack.Screen options={{ title: 'Puzzle', headerBackTitle: 'Book' }} />
        <ErrorView message="Unable to load puzzle" />
      </View>
    );
  }

  if (puzzle.attempt != null) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <Stack.Screen options={{ title: puzzle.name, headerBackTitle: 'Book' }} />
        <PuzzleCompletedView
          puzzleType={puzzle.type}
          solved={puzzle.attempt.completedAt != null}
          durationMs={puzzle.attempt.durationMs}
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Stack.Screen options={{ title: puzzle.name, headerBackTitle: 'Book' }} />
      <PuzzleBoard puzzle={puzzle} />
    </View>
  );
}

function PuzzleBoard({ puzzle }: { puzzle: Puzzle }) {
  switch (puzzle.type) {
    case 'HANJI':
      return <HanjiBoard puzzle={puzzle} />;
    case 'HASHI':
      return <HashiBoard puzzle={puzzle} />;
    case 'MINESWEEPER':
      return <MinesweeperBoard puzzle={puzzle} />;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.four,
  },
});
