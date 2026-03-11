import React from 'react';

import { Text } from '@/components/common/Text';

import { InstructionBulletList } from './InstructionBulletList';
import { InstructionSection } from './InstructionSection';

export function MinesweeperInstructions() {
  return (
    <>
      <InstructionSection title="Goal">
        <Text type="body" color="textSecondary">
          Reveal every safe square on the board without tapping on a mine. If you reveal a mine, the
          game is over. Once every safe square is revealed, you win
        </Text>
      </InstructionSection>

      <InstructionSection title="Controls">
        <InstructionBulletList
          items={[
            <>
              Use the toolbar toggle to switch between <Text type="emphasized_body">Flag</Text> and{' '}
              <Text type="emphasized_body">Reveal</Text> modes.
            </>,
            <>
              In <Text type="emphasized_body">Reveal</Text> mode, tap a hidden square to uncover it.
            </>,
            <>
              In <Text type="emphasized_body">Flag</Text> mode, tap a hidden square to place or
              remove a flag where you think a mine is.
            </>,
            'You can also long-press a hidden square to quickly place or remove a flag.',
          ]}
        />
      </InstructionSection>

      <InstructionSection title="Numbers">
        <Text type="body" color="textSecondary">
          When you reveal a safe square, it may show a number. That number tells you how many mines
          are in the 8 surrounding squares. Use these clues to decide where it is safe to reveal
          next and where mines must be flagged.
        </Text>
      </InstructionSection>

      <InstructionSection title="Hints">
        <Text type="body" color="textSecondary">
          Tap the <Text type="emphasized_body">Hint</Text> button below the board to get help. A
          hint will either safely reveal a square or flag a square that contains a mine, based on
          your current board state.
        </Text>
      </InstructionSection>

      <InstructionSection title="Tips">
        <InstructionBulletList
          items={[
            'Start by revealing squares away from the edges to open up the board.',
            'Look for places where the numbers make a move certain before taking guesses.',
            'Use flags to keep track of suspected mines so you do not tap them by mistake.',
          ]}
        />
      </InstructionSection>
    </>
  );
}
