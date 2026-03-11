import { type ReactElement } from 'react';
import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/common/Text';
import { Spacing } from '@/constants/theme';

export function InstructionBulletList({ items }: { items: (string | ReactElement)[] }) {
  return (
    <View style={styles.bulletList}>
      {items.map((child, index) => (
        <Text type="body" color="textSecondary" key={index}>
          • {child}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  bulletList: {
    gap: Spacing.half,
  },
});
