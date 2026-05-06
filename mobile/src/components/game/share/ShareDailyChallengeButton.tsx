import { type Ref } from 'react';
import { StyleSheet, View } from 'react-native';

import { areAllDailyPuzzlesAttempted } from '@/api/puzzle/puzzle';
import { usePuzzlesQuery } from '@/api/puzzle/puzzlesQuery';
import { type ButtonAlign, type ButtonVariant } from '@/components/common/Button';
import { IconChip } from '@/components/common/IconChip';
import { Text } from '@/components/common/Text';
import { PUZZLE_CARD_NORMAL_HEIGHT } from '@/components/PuzzleCard';
import { Radii, Spacing } from '@/constants/token';
import { useTheme } from '@/hooks/useTheme';
import { getColorWithOpacity } from '@/utils/colorUtils';

import { ShareDailyChallengeCard } from './ShareDailyChallengeCard';
import { ShareResultButton, type ShareResultButtonRef } from './ShareResultButton';

type ShareDailyChallengeButtonProps = {
  ref?: Ref<ShareResultButtonRef>;
  dailyChallengeId: string;
  variant?: ButtonVariant;
  align?: ButtonAlign;
};

export function ShareDailyChallengeButton({
  ref,
  dailyChallengeId,
}: ShareDailyChallengeButtonProps) {
  const { puzzles, isLoading, isError } = usePuzzlesQuery({ dailyChallengeId, cacheOnly: true });

  if (isLoading || isError || puzzles == null) {
    return null;
  }

  if (!areAllDailyPuzzlesAttempted(puzzles)) {
    return null;
  }

  return (
    <ShareResultButton ref={ref} type="custom" trigger={<ShareDailyChallengeButtonTrigger />}>
      <ShareDailyChallengeCard puzzles={puzzles} />
    </ShareResultButton>
  );
}

function ShareDailyChallengeButtonTrigger() {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.completeChallengeViewContainer,
        { backgroundColor: theme.backgroundElement, borderColor: theme.borderSubtle },
      ]}
    >
      <IconChip
        name="export-variant"
        size="md"
        iconColor={theme.text}
        backgroundColor={getColorWithOpacity(theme.text, 0.5)}
      />
      <View style={styles.triggerCopy}>
        <Text type="h3" numberOfLines={1}>
          Today complete
        </Text>
        <Text type="caption" color="textSecondary" numberOfLines={2}>
          Share your results with friends
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  triggerCopy: {
    gap: Spacing.one,
    paddingHorizontal: Spacing.two,
    maxWidth: '100%',
  },
  completeChallengeViewContainer: {
    gap: Spacing.three,
    padding: Spacing.three,
    height: PUZZLE_CARD_NORMAL_HEIGHT,
    overflow: 'visible',
    borderWidth: 1,
    borderRadius: Radii.md,
    alignItems: 'center',
    flexDirection: 'row',
  },
});
