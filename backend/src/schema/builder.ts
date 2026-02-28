import SchemaBuilder from '@pothos/core';
import ErrorsPlugin from '@pothos/plugin-errors';
import RelayPlugin from '@pothos/plugin-relay';
import SimpleObjectsPlugin from '@pothos/plugin-simple-objects';
import ValidationPlugin from '@pothos/plugin-validation';
import WithInputPlugin from '@pothos/plugin-with-input';

import { type Context } from './context';

export const builder = new SchemaBuilder<{
  Context: Context;
}>({
  plugins: [ErrorsPlugin, RelayPlugin, SimpleObjectsPlugin, ValidationPlugin, WithInputPlugin],
  relay: {},
});

builder.queryType({});
builder.mutationType({});
