export function isNum(v: unknown): v is number {
  return Number.isFinite(Number(v));
}

export function fmtNumber(v: unknown, dp = 2, fallback = "—"): string {
  const n = Number(v);
  return Number.isFinite(n) ? n.toFixed(dp) : fallback;
}

export function fmtCurrencyUSD(v: unknown, dp = 2, fallback = "—"): string {
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  
  if (n >= 1e12) return `$${(n / 1e12).toFixed(dp)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(dp)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(dp)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(dp)}K`;
  
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: dp,
    minimumFractionDigits: dp,
  }).format(n);
}

export function fmtPercent(v: unknown, dp = 2, fallback = "—"): string {
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  return `${n.toFixed(dp)}%`;
}

export function fmtMarketCap(v: unknown, fallback = "—"): string {
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  
  return fmtCurrencyUSD(n);
}

export function safeJSON<T = any>(s: unknown, fallback: T | null = null): T | null {
  if (typeof s !== "string") return fallback;
  try {
    return JSON.parse(s) as T;
  } catch {
    return fallback;
  }
}
