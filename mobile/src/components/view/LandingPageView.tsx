import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PuzzleType } from '@/api/puzzle/puzzle';
import { AppLogo } from '@/components/common/AppLogo';
import { PuzzleIcon } from '@/components/common/PuzzleIcon';
import { Spacing } from '@/constants/theme';

export function LandingPageView() {
  const { top, bottom } = useSafeAreaInsets();
  return (
    <View style={styles.container}>
      <View style={[styles.topLeftIcon, { paddingTop: top }]}>
        <PuzzleIcon type={PuzzleType.Flow} size="md" style={styles.topLeftRotate} />
      </View>
      <View style={[styles.topRightIcon, { paddingTop: top }]}>
        <PuzzleIcon type={PuzzleType.Hanji} size="md" style={styles.topRightRotate} />
      </View>

      <View style={[styles.bottomLeftIcon, { paddingBottom: bottom }]}>
        <PuzzleIcon type={PuzzleType.Minesweeper} size="md" style={styles.bottomLeftRotate} />
      </View>
      <View style={[styles.bottomRightIcon, { paddingBottom: bottom }]}>
        <PuzzleIcon type={PuzzleType.Slitherlink} size="md" style={styles.bottomRightRotate} />
      </View>

      <View style={styles.centerContent}>
        <PuzzleIcon type={PuzzleType.Hashi} size="lg" />
        <AppLogo />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.four,
  },
  centerContent: {
    alignItems: 'center',
    gap: Spacing.two,
  },
  topLeftIcon: {
    position: 'absolute',
    top: 12,
    left: 24,
  },
  bottomLeftRotate: {
    transform: [{ rotate: '-30deg' }],
  },
  topLeftRotate: {
    transform: [{ rotate: '-30deg' }],
  },
  topRightIcon: {
    position: 'absolute',
    top: 12,
    right: 24,
  },
  topRightRotate: {
    transform: [{ rotate: '30deg' }],
  },
  bottomLeftIcon: {
    position: 'absolute',
    bottom: 12,
    left: 24,
  },
  bottomRightIcon: {
    position: 'absolute',
    bottom: 12,
    right: 24,
  },
  bottomRightRotate: {
    transform: [{ rotate: '30deg' }],
  },
});
