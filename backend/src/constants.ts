import { z } from 'zod';

import 'dotenv/config';

export const { DATABASE_URL, DIRECT_URL, JWT_SECRET } = z
  .object({
    DATABASE_URL: z.string(),
    DIRECT_URL: z.string(),
    JWT_SECRET: z.string(),
  })
  .parse(process.env);
