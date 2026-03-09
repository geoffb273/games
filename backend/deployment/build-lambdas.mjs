import * as esbuild from 'esbuild';
import { existsSync, mkdirSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const lambdasDir = join(__dirname, 'lambdas');
const outDir = join(lambdasDir, 'dist');

const tsFiles = readdirSync(lambdasDir)
  .filter((f) => f.endsWith('.ts') && !f.endsWith('.d.ts'))
  .map((f) => join(lambdasDir, f));

if (tsFiles.length === 0) {
  console.log('No .ts files found in lambdas/');
  process.exit(0);
}

if (!existsSync(outDir)) {
  mkdirSync(outDir, { recursive: true });
}

await esbuild.build({
  entryPoints: tsFiles,
  bundle: true,
  platform: 'node',
  target: 'node18',
  format: 'cjs',
  outdir: outDir,
  outbase: lambdasDir,
  external: [],
  sourcemap: true,
});

console.log(`Lambdas built to lambdas/dist/ (${tsFiles.length} file(s))`);
