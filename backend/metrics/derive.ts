export interface FinancialPrimitives {
  price?: number | null;
  sharesBasic?: number | null;
  netIncomeTTM?: number | null;
  totalEquityMRQ?: number | null;
  totalDebtMRQ?: number | null;
  epsTTM?: number | null;
  revenueTTM?: number | null;
  totalAssetsMRQ?: number | null;
}

export interface DerivedMetrics {
  marketCap?: number | null;
  pe?: number | null;
  roe?: number | null;
  roa?: number | null;
  debtToEquity?: number | null;
}

export function deriveMetrics(primitives: FinancialPrimitives): DerivedMetrics {
  const result: DerivedMetrics = {};

  // Market Cap = Price * Shares
  if (primitives.price && primitives.sharesBasic) {
    result.marketCap = primitives.price * primitives.sharesBasic;
  }

  // P/E = Price / EPS
  if (primitives.price && primitives.epsTTM && primitives.epsTTM > 0) {
    result.pe = primitives.price / primitives.epsTTM;
  }

  // ROE = Net Income / Total Equity
  if (primitives.netIncomeTTM && primitives.totalEquityMRQ && primitives.totalEquityMRQ > 0) {
    result.roe = (primitives.netIncomeTTM / primitives.totalEquityMRQ) * 100;
  }

  // ROA = Net Income / Total Assets
  if (primitives.netIncomeTTM && primitives.totalAssetsMRQ && primitives.totalAssetsMRQ > 0) {
    result.roa = (primitives.netIncomeTTM / primitives.totalAssetsMRQ) * 100;
  }

  // Debt to Equity = Total Debt / Total Equity
  if (primitives.totalDebtMRQ && primitives.totalEquityMRQ && primitives.totalEquityMRQ > 0) {
    result.debtToEquity = primitives.totalDebtMRQ / primitives.totalEquityMRQ;
  }

  return result;
}
