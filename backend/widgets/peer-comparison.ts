import { EntityInfo } from "../agent/entity-extraction";
import { getFMPQuote, getFMPRatios, getFMPCompanyProfile, getFMPPeers } from "../datasources/fmp";
import { getOpenAI } from "../agent/openai";

export interface PeerMetrics {
  name: string;
  ticker: string;
  price: number;
  marketCap: number;
  pe: number;
  forwardPE?: number;
  pegRatio?: number;
  evToEbitda?: number;
  revenueGrowth?: number;
  profitMargin?: number;
  roe: number;
  debtToEquity: number;
  currentRatio?: number;
  sector: string;
}

export interface PeerComparisonData {
  summary: string;
  targetCompany: PeerMetrics;
  peers: PeerMetrics[];
  rankings: {
    valuation: { ticker: string; score: number }[];
    growth: { ticker: string; score: number }[];
    profitability: { ticker: string; score: number }[];
    financialHealth: { ticker: string; score: number }[];
  };
  industryAverages: {
    pe: number;
    roe: number;
    debtToEquity: number;
    profitMargin: number;
  };
  sources: Array<{ name: string; timestamp: string }>;
  lastUpdated: string;
}

async function fetchPeerMetrics(ticker: string): Promise<PeerMetrics | null> {
  try {
    const [quote, ratios, profile] = await Promise.all([
      getFMPQuote(ticker).catch(() => null),
      getFMPRatios(ticker, 1).catch(() => []),
      getFMPCompanyProfile(ticker).catch(() => null),
    ]);

    if (!quote) return null;

    const ratio = ratios[0] || {};

    return {
      name: profile?.companyName || quote.name || ticker,
      ticker,
      price: quote.price || 0,
      marketCap: quote.marketCap || 0,
      pe: quote.pe || 0,
      evToEbitda: (ratio as any).enterpriseValueMultiple,
      revenueGrowth: profile?.revenueGrowth,
      profitMargin: (ratio as any).netProfitMargin,
      roe: ratio.returnOnEquity || 0,
      debtToEquity: ratio.debtEquityRatio || 0,
      currentRatio: ratio.currentRatio,
      sector: profile?.sector || "Unknown",
    };
  } catch {
    return null;
  }
}

export async function processPeerComparison(
  entity: EntityInfo
): Promise<PeerComparisonData> {
  if (!entity.ticker) {
    throw new Error("Ticker required for peer comparison");
  }

  const sources: Array<{ name: string; timestamp: string }> = [];

  const targetMetrics = await fetchPeerMetrics(entity.ticker);
  if (!targetMetrics) {
    throw new Error(`Could not fetch data for ${entity.ticker}`);
  }

  let peerTickers: string[] = [];
  try {
    peerTickers = await getFMPPeers(entity.ticker);
    sources.push({
      name: "FMP Peers & Metrics",
      timestamp: new Date().toISOString(),
    });
  } catch {
    peerTickers = [];
  }

  const peerMetrics = (
    await Promise.all(
      peerTickers.slice(0, 5).map(ticker => fetchPeerMetrics(ticker))
    )
  ).filter((p): p is PeerMetrics => p !== null);

  const allCompanies = [targetMetrics, ...peerMetrics];

  const avgPE = allCompanies.reduce((sum, c) => sum + c.pe, 0) / allCompanies.length;
  const avgROE = allCompanies.reduce((sum, c) => sum + c.roe, 0) / allCompanies.length;
  const avgDE = allCompanies.reduce((sum, c) => sum + c.debtToEquity, 0) / allCompanies.length;
  const avgMargin = allCompanies.reduce((sum, c) => sum + (c.profitMargin || 0), 0) / allCompanies.length;

  const valuationRank = allCompanies
    .map(c => ({ ticker: c.ticker, score: c.pe > 0 ? 100 / c.pe : 0 }))
    .sort((a, b) => b.score - a.score);

  const profitabilityRank = allCompanies
    .map(c => ({ ticker: c.ticker, score: c.roe }))
    .sort((a, b) => b.score - a.score);

  const healthRank = allCompanies
    .map(c => ({ ticker: c.ticker, score: Math.max(0, 100 - c.debtToEquity * 10) }))
    .sort((a, b) => b.score - a.score);

  const openai = getOpenAI();
  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: `You are a financial analyst comparing companies to their peers. Provide a concise competitive positioning summary.`,
      },
      {
        role: "user",
        content: `Compare ${entity.ticker} to its peers:
Target: ${JSON.stringify(targetMetrics)}
Peers: ${JSON.stringify(peerMetrics)}
Industry Avg P/E: ${avgPE.toFixed(1)}`,
      },
    ],
  });

  const summary = completion.choices[0].message.content || "Peer comparison analysis";

  return {
    summary,
    targetCompany: targetMetrics,
    peers: peerMetrics,
    rankings: {
      valuation: valuationRank,
      growth: [],
      profitability: profitabilityRank,
      financialHealth: healthRank,
    },
    industryAverages: {
      pe: avgPE,
      roe: avgROE,
      debtToEquity: avgDE,
      profitMargin: avgMargin,
    },
    sources,
    lastUpdated: new Date().toISOString(),
  };
}
