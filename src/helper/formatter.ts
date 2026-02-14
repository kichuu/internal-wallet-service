export function removeUndefined<T extends Record<string, unknown>>(
  obj: T
): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined)
  ) as Partial<T>;
}

export function parseDecimal(value: string | null | undefined): number {
  if (value == null) return 0;
  return parseFloat(value);
}
