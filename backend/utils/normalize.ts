export function toNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  
  if (typeof value === 'string') {
    const num = parseFloat(value);
    return Number.isFinite(num) ? num : undefined;
  }
  
  return undefined;
}

export function ensureNumber(value: unknown, fallback = 0): number {
  const num = toNumber(value);
  return num !== undefined ? num : fallback;
}

export function normalizeFinancialData<T extends Record<string, any>>(
  data: T,
  numericFields: (keyof T)[]
): T {
  const normalized = { ...data };
  
  for (const field of numericFields) {
    if (field in normalized) {
      normalized[field] = toNumber(normalized[field]) as T[typeof field];
    }
  }
  
  return normalized;
}
