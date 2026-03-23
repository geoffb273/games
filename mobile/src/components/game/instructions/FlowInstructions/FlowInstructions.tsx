import React from 'react';
import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/common/Text';
import { InstructionBulletList } from '@/components/game/instructions/InstructionBulletList';
import { InstructionSection } from '@/components/game/instructions/InstructionSection';
import { Spacing } from '@/constants/token';

import { InstructionsFlowBoard } from './InstructionsFlowBoard';

export function FlowInstructions() {
  return (
    <>
      <InstructionSection title="Goal">
        <Text type="body" color="textSecondary">
          Connect all matching colored dots with continuous paths so that the entire board is
          filled. Paths cannot cross or overlap, and every cell on the board must belong to exactly
          one path when you finish.
        </Text>
      </InstructionSection>

      <InstructionSection title="Rules">
        <InstructionBulletList
          items={[
            'Each color appears exactly twice on the board—those two dots must be connected with a single continuous path.',
            'Paths can move up, down, left, or right, but never diagonally.',
            'Paths cannot cross each other or share cells; a cell can only belong to one path.',
            'To solve the puzzle, every cell on the board must be filled with a path and all color pairs must be connected.',
          ]}
        />

        <View style={styles.previewContainer}>
          <Text type="caption" color="textSecondary">
            Here&apos;s a tiny example board so you can see the dots you&apos;ll be connecting:
          </Text>
          <View style={styles.previewBoard}>
            <InstructionsFlowBoard />
          </View>
        </View>
      </InstructionSection>

      <InstructionSection title="Controls">
        <InstructionBulletList
          items={[
            'Tap and drag from a colored dot to draw a path toward its matching dot.',
            'You can only start drawing from a colored dot; ending on or next to the matching dot will complete the connection.',
            'Drag back over your existing path of the same color to reroute it, or tap either colored dot to clear that color path.',
          ]}
        />
      </InstructionSection>

      <InstructionSection title="Hints">
        <Text type="body" color="textSecondary">
          Tap the <Text type="emphasized_body">Hint</Text> button below the board to get help. A
          hint will either extend or adjust one of your paths to move you closer to a complete
          solution.
        </Text>
      </InstructionSection>

      <InstructionSection title="Tips">
        <InstructionBulletList
          items={[
            'Start with color pairs that are close together or have only one clear route between them.',
            'Use longer paths to carve out corridors that guide where other colors can go.',
            'If you get stuck, look for paths that trap empty cells or block other colors and try rerouting them.',
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
