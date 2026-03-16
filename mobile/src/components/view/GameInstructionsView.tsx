import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useRouter } from 'expo-router';

import { PuzzleType } from '@/api/puzzle/puzzle';
import { Button } from '@/components/common/Button';
import { Text } from '@/components/common/Text';
import { FlowInstructions } from '@/components/game/instructions/FlowInstructions/FlowInstructions';
import { HanjiInstructions } from '@/components/game/instructions/HanjiInstructions/HanjiInstructions';
import { HashiInstructions } from '@/components/game/instructions/HashiInstructions';
import { MinesweeperInstructions } from '@/components/game/instructions/MinesweeperInstructions';
import { SlitherlinkInstructions } from '@/components/game/instructions/SlitherlinkInstructions';
import { Radii, Spacing } from '@/constants/token';
import { useTheme } from '@/hooks/useTheme';
import { passiveExhaustiveGuard } from '@/utils/guardUtils';

const PUZZLE_TYPE_TO_TITLE: Record<PuzzleType, string> = {
  [PuzzleType.Minesweeper]: 'Minesweeper',
  [PuzzleType.Hashi]: 'Hashi',
  [PuzzleType.Flow]: 'Flow',
  [PuzzleType.Hanji]: 'Hanji',
  [PuzzleType.Slitherlink]: 'Slitherlink',
};

export function GameInstructionsView({ puzzleType }: { puzzleType: PuzzleType }) {
  const theme = useTheme();
  const router = useRouter();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.sheet}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text type="h2">How to play {PUZZLE_TYPE_TO_TITLE[puzzleType]}</Text>
            <Text type="caption" color="textSecondary">
              Learn the basics of the game and how controls work.
            </Text>
          </View>
          <InstructionsContent puzzleType={puzzleType} />
        </ScrollView>
        <View style={styles.footer}>
          <Button variant="primary" fullWidth onPress={() => router.back()}>
            Got it
          </Button>
        </View>
      </View>
    </SafeAreaView>
  );
}

function InstructionsContent({ puzzleType }: { puzzleType: PuzzleType }) {
  switch (puzzleType) {
    case PuzzleType.Hashi:
      return <HashiInstructions />;
    case PuzzleType.Minesweeper:
      return <MinesweeperInstructions />;
    case PuzzleType.Flow:
      return <FlowInstructions />;
    case PuzzleType.Hanji:
      return <HanjiInstructions />;
    case PuzzleType.Slitherlink:
      return <SlitherlinkInstructions />;
    default:
      return passiveExhaustiveGuard(puzzleType);
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  footer: {
    marginTop: Spacing.two,
  },
  sheet: {
    paddingHorizontal: Spacing.four,
    gap: Spacing.three,
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    borderRadius: Radii.md,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    gap: Spacing.three,
  },
  header: {
    gap: Spacing.half,
    paddingTop: Spacing.three,
  },
});
