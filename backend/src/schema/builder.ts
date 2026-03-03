import SchemaBuilder from '@pothos/core';
import ErrorsPlugin from '@pothos/plugin-errors';
import RelayPlugin from '@pothos/plugin-relay';
import SimpleObjectsPlugin from '@pothos/plugin-simple-objects';
import ValidationPlugin from '@pothos/plugin-validation';
import WithInputPlugin from '@pothos/plugin-with-input';

import { type Context } from './context/context';

export const builder = new SchemaBuilder<{
  Context: Context;
  Scalars: {
    DateTime: {
      Input: Date;
      Output: Date;
    };
  };
}>({
  plugins: [ErrorsPlugin, RelayPlugin, SimpleObjectsPlugin, ValidationPlugin, WithInputPlugin],
  relay: {},
});

builder.scalarType('DateTime', {
  serialize: (value) => value.toISOString(),
  parseValue: (value) => {
    const date = new Date(value as string);
    if (isNaN(date.getTime())) {
      throw new TypeError('Invalid DateTime');
    }
    return date;
  },
});

builder.queryType({});
builder.mutationType({});
