import React from 'react';

import { Text } from '@/components/common/Text';

import { InstructionBulletList } from './InstructionBulletList';
import { InstructionSection } from './InstructionSection';

export function SlitherlinkInstructions() {
  return (
    <>
      <InstructionSection title="Goal">
        <Text type="body" color="textSecondary">
          Draw a single continuous loop around the grid by placing lines along the edges of cells.
          The loop cannot cross itself or branch, and it must eventually return to where it started.
        </Text>
      </InstructionSection>

      <InstructionSection title="Rules">
        <InstructionBulletList
          items={[
            'Numbers inside cells tell you exactly how many of that cell’s four edges must be part of the loop.',
            'Blank cells have no restriction—they can have any number of loop edges from 0 to 4.',
            'The loop must be a single, unbroken cycle: no forks, dead ends, or separate smaller loops.',
            'Lines run only along the grid edges between dots; they never cut through cells or cross each other.',
          ]}
        />
      </InstructionSection>

      <InstructionSection title="Controls">
        <InstructionBulletList
          items={[
            <>
              <Text type="emphasized_body">Tap</Text> an edge between two dots to toggle a loop line
              on or off.
            </>,
            <>
              <Text type="emphasized_body">Long-press</Text> an edge to mark it as definitely empty,
              helping you remember where the loop cannot go.
            </>,
            'Use marked edges to rule out paths and focus on where the loop must pass.',
          ]}
        />
      </InstructionSection>

      <InstructionSection title="Hints">
        <Text type="body" color="textSecondary">
          Tap the <Text type="emphasized_body">Hint</Text> button below the board to get help. A
          hint will suggest adding or removing a line in a place that follows the rules and moves
          you closer to a complete loop.
        </Text>
      </InstructionSection>

      <InstructionSection title="Tips">
        <InstructionBulletList
          items={[
            'Start with cells that have 0 or 3–4 as clues; their edges are often forced.',
            'A cell with 0 means none of its edges can be part of the loop—mark them all empty.',
            'A cell with 3 or 4 must have most or all of its edges filled; use that to constrain neighbors.',
            'Remember that the final loop has no branches: avoid creating T-junctions or dead-end lines.',
          ]}
        />
      </InstructionSection>
    </>
  );
}
