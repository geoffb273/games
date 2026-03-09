import { z } from 'zod';

import 'dotenv/config';

export const { DATABASE_URL, DIRECT_URL, JWT_SECRET, GRAPHQL_HIVE_ACCESS_TOKEN, ADMIN_SECRET } = z
  .object({
    DATABASE_URL: z.string(),
    DIRECT_URL: z.string(),
    JWT_SECRET: z.string(),
    GRAPHQL_HIVE_ACCESS_TOKEN: z.string(),
    ADMIN_SECRET: z.string(),
  })
  .parse(process.env);
