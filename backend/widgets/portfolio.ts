import { EntityInfo } from "../agent/entity-extraction";
import { getFMPQuote } from "../datasources/fmp";
import { getOpenAI } from "../agent/openai";
import { WIDGET_PROMPTS } from "../config/prompts";

export interface PortfolioPosition {
  ticker: string;
  companyName: string;
  currentPrice: number;
  allocation: number;
  risk: "low" | "medium" | "high";
  recommendation: string;
}

export interface PortfolioData {
  summary: string;
  totalValue: number;
  positions: PortfolioPosition[];
  diversificationScore: number;
  riskAnalysis: string;
  rebalancingAdvice: string[];
  sources: Array<{ name: string; timestamp: string }>;
  lastUpdated: string;
}

export async function processPortfolio(
  entity: EntityInfo
): Promise<PortfolioData> {
  const sources: Array<{ name: string; timestamp: string }> = [];
  
  const companies = entity.companies || (entity.ticker ? [{ ticker: entity.ticker, companyName: entity.companyName }] : []);
  
  if (companies.length === 0) {
    throw new Error("No companies found for portfolio analysis");
  }

  const results = await Promise.all(
    companies.map(async (company) => {
      if (!company.ticker) {
        return { ok: false, symbol: company.ticker || 'unknown', reason: 'MISSING_TICKER' };
      }
      
      try {
        const quote = await getFMPQuote(company.ticker);
        return {
          ok: true,
          symbol: company.ticker,
          data: {
            ticker: company.ticker,
            companyName: company.companyName || quote.name,
            currentPrice: quote.price,
            marketCap: quote.marketCap,
            pe: quote.pe,
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

  const validPositions = results.filter(r => r.ok).map((r: any) => r.data);
  const failures = results.filter(r => !r.ok);

  if (validPositions.length === 0) {
    const failureList = failures.map((f: any) => `${f.symbol}: ${f.reason}`).join('; ');
    throw new Error(`Could not fetch data for any portfolio positions. ${failureList}`);
  }

  sources.push({
    name: "FMP API (Portfolio Data)",
    timestamp: new Date().toISOString(),
  });

  const openai = getOpenAI();
  const prompt = WIDGET_PROMPTS["portfolio"] || {
    systemPrompt: `You are a portfolio management AI agent. Analyze the portfolio positions and provide:
1. Overall portfolio summary
2. Position-by-position analysis with allocation percentages and risk levels
3. Diversification score (0-100)
4. Risk analysis
5. Rebalancing advice

Return JSON with: summary, positions (array of {ticker, companyName, currentPrice, allocation (percentage), risk ("low"/"medium"/"high"), recommendation}), diversificationScore, riskAnalysis, rebalancingAdvice (array of strings)`
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
        content: `Analyze this portfolio: ${JSON.stringify(validPositions)}`,
      },
    ],
    response_format: { type: "json_object" },
  });

  let analysis: any = {};
  try {
    const content = completion.choices[0].message.content || "{}";
    analysis = JSON.parse(content);
  } catch (parseError) {
    console.error("JSON parse error in portfolio:", parseError);
    analysis = { summary: "Analysis format error", positions: [], diversificationScore: 0, riskAnalysis: "", rebalancingAdvice: [] };
  }

  const totalValue = validPositions.reduce((sum, p) => sum + (p.currentPrice * 100), 0);

  return {
    summary: analysis.summary || "Portfolio analysis",
    totalValue,
    positions: Array.isArray(analysis.positions) ? analysis.positions : [],
    diversificationScore: analysis.diversificationScore || 0,
    riskAnalysis: analysis.riskAnalysis || "No risk analysis available",
    rebalancingAdvice: Array.isArray(analysis.rebalancingAdvice) ? analysis.rebalancingAdvice : [],
    sources,
    lastUpdated: new Date().toISOString(),
  };
}
