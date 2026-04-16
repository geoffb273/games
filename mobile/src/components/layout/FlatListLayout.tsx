import { type ReactElement } from 'react';
import {
  FlatList,
  type ListRenderItem,
  type StyleProp,
  StyleSheet,
  type ViewStyle,
} from 'react-native';
import { type Edge, SafeAreaView } from 'react-native-safe-area-context';

import { COLOR } from '@/constants/color';

/**
 * A layout component that wraps a FlatList in a SafeAreaView and provides a header, footer, and onEndReached handler.
 */
export function FlatListLayout<T extends { id: string | number }>({
  header,
  data,
  renderItem,
  footer,
  onEndReached,
  edges,
  contentContainerStyle,
  ListEmptyComponent,
}: {
  header?: ReactElement;
  footer?: ReactElement;
  renderItem: ListRenderItem<T>;
  data: T[];
  onEndReached?: () => void;
  edges?: Edge[];
  contentContainerStyle?: StyleProp<ViewStyle>;
  ListEmptyComponent?: ReactElement;
}) {
  return (
    <SafeAreaView style={styles.safeArea} edges={edges}>
      <FlatList<T>
        data={data}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        ListHeaderComponent={header}
        ListFooterComponent={footer}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.5}
        style={styles.container}
        contentContainerStyle={contentContainerStyle}
        ListEmptyComponent={ListEmptyComponent}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLOR.transparent,
  },
  safeArea: {
    flex: 1,
  },
});
