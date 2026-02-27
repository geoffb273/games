import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  schema: '../shared/schema.graphql',
  documents: ['src/**/*.tsx', 'src/**/*.ts'],
  generates: {
    './src/generated/gql/': {
      preset: 'client',
    },
  },
  ignoreNoDocuments: true,
};

export default config;
