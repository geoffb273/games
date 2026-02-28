import { printSchema } from 'graphql';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

import { schema } from '@/schema';

const outputPath = resolve(import.meta.dirname, '../../shared/schema.graphql');
const isCheck = process.argv.includes('--check');
const generated = printSchema(schema) + '\n';

if (isCheck) {
  if (!existsSync(outputPath)) {
    process.exit(1);
  }

  const existing = readFileSync(outputPath, 'utf-8');
  if (existing !== generated) {
    process.exit(1);
  }
} else {
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, generated);
}
