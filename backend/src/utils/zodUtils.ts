import { type Logger } from 'pino';
import { type output, type ZodType } from 'zod';

export function safeParse<TSchema extends ZodType>({
  schema,
  value,
  logger,
}: {
  schema: TSchema;
  value: unknown;
  logger: Logger;
}): output<TSchema> | null {
  const result = schema.safeParse(value);
  if (!result.success) {
    logger.error(result.error, 'Failed to parse Zod schema');
    return null;
  }
  return result.data;
}
