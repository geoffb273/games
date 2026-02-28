import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

import { DATABASE_URL } from '@/constants';
import { PrismaClient } from '@/generated/prisma';

const pool = new Pool({ connectionString: DATABASE_URL });
const adapter = new PrismaPg(pool);

export const prisma = new PrismaClient({ adapter });
