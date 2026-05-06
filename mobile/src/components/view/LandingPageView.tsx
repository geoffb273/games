import { type ReactNode, useMemo } from 'react';
import {
  type StyleProp,
  StyleSheet,
  useWindowDimensions,
  View,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LinearGradient } from 'expo-linear-gradient';

import { type Puzzle, PuzzleType } from '@/api/puzzle/puzzle';
import { AppLogo } from '@/components/common/AppLogo';
import { PuzzleIcon } from '@/components/common/PuzzleIcon';
import { INSTRUCTIONS_FLOW_PUZZLE } from '@/components/game/instructions/InstructionsPuzzleBoard/InstructionsFlowBoard';
import { INSTRUCTIONS_HANJI_PUZZLE } from '@/components/game/instructions/InstructionsPuzzleBoard/InstructionsHanjiBoard';
import { INSTRUCTIONS_HASHI_PUZZLE } from '@/components/game/instructions/InstructionsPuzzleBoard/InstructionsHashiBoard';
import { INSTRUCTIONS_MINESWEEPER_PUZZLE } from '@/components/game/instructions/InstructionsPuzzleBoard/InstructionsMinesweeperBoard';
import { INSTRUCTIONS_SLITHERLINK_PUZZLE } from '@/components/game/instructions/InstructionsPuzzleBoard/InstructionsSlitherlinkBoard';
import { SHARE_ASSET_CONTENT_TARGET_SIZE } from '@/components/game/share/ShareAssetCard';
import { ShareFlowBoard } from '@/components/game/share/ShareFlowBoard';
import { ShareHanjiBoard } from '@/components/game/share/ShareHanjiBoard';
import { ShareHashiBoard } from '@/components/game/share/ShareHashiBoard';
import { ShareMinesweeperBoard } from '@/components/game/share/ShareMinesweeperBoard';
import { ShareSlitherlinkBoard } from '@/components/game/share/ShareSlitherlinkBoard';
import { Shadows, Spacing } from '@/constants/token';
import { useTheme } from '@/hooks/useTheme';
import { getColorWithOpacity } from '@/utils/colorUtils';
import { clamp } from '@/utils/mathUtils';

const MIN_CORNER_PREVIEW_SIZE = 72;
const MAX_CORNER_PREVIEW_SIZE = 108;
const MIN_CENTER_PREVIEW_SIZE = 92;
const MAX_CENTER_PREVIEW_SIZE = 132;
const CORNER_ICON_SIZE = 72;
const CENTER_ICON_SIZE = 96;
const ORB_SIZE = 320;

export function LandingPageView() {
  const { top, bottom } = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();

  const { cornerPreviewSize, centerPreviewSize } = useMemo(() => {
    const availableHeight = height - top - bottom;
    const cornerSize = clamp(
      Math.min(width * 0.26, availableHeight * 0.14),
      MIN_CORNER_PREVIEW_SIZE,
      MAX_CORNER_PREVIEW_SIZE,
    );
    const centerSize = clamp(
      Math.min(width * 0.34, availableHeight * 0.18),
      MIN_CENTER_PREVIEW_SIZE,
      MAX_CENTER_PREVIEW_SIZE,
    );

    return {
      cornerPreviewSize: Math.floor(cornerSize),
      centerPreviewSize: Math.floor(centerSize),
    };
  }, [bottom, height, top, width]);

  return (
    <View style={styles.container}>
      <BackgroundLayers />
      <PuzzleDecoration
        iconType={PuzzleType.Flow}
        iconSize="lg"
        iconStyle={styles.topLeftIcon}
        previewSize={Math.floor(cornerPreviewSize * 1.48)}
        style={[styles.cornerDecoration, styles.topLeftDecoration, { top: top + 44 }]}
      >
        <ShareFlowBoard puzzle={INSTRUCTIONS_FLOW_PUZZLE} />
      </PuzzleDecoration>
      <PuzzleDecoration
        iconType={PuzzleType.Hanji}
        iconSize="lg"
        iconStyle={styles.topRightIcon}
        previewSize={Math.floor(cornerPreviewSize * 0.94)}
        style={[styles.cornerDecoration, styles.topRightDecoration, { top: top + 82 }]}
      >
        <ShareHanjiBoard puzzle={INSTRUCTIONS_HANJI_PUZZLE} />
      </PuzzleDecoration>

      <PuzzleDecoration
        iconType={PuzzleType.Minesweeper}
        iconSize="lg"
        iconStyle={styles.bottomLeftIcon}
        previewSize={Math.floor(cornerPreviewSize * 1.17)}
        style={[styles.cornerDecoration, styles.bottomLeftDecoration, { bottom: bottom + 70 }]}
      >
        <ShareMinesweeperBoard puzzle={INSTRUCTIONS_MINESWEEPER_PUZZLE} />
      </PuzzleDecoration>
      <PuzzleDecoration
        iconType={PuzzleType.Slitherlink}
        iconSize="lg"
        iconStyle={styles.bottomRightIcon}
        previewSize={Math.floor(cornerPreviewSize * 1.62)}
        style={[styles.cornerDecoration, styles.bottomRightDecoration, { bottom: bottom + 36 }]}
      >
        <ShareSlitherlinkBoard puzzle={INSTRUCTIONS_SLITHERLINK_PUZZLE} />
      </PuzzleDecoration>

      <View style={styles.centerContent}>
        <PuzzleDecoration
          iconType={PuzzleType.Hashi}
          iconSize="xl"
          previewSize={centerPreviewSize}
          style={styles.centerDecoration}
        >
          <ShareHashiBoard puzzle={INSTRUCTIONS_HASHI_PUZZLE} />
        </PuzzleDecoration>
        <AppLogo />
      </View>
    </View>
  );
}

type PuzzlePreviewProps = {
  size: number;
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
};

type PuzzleDecorationProps = {
  iconType: Puzzle['type'];
  iconSize: 'lg' | 'xl';
  iconStyle?: StyleProp<ViewStyle>;
  previewSize: number;
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
};

function PuzzleDecoration({
  iconType,
  iconSize,
  previewSize,
  style,
  children,
}: PuzzleDecorationProps) {
  const decorationSize = iconSize === 'xl' ? CENTER_ICON_SIZE : CORNER_ICON_SIZE;

  return (
    <View
      pointerEvents="none"
      style={[styles.puzzleDecoration, { width: decorationSize, height: decorationSize }, style]}
    >
      <PuzzlePreview size={previewSize} style={styles.previewBehindIcon}>
        {children}
      </PuzzlePreview>
      <PuzzleIcon type={iconType} size={iconSize} color="middle" />
    </View>
  );
}

function PuzzlePreview({ size, style, children }: PuzzlePreviewProps) {
  const scale = size / SHARE_ASSET_CONTENT_TARGET_SIZE;

  return (
    <View style={[styles.puzzlePreview, { width: size, height: size }, style]}>
      <View style={[styles.scaledPuzzlePreviewContent, { transform: [{ scale }] }]}>
        {children}
      </View>
    </View>
  );
}

function BackgroundLayers() {
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
    width: ORB_SIZE,
    height: ORB_SIZE,
    borderRadius: ORB_SIZE / 2,
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
    zIndex: 1,
  },
  puzzleDecoration: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  puzzlePreview: {
    ...Shadows.medium,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scaledPuzzlePreviewContent: {
    width: SHARE_ASSET_CONTENT_TARGET_SIZE,
    height: SHARE_ASSET_CONTENT_TARGET_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewBehindIcon: {
    position: 'absolute',
    opacity: 0.58,
    zIndex: 0,
  },
  cornerDecoration: {
    position: 'absolute',
  },
  centerDecoration: {
    marginBottom: Spacing.two,
  },
  topLeftDecoration: {
    left: 42,
    transform: [{ rotate: '-18deg' }],
  },
  topLeftIcon: {
    transform: [{ scale: 1.34 }],
  },
  topRightDecoration: {
    right: 74,
    transform: [{ rotate: '5deg' }],
  },
  topRightIcon: {
    transform: [{ scale: 0.88 }],
  },
  bottomLeftDecoration: {
    left: 36,
    transform: [{ rotate: '13deg' }],
  },
  bottomLeftIcon: {
    transform: [{ scale: 1.12 }],
  },
  bottomRightDecoration: {
    right: 34,
    transform: [{ rotate: '-24deg' }],
  },
  bottomRightIcon: {
    transform: [{ scale: 1.48 }],
  },
});
