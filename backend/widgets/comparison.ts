import { EntityInfo } from "../agent/entity-extraction";
import { getFMPQuote, getFMPRatios, getFMPCompanyProfile } from "../datasources/fmp";
import { getOpenAI } from "../agent/openai";
import { WIDGET_PROMPTS } from "../config/prompts";

export interface CompanyComparisonData {
  summary: string;
  companies: Array<{
    name: string;
    ticker: string;
    price?: number;
    marketCap?: number;
    pe?: number;
    eps?: number;
    revenue?: number;
    roe?: number;
    debtToEquity?: number;
    sector?: string;
  }>;
  winner?: {
    category: string;
    company: string;
    reason: string;
  }[];
  sources: Array<{ name: string; timestamp: string }>;
  lastUpdated: string;
}

export async function processComparison(
  entity: EntityInfo
): Promise<CompanyComparisonData> {
  const sources: Array<{ name: string; timestamp: string }> = [];
  
  if (!entity.companies || entity.companies.length < 2) {
    throw new Error("Comparison requires at least 2 companies");
  }

  const results = await Promise.all(
    entity.companies.map(async (company) => {
      if (!company.ticker) {
        return { ok: false, symbol: company.companyName || 'unknown', reason: 'MISSING_TICKER' };
      }
      
      try {
        const [quote, ratios, profile] = await Promise.all([
          getFMPQuote(company.ticker),
          getFMPRatios(company.ticker, 1).catch(() => []),
          getFMPCompanyProfile(company.ticker).catch(() => ({})),
        ]);

        return {
          ok: true,
          symbol: company.ticker,
          data: {
            name: company.companyName || quote.name,
            ticker: company.ticker,
            price: quote.price,
            marketCap: quote.marketCap,
            pe: quote.pe,
            eps: quote.eps,
            revenue: profile?.revenue,
            roe: ratios[0]?.returnOnEquity,
            debtToEquity: ratios[0]?.debtEquityRatio,
            sector: profile?.sector,
          }
        };
      } catch (error: any) {
        console.error(`Error fetching data for ${company.ticker}:`, error);
        return { 
          ok: false, 
          symbol: company.ticker, 
          reason: error?.message || 'UNKNOWN_ERROR' 
        };
      }
    })
  );

  const validCompanies = results.filter(r => r.ok).map((r: any) => r.data);
  const failures = results.filter(r => !r.ok);
  
  if (validCompanies.length === 0) {
    const failureList = failures.map((f: any) => `${f.symbol}: ${f.reason}`).join('; ');
    throw new Error(`Could not fetch data for any companies. ${failureList}`);
  }

  sources.push({
    name: "FMP API (Comparison Data)",
    timestamp: new Date().toISOString(),
  });

  const openai = getOpenAI();
  const prompt = WIDGET_PROMPTS["comparison"] || {
    systemPrompt: `You are a financial analyst comparing companies. Analyze the data and provide:
1. A comprehensive comparison summary
2. Winners in key categories (valuation, profitability, growth, risk) with reasons
Return JSON with: summary, winner (array of {category, company, reason})`
  };
  
  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: prompt.systemPrompt,
      },
      {
        role: "user",
        content: `Compare these companies: ${JSON.stringify(validCompanies)}`,
      },
    ],
    response_format: { type: "json_object" },
  });

  const analysis = JSON.parse(completion.choices[0].message.content || "{}");

  return {
    summary: analysis.summary || "Comparison analysis",
    companies: validCompanies,
    winner: analysis.winner || [],
    sources,
    lastUpdated: new Date().toISOString(),
  };
}
