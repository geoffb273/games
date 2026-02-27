import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

import { printSchema } from 'graphql';

import { schema } from '@/schema';

const outputPath = resolve(import.meta.dirname, '../../shared/schema.graphql');
const isCheck = process.argv.includes('--check');
const generated = printSchema(schema) + '\n';

if (isCheck) {
  if (!existsSync(outputPath)) {
    console.error('schema.graphql does not exist. Run `pnpm generate:schema` first.');
    process.exit(1);
  }

  const existing = readFileSync(outputPath, 'utf-8');
  if (existing !== generated) {
    console.error(
      'schema.graphql is out of date. Run `pnpm generate:schema` and commit the result.',
    );
    process.exit(1);
  }

  console.log('schema.graphql is up to date.');
} else {
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, generated);
  console.log(`Schema written to ${outputPath}`);
}
