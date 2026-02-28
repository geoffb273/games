import React from 'react';

import AppTabs from '@/components/app-tabs';
import { MainProvider } from '@/provider/MainProvider';

export default function RootLayout() {
  return (
    <MainProvider>
      <AppTabs />
    </MainProvider>
  );
}
