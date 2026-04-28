import { type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/common/Text';
import { Radii, Spacing } from '@/constants/token';
import { useTheme } from '@/hooks/useTheme';
import { formatDailyChallengeDate, formatDuration } from '@/utils/timeUtils';

export const SHARE_ASSET_CARD_WIDTH = 560;
export const SHARE_ASSET_CONTENT_TARGET_SIZE = 300;

type ShareAssetCardProps = {
  title: string;
  dailyChallengeDate?: Date | null;
  durationMs: number | null | undefined;
  children: ReactNode;
};

/**
 * Shared result card layout for off-platform game share assets.
 */
export function ShareAssetCard({
  title,
  dailyChallengeDate,
  durationMs,
  children,
}: ShareAssetCardProps) {
  const theme = useTheme();
  const formattedDuration = formatDuration(durationMs);
  const formattedChallengeDate =
    dailyChallengeDate != null ? formatDailyChallengeDate(dailyChallengeDate) : null;

  return (
    <View style={[styles.card, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Text type="caption" color="textSecondary" textAlign="center">
          Game Brain
        </Text>
        <Text type="h1" textAlign="center">
          {title}
        </Text>
        {formattedChallengeDate != null && (
          <Text type="caption" color="textSecondary" textAlign="center">
            Daily · {formattedChallengeDate}
          </Text>
        )}
      </View>

      <View style={[styles.divider, { backgroundColor: theme.rule }]} />
      <View style={styles.content}>{children}</View>

      {formattedDuration != null && (
        <>
          <View style={[styles.divider, { backgroundColor: theme.rule }]} />
          <View style={styles.duration}>
            <Text type="caption" color="textSecondary">
              SOLVED IN
            </Text>
            <Text type="h1" textAlign="center" numberOfLines={1}>
              {formattedDuration}
            </Text>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: SHARE_ASSET_CARD_WIDTH,
    paddingVertical: Spacing.four,
    paddingHorizontal: Spacing.four,
    borderRadius: Radii.lg,
    alignItems: 'center',
    gap: Spacing.four,
  },
  header: {
    alignItems: 'center',
    gap: Spacing.one,
  },
  duration: {
    alignItems: 'center',
    gap: Spacing.one,
  },
  divider: {
    height: 1,
    alignSelf: 'stretch',
  },
  content: {
    alignItems: 'center',
  },
});
