import { builder } from '@/schema/builder';

export const HealthStatus = builder.simpleObject('HealthStatus', {
  fields: (t) => ({
    status: t.string({ nullable: false }),
    timestamp: t.string({ nullable: false }),
  }),
});
