import eslintConfigPrettier from 'eslint-config-prettier';
import eslintPluginPrettier from 'eslint-plugin-prettier/recommended';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist/*', 'src/generated/*'] },
  tseslint.configs.recommended,
  eslintConfigPrettier,
  eslintPluginPrettier,
  {
    plugins: {
      'simple-import-sort': simpleImportSort,
    },
    rules: {
      'simple-import-sort/imports': [
        'warn',
        {
          groups: [['^@?\\w'], ['^@/'], ['^\\.']],
        },
      ],
      'simple-import-sort/exports': 'warn',
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/consistent-type-imports': [
        'warn',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
      '@typescript-eslint/no-shadow': 'error',
      'no-shadow': 'off',
      'no-console': 'warn',
    },
  },
  {
    files: ['src/**/*.ts'],
    ignores: ['src/**/dao/**', 'src/**/service/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/dao/*', '**/dao/**'],
              message: 'DAO modules can only be imported from their corresponding service files.',
            },
          ],
        },
      ],
    },
  },
);
