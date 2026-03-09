import { StyleSheet, View } from 'react-native';

import { type Puzzle } from '@/api/puzzle/puzzle';
import { usePuzzleQuery } from '@/api/puzzle/puzzleQuery';
import { ErrorView } from '@/components/common/ErrorView';
import { HanjiBoard } from '@/components/game/HanjiBoard/HanjiBoard';
import { HashiBoard } from '@/components/game/HashiBoard/HashiBoard';
import { MinesweeperBoard } from '@/components/game/MinesweeperBoard/MinesweeperBoard';
import { PuzzleCompletedView } from '@/components/game/PuzzleCompletedView';
import { SlitherlinkBoard } from '@/components/game/SlitherlinkBoard/SlitherlinkBoard';
import { Spacing } from '@/constants/theme';

export function GameView({ id }: { id: string }) {
  const { puzzle, isLoading, isError, isNotFound } = usePuzzleQuery({ id });

  const isPuzzleMissing = !isLoading && puzzle == null;

  if (isNotFound && !isLoading) {
    return (
      <View style={styles.centered}>
        <ErrorView title="Puzzle not found" />
      </View>
    );
  }

  if (isError || isPuzzleMissing) {
    return (
      <View style={styles.centered}>
        <ErrorView message="Unable to load puzzle" />
      </View>
    );
  }

  if (puzzle?.attempt != null) {
    return (
      <PuzzleCompletedView
        puzzleType={puzzle.type}
        solved={puzzle.attempt.completedAt != null}
        durationMs={puzzle.attempt.durationMs}
      />
    );
  }

  if (puzzle == null) {
    return null;
  }

  return <PuzzleBoard puzzle={puzzle} />;
}

function PuzzleBoard({ puzzle }: { puzzle: Puzzle }) {
  switch (puzzle.type) {
    case 'HANJI':
      return <HanjiBoard puzzle={puzzle} />;
    case 'HASHI':
      return <HashiBoard puzzle={puzzle} />;
    case 'MINESWEEPER':
      return <MinesweeperBoard puzzle={puzzle} />;
    case 'SLITHERLINK':
      return <SlitherlinkBoard puzzle={puzzle} />;
  }
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.four,
  },
});
