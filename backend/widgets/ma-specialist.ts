import { EntityInfo } from "../agent/entity-extraction";
import { getFMPQuote, getFMPCompanyProfile, getFMPNews } from "../datasources/fmp";
import { getOpenAI } from "../agent/openai";
import { WIDGET_PROMPTS } from "../config/prompts";

export interface MASpecialistData {
  summary: string;
  dealEconomics?: {
    currentValuation: number;
    evToEbitda?: number;
    priceToEarnings?: number;
    premiumRange?: { low: number; high: number };
  };
  strategicRationale?: {
    synergies: string[];
    marketPosition: string;
    integration: string;
  };
  recentDeals?: Array<{
    target: string;
    acquirer: string;
    value?: number;
    date: string;
  }>;
  risks?: string[];
  sources: Array<{ name: string; timestamp: string }>;
  lastUpdated: string;
}

export async function processMASpecialist(
  entity: EntityInfo
): Promise<MASpecialistData> {
  const sources: Array<{ name: string; timestamp: string }> = [];
  
  let quoteData, profile, news;
  
  if (entity.ticker) {
    try {
      [quoteData, profile, news] = await Promise.all([
        getFMPQuote(entity.ticker),
        getFMPCompanyProfile(entity.ticker),
        getFMPNews(entity.ticker, 20),
      ]);
      
      sources.push({
        name: "FMP API (M&A Data)",
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("FMP error:", error);
    }
  }

  const openai = getOpenAI();
  const prompt = WIDGET_PROMPTS["ma-specialist"];
  
  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: prompt.systemPrompt,
      },
      {
        role: "user",
        content: `M&A analysis for ${entity.companyName || entity.ticker}:

Quote & Valuation: ${JSON.stringify(quoteData)}
Company Profile: ${JSON.stringify(profile)}
Recent News (for M&A signals): ${JSON.stringify(news?.slice(0, 10))}

Provide M&A analysis in JSON: summary, dealEconomics, strategicRationale (synergies array, marketPosition, integration), recentDeals (array), risks (array).`,
      },
    ],
    response_format: { type: "json_object" },
  });

  const analysis = JSON.parse(completion.choices[0].message.content || "{}");

  return {
    summary: analysis.summary || "M&A analysis unavailable",
    dealEconomics: analysis.dealEconomics,
    strategicRationale: analysis.strategicRationale,
    recentDeals: analysis.recentDeals || [],
    risks: analysis.risks || [],
    sources,
    lastUpdated: new Date().toISOString(),
  };
}
