import SchemaBuilder from '@pothos/core';
import ErrorsPlugin from '@pothos/plugin-errors';
import RelayPlugin from '@pothos/plugin-relay';
import SimpleObjectsPlugin from '@pothos/plugin-simple-objects';
import ValidationPlugin from '@pothos/plugin-validation';

export const builder = new SchemaBuilder<{
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  Context: {};
}>({
  plugins: [ErrorsPlugin, RelayPlugin, SimpleObjectsPlugin, ValidationPlugin],
  relay: {},
});

builder.queryType({});
