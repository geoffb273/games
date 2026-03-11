import React from 'react';

import { Text } from '@/components/common/Text';

import { InstructionBulletList } from './InstructionBulletList';
import { InstructionSection } from './InstructionSection';

export function HashiInstructions() {
  return (
    <>
      <InstructionSection title="Goal">
        <Text type="body" color="textSecondary">
          Connect all islands with bridges so that each island has exactly the number of bridges
          shown on it. Every island must be reachable from every other island when you are done.
        </Text>
      </InstructionSection>

      <InstructionSection title="Rules">
        <InstructionBulletList
          items={[
            'Islands are circles with numbers. The number is how many bridges must connect to that island.',
            <>
              Draw bridges between islands by tapping or dragging. Bridges run only{' '}
              <Text type="emphasized_body">horizontally</Text> or{' '}
              <Text type="emphasized_body">vertically</Text>, never diagonally.
            </>,
            'Between any two islands you may place one or two bridges (single or double).',
            'Bridges cannot cross each other and cannot cross islands.',
            'Each pair of islands can have at most two bridges between them.',
          ]}
        />
      </InstructionSection>

      <InstructionSection title="Controls">
        <InstructionBulletList
          items={[
            'Tap an island, then tap another island in the same row or column to draw a bridge between them.',
            'Tap an existing bridge to add a second bridge (double) between the same two islands, if the island numbers allow it.',
            'Tap a double bridge once to remove one bridge; tap again to remove both.',
          ]}
        />
      </InstructionSection>

      <InstructionSection title="Hints">
        <Text type="body" color="textSecondary">
          Tap the <Text type="emphasized_body">Hint</Text> button below the board to get a suggested
          bridge to place, based on your current board state.
        </Text>
      </InstructionSection>

      <InstructionSection title="Tips">
        <InstructionBulletList
          items={[
            'Start with islands that have high numbers or few possible neighbors—their bridges are often forced.',
            'Islands with "1" can have only one bridge; islands with "8" need four double bridges (or equivalent).',
            'Make sure the final network is one connected group: every island must be linked to every other.',
          ]}
        />
      </InstructionSection>
    </>
  );
}
