import { EntityInfo } from "../agent/entity-extraction";
import { getFMPKey } from "../datasources/fmp";
import { getOpenAI } from "../agent/openai";

const FMP_BASE_URL = "https://financialmodelingprep.com/api/v3";

export interface AnalystEstimate {
  estimatedEpsAvg: number;
  estimatedEpsLow: number;
  estimatedEpsHigh: number;
  estimatedRevenueAvg: number;
  estimatedRevenueLow: number;
  estimatedRevenueHigh: number;
  numberAnalysts: number;
}

export interface AnalystConsensusData {
  summary: string;
  ticker: string;
  companyName: string;
  currentPrice: number;
  targetPrice: {
    average: number;
    high: number;
    low: number;
    median: number;
  };
  recommendation: "Strong Buy" | "Buy" | "Hold" | "Sell" | "Strong Sell";
  analystCount: number;
  epsEstimates: {
    nextQuarter: AnalystEstimate;
    nextYear: AnalystEstimate;
  };
  revenueGrowth: {
    projected: number;
    historical: number;
  };
  surpriseHistory: Array<{
    period: string;
    estimated: number;
    actual: number;
    surprise: number;
    surprisePercent: number;
  }>;
  sources: Array<{ name: string; timestamp: string }>;
  lastUpdated: string;
}

async function getAnalystEstimates(symbol: string): Promise<any> {
  try {
    const apiKey = getFMPKey();
    const url = `${FMP_BASE_URL}/analyst-estimates/${symbol}?limit=4&apikey=${apiKey}`;
    
    const response = await fetch(url, { signal: AbortSignal.timeout(7000) });
    if (!response.ok) return null;
    
    return await response.json();
  } catch {
    return null;
  }
}

async function getPriceTarget(symbol: string): Promise<any> {
  try {
    const apiKey = getFMPKey();
    const url = `${FMP_BASE_URL}/price-target-consensus/${symbol}?apikey=${apiKey}`;
    
    const response = await fetch(url, { signal: AbortSignal.timeout(7000) });
    if (!response.ok) return null;
    
    const data = await response.json();
    return Array.isArray(data) ? data[0] : data;
  } catch {
    return null;
  }
}

async function getEarningsSurprises(symbol: string): Promise<any[]> {
  try {
    const apiKey = getFMPKey();
    const url = `${FMP_BASE_URL}/earnings-surprises/${symbol}?apikey=${apiKey}`;
    
    const response = await fetch(url, { signal: AbortSignal.timeout(7000) });
    if (!response.ok) return [];
    
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export async function processAnalystConsensus(
  entity: EntityInfo
): Promise<AnalystConsensusData> {
  if (!entity.ticker) {
    throw new Error("Ticker required for analyst consensus");
  }

  const sources: Array<{ name: string; timestamp: string }> = [];
  
  const [estimates, priceTarget, surprises] = await Promise.all([
    getAnalystEstimates(entity.ticker),
    getPriceTarget(entity.ticker),
    getEarningsSurprises(entity.ticker),
  ]);

  if (estimates) {
    sources.push({
      name: "FMP Analyst Estimates",
      timestamp: new Date().toISOString(),
    });
  }

  const openai = getOpenAI();
  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: `You are a financial analyst summarizing analyst consensus. Provide a concise summary of analyst expectations and price targets.`,
      },
      {
        role: "user",
        content: `Summarize analyst consensus for ${entity.ticker}:
Estimates: ${JSON.stringify(estimates?.slice(0, 2))}
Price Target: ${JSON.stringify(priceTarget)}
Recent Surprises: ${JSON.stringify(surprises?.slice(0, 4))}`,
      },
    ],
  });

  const summary = completion.choices[0].message.content || "No analyst data available";

  const nextQuarter = estimates?.[0] || {};
  const nextYear = estimates?.[1] || {};

  return {
    summary,
    ticker: entity.ticker,
    companyName: entity.companyName || entity.ticker,
    currentPrice: priceTarget?.lastPrice || 0,
    targetPrice: {
      average: priceTarget?.targetConsensus || 0,
      high: priceTarget?.targetHigh || 0,
      low: priceTarget?.targetLow || 0,
      median: priceTarget?.targetMedian || 0,
    },
    recommendation: priceTarget?.analystRating || "Hold",
    analystCount: priceTarget?.numberOfAnalysts || 0,
    epsEstimates: {
      nextQuarter: {
        estimatedEpsAvg: nextQuarter.estimatedEpsAvg || 0,
        estimatedEpsLow: nextQuarter.estimatedEpsLow || 0,
        estimatedEpsHigh: nextQuarter.estimatedEpsHigh || 0,
        estimatedRevenueAvg: nextQuarter.estimatedRevenueAvg || 0,
        estimatedRevenueLow: nextQuarter.estimatedRevenueLow || 0,
        estimatedRevenueHigh: nextQuarter.estimatedRevenueHigh || 0,
        numberAnalysts: nextQuarter.numberAnalystEstimatedRevenue || 0,
      },
      nextYear: {
        estimatedEpsAvg: nextYear.estimatedEpsAvg || 0,
        estimatedEpsLow: nextYear.estimatedEpsLow || 0,
        estimatedEpsHigh: nextYear.estimatedEpsHigh || 0,
        estimatedRevenueAvg: nextYear.estimatedRevenueAvg || 0,
        estimatedRevenueLow: nextYear.estimatedRevenueLow || 0,
        estimatedRevenueHigh: nextYear.estimatedRevenueHigh || 0,
        numberAnalysts: nextYear.numberAnalystEstimatedRevenue || 0,
      },
    },
    revenueGrowth: {
      projected: ((nextYear.estimatedRevenueAvg - nextQuarter.estimatedRevenueAvg) / nextQuarter.estimatedRevenueAvg) * 100 || 0,
      historical: 0,
    },
    surpriseHistory: (surprises?.slice(0, 4) || []).map((s: any) => ({
      period: s.date || "",
      estimated: s.estimatedEarning || 0,
      actual: s.actualEarningResult || 0,
      surprise: (s.actualEarningResult - s.estimatedEarning) || 0,
      surprisePercent: ((s.actualEarningResult - s.estimatedEarning) / s.estimatedEarning * 100) || 0,
    })),
    sources,
    lastUpdated: new Date().toISOString(),
  };
}
