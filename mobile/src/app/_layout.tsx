import React from 'react';

import { GlobalErrorBoundary } from '@/components/common/GlobalErrorBoundary';
import { BackgroundLayers } from '@/components/view/LandingPageView';
import { RootNavigator } from '@/navigator/RootNavigator';
import { MainProvider } from '@/provider/MainProvider';

export default function RootLayout() {
  return (
    <GlobalErrorBoundary>
      <MainProvider>
        <BackgroundLayers />
        <RootNavigator />
      </MainProvider>
    </GlobalErrorBoundary>
  );
}
