import React from 'react';
import { StyleSheet, View } from 'react-native';

import { PuzzleType } from '@/api/puzzle/puzzle';
import { Text } from '@/components/common/Text';
import { InstructionBulletList } from '@/components/game/instructions/InstructionBulletList';
import { InstructionSection } from '@/components/game/instructions/InstructionSection';
import { PuzzleBoard } from '@/components/game/PuzzleBoard';
import { Spacing } from '@/constants/token';

export function HashiInstructions() {
  return (
    <>
      <InstructionSection title="Goal">
        <Text type="body" color="textSecondary">
          Connect islands with bridges so each island matches its number. All islands must form one
          connected network.
        </Text>
      </InstructionSection>

      <InstructionSection title="Rules">
        <InstructionBulletList
          items={[
            'Each island number is how many bridges must touch that island.',
            <>
              Bridges run only <Text type="emphasized_body">horizontally</Text> or{' '}
              <Text type="emphasized_body">vertically</Text>.
            </>,
            <>
              Bridges never run <Text type="emphasized_body">diagonally</Text>.
            </>,
            'Between two islands, place up to two bridges.',
            'Bridges cannot cross other bridges or islands.',
          ]}
        />
        <View style={styles.previewContainer}>
          <View style={styles.previewBoard}>
            <PuzzleBoard puzzleType={PuzzleType.Hashi} variant="instructions" />
          </View>
        </View>
      </InstructionSection>

      <InstructionSection title="Controls">
        <InstructionBulletList
          items={[
            'Tap between two islands: none -> single -> double -> none.',
            'Or tap one island, then another, to cycle that bridge.',
            'You can overfill while solving; island numbers show the target.',
          ]}
        />
      </InstructionSection>

      <InstructionSection title="Hints">
        <Text type="body" color="textSecondary">
          Tap the <Text type="emphasized_body">Hint</Text> button for a suggested bridge.
        </Text>
      </InstructionSection>

      <InstructionSection title="Tips">
        <InstructionBulletList
          items={[
            'Start with islands that have high numbers or few neighbors.',
            'A "1" has one bridge. An "8" needs four double bridges (or equivalent).',
            'Keep one connected network across all islands.',
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
    alignItems: 'center',
  },
});
