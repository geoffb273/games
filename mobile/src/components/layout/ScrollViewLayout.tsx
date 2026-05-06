import { type ReactElement, type ReactNode } from 'react';
import { ScrollView, type StyleProp, StyleSheet, type ViewStyle } from 'react-native';
import { type Edge, SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '@/hooks/useTheme';

type ScrollViewLayoutProps = {
  header?: ReactElement;
  children: ReactNode;
  edges?: Edge[];
  contentContainerStyle?: StyleProp<ViewStyle>;
};

/**
 * Scrollable layout with optional header content and main children centered
 * when the content is shorter than the viewport.
 */
export function ScrollViewLayout({
  header,
  children,
  edges,
  contentContainerStyle,
}: ScrollViewLayoutProps) {
  const theme = useTheme();

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]} edges={edges}>
      <ScrollView
        contentContainerStyle={contentContainerStyle}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        style={styles.scrollView}
      >
        {header}
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
});
