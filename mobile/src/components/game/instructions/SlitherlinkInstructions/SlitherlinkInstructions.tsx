import React from 'react';
import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/common/Text';
import { InstructionBulletList } from '@/components/game/instructions/InstructionBulletList';
import { InstructionSection } from '@/components/game/instructions/InstructionSection';
import { Spacing } from '@/constants/token';

import { InstructionsSlitherlinkBoard } from './InstructionsSlitherlinkBoard';

export function SlitherlinkInstructions() {
  return (
    <>
      <InstructionSection title="Goal">
        <Text type="body" color="textSecondary">
          Draw one closed loop on the grid.
        </Text>
      </InstructionSection>

      <InstructionSection title="Rules">
        <InstructionBulletList
          items={[
            'A number tells how many of the 4 edges are part of the loop.',
            'Blank cells have no count rule.',
            'The final path is one loop: no forks, dead ends, or extra loops.',
            'Lines go only on grid edges.',
          ]}
        />
        <View style={styles.previewContainer}>
          <View style={styles.previewBoard}>
            <InstructionsSlitherlinkBoard />
          </View>
        </View>
      </InstructionSection>

      <InstructionSection title="Controls">
        <InstructionBulletList
          items={[
            <>
              <Text type="emphasized_body">Tap</Text> an edge to toggle a line.
            </>,
            'Use line and empty marks to narrow options.',
          ]}
        />
      </InstructionSection>

      <InstructionSection title="Hints">
        <Text type="body" color="textSecondary">
          Tap <Text type="emphasized_body">Hint</Text> for a suggested line change.
        </Text>
      </InstructionSection>

      <InstructionSection title="Tips">
        <InstructionBulletList
          items={[
            'Start with 0, 3, and 4 clues.',
            'A 0 cell has no loop edges.',
            'A 3 or 4 cell forces many edges.',
            'Avoid T-junctions and dead ends.',
          ]}
        />
      </InstructionSection>
    </>
  );
}

const styles = StyleSheet.create({
  previewContainer: {
    alignItems: 'center',
    gap: Spacing.one,
  },
  previewBoard: {
    marginTop: Spacing.one,
    alignItems: 'center',
  },
});
