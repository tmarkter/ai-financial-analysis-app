import Bottleneck from "bottleneck";

// Alpha Vantage: 5 req/min (free tier)
export const avLimiter = new Bottleneck({
  reservoir: 5,
  reservoirRefreshAmount: 5,
  reservoirRefreshInterval: 60_000,
  minTime: 250,
});

// FMP: more generous, 250 req/day free tier
export const fmpLimiter = new Bottleneck({
  reservoir: 100,
  reservoirRefreshAmount: 100,
  reservoirRefreshInterval: 60_000,
  minTime: 100,
});

export async function callWithLimit<T>(
  limiter: Bottleneck,
  fn: () => Promise<T>
): Promise<T> {
  return limiter.schedule(fn);
}
