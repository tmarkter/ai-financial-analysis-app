import { getGlobalQuote, getDailyTimeSeries, getCompanyOverview } from "../datasources/alpha-vantage";
import { getFMPQuote, getFMPCompanyProfile } from "../datasources/fmp";
import { getAlphaVantageKey } from "../agent/openai";
import { avLimiter, fmpLimiter, callWithLimit } from "../utils/limiters";
import { deriveMetrics, FinancialPrimitives } from "../metrics/derive";

export interface CompanyCore {
  ticker: string;
  name?: string;
  price?: number;
  change?: number;
  changePercent?: number;
  volume?: number;
  marketCap?: number;
  pe?: number;
  roe?: number;
  roa?: number;
  debtToEquity?: number;
  sector?: string;
  industry?: string;
}

export interface DataContribution {
  source: string;
  fields: string[];
}

export interface ResolvedData {
  data: CompanyCore;
  contributions: DataContribution[];
}

async function fromAlphaVantage(ticker: string): Promise<Partial<CompanyCore> | null> {
  try {
    const key = getAlphaVantageKey();
    if (!key) return null;

    const [quote, overview] = await Promise.all([
      callWithLimit(avLimiter, () => getGlobalQuote(ticker, key)).catch(() => null),
      callWithLimit(avLimiter, () => getCompanyOverview(ticker, key)).catch(() => null),
    ]);

    const result: Partial<CompanyCore> = { ticker };

    if (quote) {
      result.price = parseFloat(quote.price);
      result.change = parseFloat(quote.change);
      result.changePercent = parseFloat(quote.changePercent);
      result.volume = parseFloat(quote.volume);
    }

    if (overview) {
      result.name = overview.name;
      result.marketCap = parseFloat(overview.marketCap) || undefined;
      result.pe = parseFloat(overview.peRatio) || undefined;
      result.roe = parseFloat(overview.returnOnEquity) || undefined;
      result.roa = parseFloat(overview.returnOnAssets) || undefined;
      // Debt to Equity not directly available in Alpha Vantage overview
      result.sector = overview.sector;
      result.industry = overview.industry;
    }

    return result;
  } catch (error) {
    console.error("Alpha Vantage error:", error);
    return null;
  }
}

async function fromFMP(ticker: string): Promise<Partial<CompanyCore> | null> {
  try {
    const [quote, profile] = await Promise.all([
      callWithLimit(fmpLimiter, () => getFMPQuote(ticker)).catch(() => null),
      callWithLimit(fmpLimiter, () => getFMPCompanyProfile(ticker)).catch(() => null),
    ]);

    const result: Partial<CompanyCore> = { ticker };

    if (quote) {
      result.price = quote.price;
      result.change = quote.change;
      result.changePercent = quote.changesPercentage;
      result.volume = quote.volume;
      result.marketCap = quote.marketCap;
      result.pe = quote.pe;
    }

    if (profile) {
      result.name = profile.companyName;
      result.sector = profile.sector;
      result.industry = profile.industry;
    }

    return result;
  } catch (error) {
    console.error("FMP error:", error);
    return null;
  }
}

export async function resolveCompanyCore(
  ticker: string,
  providers: Array<(ticker: string) => Promise<Partial<CompanyCore> | null>>
): Promise<ResolvedData> {
  const results = await Promise.allSettled(providers.map(fn => fn(ticker)));
  
  const merged: CompanyCore = { ticker };
  const contributions: DataContribution[] = [];

  results.forEach((result, idx) => {
    if (result.status === 'fulfilled' && result.value) {
      const data = result.value;
      const sourceName = providers[idx].name || `Provider ${idx}`;
      const fields: string[] = [];

      Object.keys(data).forEach(key => {
        if (data[key as keyof typeof data] !== undefined && merged[key as keyof CompanyCore] === undefined) {
          (merged as any)[key] = data[key as keyof typeof data];
          fields.push(key);
        }
      });

      if (fields.length > 0) {
        contributions.push({ source: sourceName, fields });
      }
    }
  });

  return { data: merged, contributions };
}

export async function getCompanySnapshot(ticker: string) {
  // Try multiple providers in parallel
  const { data: core, contributions } = await resolveCompanyCore(ticker, [
    fromAlphaVantage,
    fromFMP,
  ]);

  // If we have critical data missing, try to derive it
  const primitives: FinancialPrimitives = {
    price: core.price,
    epsTTM: undefined, // Would need to fetch from statements
    netIncomeTTM: undefined,
    totalEquityMRQ: undefined,
    totalDebtMRQ: undefined,
    sharesBasic: core.marketCap && core.price ? core.marketCap / core.price : undefined,
  };

  const derived = deriveMetrics(primitives);

  // Fill in missing values with derived ones
  const snapshot = {
    ...core,
    marketCap: core.marketCap ?? derived.marketCap,
    pe: core.pe ?? derived.pe,
    roe: core.roe ?? derived.roe,
    roa: core.roa ?? derived.roa,
    debtToEquity: core.debtToEquity ?? derived.debtToEquity,
    _estimated: !!(
      derived && 
      (!core.marketCap || !core.pe || !core.roe || !core.debtToEquity)
    ),
    _sources: contributions.map(c => c.source),
  };

  return snapshot;
}
