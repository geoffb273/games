import select from '@inquirer/select';
import { spawn } from 'child_process';
import { readdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const scripts = readdirSync(__dirname)
  .filter((f) => f.endsWith('.ts') && f !== 'setupScript.ts')
  .sort();

if (scripts.length === 0) {
  console.log('No scripts found in scripts/');
  process.exit(0);
}

const selected = await select({
  message: 'Select a script to run',
  choices: scripts.map((script) => ({
    name: script.replace(/\.ts$/, ''),
    value: script,
  })),
});

console.log(`\nRunning ${selected}...\n`);

const child = spawn('tsx', [join(__dirname, selected)], {
  stdio: 'inherit',
  env: process.env,
});

child.on('exit', (code) => process.exit(code ?? 0));
