import { EntityInfo } from "../agent/entity-extraction";
import { getFMPQuote, getFMPFinancials, getFMPRatios, getFMPCompanyProfile } from "../datasources/fmp";
import { getOpenAI } from "../agent/openai";
import { WIDGET_PROMPTS } from "../config/prompts";

export interface FinancialAnalystData {
  summary: string;
  financialMetrics?: {
    revenue: number;
    netIncome: number;
    margins: { gross: number; operating: number; net: number };
    growth: { revenue: number; earnings: number };
  };
  ratios?: {
    profitability: { roe: number; roa: number; roic?: number };
    efficiency: { assetTurnover?: number };
    leverage: { debtToEquity: number };
    liquidity: { currentRatio: number; quickRatio: number };
  };
  valuation?: {
    pe: number;
    pb: number;
    ev_ebitda?: number;
  };
  earningsQuality?: string[];
  sources: Array<{ name: string; timestamp: string }>;
  lastUpdated: string;
}

export async function processFinancialAnalyst(
  entity: EntityInfo
): Promise<FinancialAnalystData> {
  const sources: Array<{ name: string; timestamp: string }> = [];
  
  let quoteData, financials, ratios, profile;
  
  if (entity.ticker) {
    try {
      [quoteData, financials, ratios, profile] = await Promise.all([
        getFMPQuote(entity.ticker),
        getFMPFinancials(entity.ticker, 4),
        getFMPRatios(entity.ticker, 4),
        getFMPCompanyProfile(entity.ticker),
      ]);
      
      sources.push({
        name: "FMP API (Financial Data)",
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("FMP error:", error);
    }
  }

  const openai = getOpenAI();
  const prompt = WIDGET_PROMPTS["financial-analyst"];
  
  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: prompt.systemPrompt,
      },
      {
        role: "user",
        content: `Analyze financial data for ${entity.companyName || entity.ticker}:

Quote Data: ${JSON.stringify(quoteData)}
Financial Statements: ${JSON.stringify(financials)}
Financial Ratios: ${JSON.stringify(ratios)}
Company Profile: ${JSON.stringify(profile)}

Provide comprehensive financial analysis in JSON format with: summary, financialMetrics, ratios, valuation, earningsQuality (array of observations).`,
      },
    ],
    response_format: { type: "json_object" },
  });

  const analysis = JSON.parse(completion.choices[0].message.content || "{}");

  return {
    summary: analysis.summary || "Financial analysis unavailable",
    financialMetrics: analysis.financialMetrics,
    ratios: analysis.ratios,
    valuation: analysis.valuation,
    earningsQuality: analysis.earningsQuality || [],
    sources,
    lastUpdated: new Date().toISOString(),
  };
}
