import SchemaBuilder from '@pothos/core';
import ErrorsPlugin from '@pothos/plugin-errors';
import RelayPlugin from '@pothos/plugin-relay';
import SimpleObjectsPlugin from '@pothos/plugin-simple-objects';
import ValidationPlugin from '@pothos/plugin-validation';
import WithInputPlugin from '@pothos/plugin-with-input';

export const builder = new SchemaBuilder<{
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  Context: {};
}>({
  plugins: [ErrorsPlugin, RelayPlugin, SimpleObjectsPlugin, ValidationPlugin, WithInputPlugin],
  relay: {},
});

builder.queryType({});
