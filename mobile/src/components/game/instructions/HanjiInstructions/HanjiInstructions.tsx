import React from 'react';
import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/common/Text';
import { InstructionBulletList } from '@/components/game/instructions/InstructionBulletList';
import { InstructionSection } from '@/components/game/instructions/InstructionSection';
import { Spacing } from '@/constants/token';

import { InstructionsHanjiBoard } from './InstructionsHanjiBoard';

export function HanjiInstructions() {
  return (
    <>
      <InstructionSection title="Goal">
        <Text type="body" color="textSecondary">
          Fill in the grid so that every row and column has blocks of filled cells that match the
          clue numbers. Each number is the length of a run of filled cells; numbers in a clue are in
          order, with at least one empty or marked cell between runs. When finished, every cell must
          be either filled or marked—no empty cells left.
        </Text>
      </InstructionSection>

      <InstructionSection title="Clues">
        <Text type="body" color="textSecondary">
          Numbers beside each row and above each column describe the runs of filled cells in that
          line. For example, a clue of <Text type="emphasized_body">2, 1</Text> means two
          consecutive filled cells, then a gap, then one filled cell. The order of numbers matches
          the order of runs from left to right (rows) or top to bottom (columns).
        </Text>

        <View style={styles.previewContainer}>
          <Text type="caption" color="textSecondary">
            Here&apos;s a tiny example board so you can see how the clues line up:
          </Text>
          <View style={styles.previewBoard}>
            <InstructionsHanjiBoard />
          </View>
        </View>
      </InstructionSection>

      <InstructionSection title="Controls">
        <InstructionBulletList
          items={[
            <>
              <Text type="emphasized_body">Tap</Text> a cell to cycle: empty → filled → marked →
              empty.
            </>,
            <>
              <Text type="emphasized_body">Long-press</Text> an empty or marked cell to toggle a ✕
              mark. Use marks for cells you know must stay empty.
            </>,
            'Empty cells are unshaded; filled cells are dark; marked cells show a ✕.',
          ]}
        />
      </InstructionSection>

      <InstructionSection title="Hints">
        <Text type="body" color="textSecondary">
          Tap the <Text type="emphasized_body">Hint</Text> button below the board to get a suggested
          cell to fill or clear, based on your current board state.
        </Text>
      </InstructionSection>

      <InstructionSection title="Tips">
        <InstructionBulletList
          items={[
            'Start with rows or columns that have one large run—you can often place part of it.',
            'Use marks (✕) to record cells that must be empty so you can focus on where filled blocks go.',
            'Compare clues with existing filled and marked cells to narrow down where the next run can be.',
          ]}
        />
      </InstructionSection>
    </>
  );
}

const styles = StyleSheet.create({
  previewContainer: {
    marginTop: Spacing.two,
    alignItems: 'center',
    gap: Spacing.one,
  },
  previewBoard: {
    marginTop: Spacing.one,
    alignItems: 'center',
  },
});
