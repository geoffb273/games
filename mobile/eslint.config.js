// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const simpleImportSort = require('eslint-plugin-simple-import-sort');
const noRelativeImportPaths = require('eslint-plugin-no-relative-import-paths');
const prettierPlugin = require('eslint-plugin-prettier/recommended');
const reactNativePlugin = require('eslint-plugin-react-native');

module.exports = defineConfig([
  expoConfig,
  prettierPlugin,
  {
    ignores: ['dist/*', 'src/generated/*'],
  },
  {
    plugins: {
      'simple-import-sort': simpleImportSort,
      'no-relative-import-paths': noRelativeImportPaths,
      'react-native': reactNativePlugin,
    },
    rules: {
      'simple-import-sort/imports': [
        'warn',
        {
          groups: [
            ['^react', '^react-native'],
            ['^expo', '^@expo', '^@react-navigation', '^@?\\w'],
            ['^@/'],
            ['^\\.'],
          ],
        },
      ],
      'simple-import-sort/exports': 'warn',
      'no-relative-import-paths/no-relative-import-paths': [
        'warn',
        { allowSameFolder: true, prefix: '@', rootDir: 'src' },
      ],
      'react-hooks/exhaustive-deps': [
        'error',
        {
          enableDangerousAutofixThisMayCauseInfiniteLoops: true,
          additionalHooks: '(useTimeoutEffect)',
        },
      ],
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
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'react-native',
              importNames: ['Text'],
              message: "Use '@/components/common/Text' instead.",
            },
            {
              name: 'react-native',
              importNames: ['Switch'],
              message: "Use '@/components/common/Toggle' instead.",
            },
          ],
        },
      ],
      'no-unused-expressions': ['error', { allowTaggedTemplates: true }],
      'no-console': 'error',
      'react/no-unstable-nested-components': 'error',
      'react/jsx-no-useless-fragment': 'warn',
      'react/self-closing-comp': 'warn',
      'react/jsx-curly-brace-presence': ['warn', { props: 'never', children: 'never' }],
      'react-native/no-unused-styles': 'error',
      '@typescript-eslint/no-redeclare': 'off',
    },
  },
]);
