import { type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/common/Text';
import { Radii, Spacing } from '@/constants/token';
import { useTheme } from '@/hooks/useTheme';
import { formatDuration } from '@/utils/timeUtils';

export const SHARE_ASSET_CARD_WIDTH = 560;
export const SHARE_ASSET_CONTENT_TARGET_SIZE = 300;

type ShareAssetCardProps = {
  title: string;
  durationMs: number | null | undefined;
  children: ReactNode;
};

/**
 * Shared result card layout for off-platform game share assets.
 */
export function ShareAssetCard({ title, durationMs, children }: ShareAssetCardProps) {
  const theme = useTheme();
  const formattedDuration = formatDuration(durationMs);

  return (
    <View style={[styles.card, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Text type="h3" textAlign="center">
          {title}
        </Text>
      </View>

      <View style={styles.duration}>
        <Text type="caption" color="textSecondary">
          SOLVED IN
        </Text>
        <Text type="h1" textAlign="center" numberOfLines={1} style={styles.durationText}>
          {formattedDuration ?? '—'}
        </Text>
      </View>

      <View style={[styles.divider, { backgroundColor: theme.rule }]} />

      <View style={styles.content}>{children}</View>
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
  durationText: {
    fontSize: 64,
    lineHeight: 70,
  },
  divider: {
    height: 1,
    alignSelf: 'stretch',
  },
  content: {
    alignItems: 'center',
  },
});
