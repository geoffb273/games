import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { useLocalSearchParams } from 'expo-router';

import { type Puzzle } from '@/api/puzzle/puzzle';
import { usePuzzleQuery } from '@/api/puzzle/puzzleQuery';
import { Text } from '@/components/common/Text';
import { HanjiBoard } from '@/components/game/HanjiBoard';
import { HashiBoard } from '@/components/game/HashiBoard';
import { MinesweeperBoard } from '@/components/game/MinesweeperBoard/MinesweeperBoard';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

export default function GameScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { puzzle, isLoading, isError, isNotFound } = usePuzzleQuery({ id });
  const theme = useTheme();

  if (isLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.text} />
      </View>
    );
  }

  if (isNotFound) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.background }]}>
        <Text type="h3" textAlign="center">
          Puzzle not found
        </Text>
      </View>
    );
  }

  if (isError || puzzle == null) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.background }]}>
        <Text type="h3" textAlign="center">
          Something went wrong
        </Text>
        <Text type="body" color="textSecondary" textAlign="center">
          Unable to load puzzle
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
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
