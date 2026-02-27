import { builder } from '@/schema/builder';

import { HealthStatus } from './type';

builder.queryField('health', (t) =>
  t.field({
    type: HealthStatus,
    nullable: false,
    resolve: () => ({
      status: 'ok',
      timestamp: new Date().toISOString(),
    }),
  }),
);
