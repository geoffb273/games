import React from 'react';

import { GlobalErrorBoundary } from '@/components/common/GlobalErrorBoundary';
import { RootNavigator } from '@/navigator/RootNavigator';
import { MainProvider } from '@/provider/MainProvider';

export default function RootLayout() {
  return (
    <GlobalErrorBoundary>
      <MainProvider>
        <RootNavigator />
      </MainProvider>
    </GlobalErrorBoundary>
  );
}
