import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LinearGradient } from 'expo-linear-gradient';

import { PuzzleType } from '@/api/puzzle/puzzle';
import { AppLogo } from '@/components/common/AppLogo';
import { PuzzleIcon } from '@/components/common/PuzzleIcon';
import { Shadows, Spacing } from '@/constants/token';
import { useTheme } from '@/hooks/useTheme';
import { getColorWithOpacity } from '@/utils/colorUtils';

export function LandingPageView() {
  const { top, bottom } = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <BackgroundLayers />
      <View style={[styles.iconContainer, styles.topLeftIcon, { paddingTop: top }]}>
        <PuzzleIcon type={PuzzleType.Flow} size="lg" style={styles.topLeftRotate} />
      </View>
      <View style={[styles.iconContainer, styles.topRightIcon, { paddingTop: top }]}>
        <PuzzleIcon type={PuzzleType.Hanji} size="lg" style={styles.topRightRotate} />
      </View>

      <View style={[styles.iconContainer, styles.bottomLeftIcon, { paddingBottom: bottom }]}>
        <PuzzleIcon type={PuzzleType.Minesweeper} size="lg" style={styles.bottomLeftRotate} />
      </View>
      <View style={[styles.iconContainer, styles.bottomRightIcon, { paddingBottom: bottom }]}>
        <PuzzleIcon type={PuzzleType.Slitherlink} size="lg" style={styles.bottomRightRotate} />
      </View>

      <View style={styles.centerContent}>
        <View style={styles.iconContainer}>
          <PuzzleIcon type={PuzzleType.Hashi} size="xl" />
        </View>
        <AppLogo />
      </View>
    </View>
  );
}

export function BackgroundLayers() {
  const theme = useTheme();

  return (
    <View style={styles.backgroundLayers}>
      <LinearGradient
        colors={[theme.highlightWash, theme.background, theme.highlightWash]}
        locations={[0, 0.5, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={[
          getColorWithOpacity(theme.backgroundElement, 0),
          getColorWithOpacity(theme.backgroundElement, 0.22),
          getColorWithOpacity(theme.backgroundElement, 0),
        ]}
        locations={[0.15, 0.5, 0.85]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View
        style={[
          styles.orb,
          styles.orbTopRight,
          { backgroundColor: getColorWithOpacity(theme.backgroundElement, 0.35) },
        ]}
      />
      <View
        style={[
          styles.orb,
          styles.orbBottomLeft,
          { backgroundColor: getColorWithOpacity(theme.accentInk, 0.06) },
        ]}
      />
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
    overflow: 'hidden',
  },
  backgroundLayers: {
    ...StyleSheet.absoluteFill,
  },
  orb: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
  },
  orbTopRight: {
    top: '-12%',
    right: '-18%',
  },
  orbBottomLeft: {
    bottom: '-16%',
    left: '-22%',
  },
  centerContent: {
    alignItems: 'center',
    gap: Spacing.two,
  },
  iconContainer: {
    ...Shadows.medium,
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
