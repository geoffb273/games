import React, { Component, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { ErrorView } from '@/components/common/ErrorView';

type GlobalErrorBoundaryProps = {
  children: ReactNode;
};

type GlobalErrorBoundaryState = {
  hasError: boolean;
};

/**
 * Catches render/lifecycle errors and shows a friendly fallback.
 * This is intentionally lightweight and does not depend on navigation providers.
 */
export class GlobalErrorBoundary extends Component<
  GlobalErrorBoundaryProps,
  GlobalErrorBoundaryState
> {
  state: GlobalErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): GlobalErrorBoundaryState {
    return { hasError: true };
  }
  private reset = () => {
    this.setState({ hasError: false });
  };

  render() {
    const { hasError } = this.state;

    if (hasError) {
      return (
        <View style={styles.container}>
          <ErrorView title="Something went wrong" onRetry={this.reset} />
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
