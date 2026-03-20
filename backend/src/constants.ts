import { z } from 'zod';

import 'dotenv/config';

export const {
  DATABASE_URL,
  DIRECT_URL,
  JWT_SECRET,
  GRAPHQL_HIVE_ACCESS_TOKEN,
  ADMIN_SECRET,
  REDIS_USERNAME,
  REDIS_PASSWORD,
  REDIS_HOST,
  REDIS_PORT,
} = z
  .object({
    DATABASE_URL: z.string(),
    DIRECT_URL: z.string(),
    JWT_SECRET: z.string(),
    GRAPHQL_HIVE_ACCESS_TOKEN: z.string(),
    ADMIN_SECRET: z.string(),
    REDIS_USERNAME: z.string(),
    REDIS_PASSWORD: z.string(),
    REDIS_HOST: z.string(),
    REDIS_PORT: z.coerce.number(),
  })
  .parse(process.env);
