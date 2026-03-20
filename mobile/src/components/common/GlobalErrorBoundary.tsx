import React, { Component, type ReactNode } from 'react';

import { ErrorView } from '@/components/common/ErrorView';

type GlobalErrorBoundaryProps = {
  children: ReactNode;
};

type GlobalErrorBoundaryState = {
  error: unknown | null;
};

/**
 * Catches render/lifecycle errors and shows a friendly fallback.
 * This is intentionally lightweight and does not depend on navigation providers.
 */
export class GlobalErrorBoundary extends Component<
  GlobalErrorBoundaryProps,
  GlobalErrorBoundaryState
> {
  state: GlobalErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: unknown): GlobalErrorBoundaryState {
    return { error };
  }

  private reset = () => {
    this.setState({ error: null });
  };

  render() {
    const { error } = this.state;

    if (error != null) {
      return <ErrorView title="Something went wrong" onRetry={this.reset} />;
    }

    return this.props.children;
  }
}
