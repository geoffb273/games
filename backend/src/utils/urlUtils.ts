export function getNonEmptyString(value: unknown): string | undefined {
  if (!value || typeof value !== 'string') {
    return undefined;
  }

  return value;
}
