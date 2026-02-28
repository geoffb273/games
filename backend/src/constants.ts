import { z } from 'zod';

import 'dotenv/config';

export const { DATABASE_URL, DIRECT_URL } = z
  .object({
    DATABASE_URL: z.string(),
    DIRECT_URL: z.string(),
  })
  .parse(process.env);
