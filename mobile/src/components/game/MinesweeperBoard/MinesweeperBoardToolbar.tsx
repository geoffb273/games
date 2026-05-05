import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/common/Text';
import { Spacing } from '@/constants/token';
import { useTheme } from '@/hooks/useTheme';

type MinesweeperBoardToolbarProps = {
  puzzleName: string;
  remaining: number;
  mode: 'reveal' | 'flag';
  onToggleMode: () => void;
};

export function MinesweeperBoardToolbar({
  puzzleName,
  remaining,
  mode,
  onToggleMode,
}: MinesweeperBoardToolbarProps) {
  const theme = useTheme();

  return (
    <>
      <Text type="h3" textAlign="center">
        {puzzleName}
      </Text>

      <View style={styles.toolbar}>
        <View style={[styles.toolbarItem, { backgroundColor: theme.backgroundElement }]}>
          <Text type="emphasized_body">
            {remaining} mine{remaining !== 1 ? 's' : ''} left
          </Text>
        </View>

        <Pressable
          onPress={onToggleMode}
          style={[
            styles.toolbarItem,
            {
              backgroundColor: mode === 'flag' ? theme.backgroundSelected : theme.backgroundElement,
            },
          ]}
        >
          <Text type="emphasized_body">{mode === 'flag' ? 'Flag' : 'Reveal'}</Text>
        </Pressable>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  toolbarItem: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.two,
  },
});
