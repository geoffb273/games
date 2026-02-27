import js from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier';

export default [
  { ignores: ['**/dist', '**/build', '**/coverage', '**/node_modules'] },
  js.configs.recommended,
  eslintConfigPrettier,
];
