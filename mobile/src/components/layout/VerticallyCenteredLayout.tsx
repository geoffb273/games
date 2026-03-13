import { type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useHeaderHeight } from '@react-navigation/elements';

type VerticallyCenteredLayoutProps = {
  children: ReactNode;
};

/**
 * A layout component that centers its children vertically accounting
 * for react navigation header height
 */
export function VerticallyCenteredLayout({ children }: VerticallyCenteredLayoutProps) {
  const headerHeight = useHeaderHeight();

  return (
    <SafeAreaView
      style={[styles.safeArea, { paddingBottom: headerHeight }]}
      edges={['left', 'right', 'bottom']}
    >
      <View style={styles.centered}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
