/**
 * Relay cursor pagination helpers for use with @pothos/plugin-relay
 * and Prisma's cursor-based pagination.
 */

import { UnknownError } from '@/schema/errors';

// ---------------------------------------------------------------------------
// Cursor encoding / decoding
// ---------------------------------------------------------------------------

/** Encodes a key-value object into an opaque base64url cursor string. */
export function encodeCursor(values: Record<string, string>): string {
  return Buffer.from(JSON.stringify(values)).toString('base64url');
}

/**
 * Decodes an opaque cursor string back to a key-value object.
 * @throws {UnknownError} if the cursor is invalid.
 */
export function decodeCursor(cursor: string): Record<string, string> {
  try {
    return JSON.parse(Buffer.from(cursor, 'base64url').toString()) as Record<string, string>;
  } catch {
    throw new UnknownError('Invalid cursor');
  }
}

// ---------------------------------------------------------------------------
// Prisma cursor args
// ---------------------------------------------------------------------------

export type CursorArgs<TCursor extends Record<string, unknown>> = {
  take: number;
  skip: number;
  cursor: TCursor | undefined;
};

/**
 * Converts the `after` cursor and `limit` from `resolveCursorConnection`
 * into Prisma's native `cursor` / `skip` / `take` parameters.
 *
 * `parseCursor` transforms the decoded cursor object into the shape
 * Prisma expects for the model's `cursor` parameter.
 *
 * `limit` from `resolveCursorConnection` already includes the +1 for
 * hasNextPage detection — do not add to it.
 *
 */
export function buildCursorArgs<TCursor extends Record<string, unknown>>({
  after,
  limit,
  parseCursor,
}: {
  after?: string;
  limit: number;
  parseCursor: (raw: Record<string, string>) => TCursor;
}): CursorArgs<TCursor> {
  const cursor = after ? parseCursor(decodeCursor(after)) : undefined;
  return {
    take: limit,
    skip: cursor ? 1 : 0,
    cursor,
  };
}
