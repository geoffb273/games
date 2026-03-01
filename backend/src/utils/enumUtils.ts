import { UnknownError } from '@/schema/errors';

export function parseEnum<T extends Record<string, string>>(
  enumObj: T,
  value: string,
  fallback: T[keyof T],
): T[keyof T];
export function parseEnum<T extends Record<string, string>>(enumObj: T, value: string): T[keyof T];
export function parseEnum<T extends Record<string, string>>(
  enumObj: T,
  value: string,
  fallback?: T[keyof T],
): T[keyof T] {
  const values = Object.values(enumObj) as T[keyof T][];
  if (values.includes(value as T[keyof T])) {
    return value as T[keyof T];
  }
  if (fallback !== undefined) {
    return fallback;
  }
  throw new UnknownError(`Unknown value "${value}". Expected one of: ${values.join(', ')}`);
}
