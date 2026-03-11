import React from 'react';

import { Text } from '@/components/common/Text';

import { InstructionBulletList } from './InstructionBulletList';
import { InstructionSection } from './InstructionSection';

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
      </InstructionSection>

      <InstructionSection title="Controls">
        <InstructionBulletList
          items={[
            'Tap and drag from a colored dot to draw a path to its matching dot.',
            'Drag back over an existing path of the same color to change its route.',
            'If a path blocks another color, redraw or erase it to free up space.',
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
