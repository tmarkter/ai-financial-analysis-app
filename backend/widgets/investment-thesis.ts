import { EntityInfo } from "../agent/entity-extraction";
import { getFMPQuote, getFMPCompanyProfile, getFMPRatios } from "../datasources/fmp";
import { getRecentNews } from "../datasources/gdelt";
import { getOpenAI } from "../agent/openai";

export interface InvestmentThesisData {
  ticker: string;
  companyName: string;
  oneLiner: string;
  bullCase: {
    title: string;
    points: string[];
  };
  bearCase: {
    title: string;
    points: string[];
  };
  keyCatalysts: Array<{
    event: string;
    timing: string;
    impact: "positive" | "negative" | "neutral";
  }>;
  growthDrivers: string[];
  keyRisks: string[];
  valuation: {
    current: string;
    fair: string;
    verdict: "Undervalued" | "Fairly Valued" | "Overvalued";
  };
  investmentRating: "Strong Buy" | "Buy" | "Hold" | "Sell" | "Strong Sell";
  confidence: number;
  sources: Array<{ name: string; timestamp: string }>;
  lastUpdated: string;
}

export async function processInvestmentThesis(
  entity: EntityInfo
): Promise<InvestmentThesisData> {
  if (!entity.ticker) {
    throw new Error("Ticker required for investment thesis");
  }

  const sources: Array<{ name: string; timestamp: string }> = [];

  const [quote, profile, ratios, news] = await Promise.all([
    getFMPQuote(entity.ticker).catch(() => null),
    getFMPCompanyProfile(entity.ticker).catch(() => null),
    getFMPRatios(entity.ticker, 1).catch(() => []),
    getRecentNews(entity.companyName || entity.ticker, "en").catch(() => []),
  ]);

  if (quote) {
    sources.push({
      name: "FMP Market Data",
      timestamp: new Date().toISOString(),
    });
  }

  if (news.length > 0) {
    sources.push({
      name: "GDELT News",
      timestamp: new Date().toISOString(),
    });
  }

  const openai = getOpenAI();
  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: `You are an investment analyst creating a comprehensive investment thesis. Analyze fundamentals, news, and market data to produce:

1. A compelling one-liner summary
2. Bull case (3 points)
3. Bear case (3 points)  
4. Key catalysts (3-4 upcoming events)
5. Growth drivers (3-4 points)
6. Key risks (3-4 points)
7. Valuation assessment
8. Investment rating and confidence level

Return JSON with: oneLiner, bullCase {title, points[]}, bearCase {title, points[]}, keyCatalysts [{event, timing, impact}], growthDrivers[], keyRisks[], valuation {current, fair, verdict}, investmentRating, confidence (0-100)`,
      },
      {
        role: "user",
        content: `Create investment thesis for ${entity.ticker}:

Company: ${profile?.companyName || entity.companyName}
Industry: ${profile?.industry}
Price: $${quote?.price}
P/E: ${quote?.pe}
Market Cap: $${quote?.marketCap ? (quote.marketCap / 1e9).toFixed(1) : 0}B
ROE: ${ratios[0]?.returnOnEquity || 0}%
Debt/Equity: ${ratios[0]?.debtEquityRatio || 0}

Recent News Headlines:
${news.slice(0, 10).map(n => `- ${n.title}`).join('\n')}

Description: ${profile?.description?.slice(0, 500)}`,
      },
    ],
    response_format: { type: "json_object" },
  });

  let analysis: any = {};
  try {
    analysis = JSON.parse(completion.choices[0].message.content || "{}");
  } catch {
    analysis = {
      oneLiner: "Investment thesis unavailable",
      bullCase: { title: "Bull Case", points: [] },
      bearCase: { title: "Bear Case", points: [] },
      keyCatalysts: [],
      growthDrivers: [],
      keyRisks: [],
      valuation: { current: "Unknown", fair: "Unknown", verdict: "Fairly Valued" },
      investmentRating: "Hold",
      confidence: 0,
    };
  }

  return {
    ticker: entity.ticker,
    companyName: entity.companyName || profile?.companyName || entity.ticker,
    oneLiner: analysis.oneLiner || `${entity.ticker} investment analysis`,
    bullCase: {
      title: analysis.bullCase?.title || "Bull Case",
      points: Array.isArray(analysis.bullCase?.points) ? analysis.bullCase.points : [],
    },
    bearCase: {
      title: analysis.bearCase?.title || "Bear Case",
      points: Array.isArray(analysis.bearCase?.points) ? analysis.bearCase.points : [],
    },
    keyCatalysts: Array.isArray(analysis.keyCatalysts) ? analysis.keyCatalysts : [],
    growthDrivers: Array.isArray(analysis.growthDrivers) ? analysis.growthDrivers : [],
    keyRisks: Array.isArray(analysis.keyRisks) ? analysis.keyRisks : [],
    valuation: {
      current: analysis.valuation?.current || `$${quote?.price || 0}`,
      fair: analysis.valuation?.fair || "Unknown",
      verdict: analysis.valuation?.verdict || "Fairly Valued",
    },
    investmentRating: analysis.investmentRating || "Hold",
    confidence: analysis.confidence || 50,
    sources,
    lastUpdated: new Date().toISOString(),
  };
}
