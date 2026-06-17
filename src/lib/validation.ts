export function isNonEmpty(value: unknown): boolean {
  if (typeof value === 'string') return value.trim().length > 0;
  return value !== null && value !== undefined;
}

export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function isWithinMaxLength(value: string, max: number): boolean {
  return value.length <= max;
}

export function hasMinLength(value: string, min: number): boolean {
  return value.length >= min;
}
