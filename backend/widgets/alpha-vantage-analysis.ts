import { EntityInfo } from "../agent/entity-extraction";
import { getGlobalQuote, getDailyTimeSeries, getCompanyOverview } from "../datasources/alpha-vantage";
import { getOpenAI, getAlphaVantageKey } from "../agent/openai";

const SYSTEM_PROMPT = `You are a professional financial and investment analyst using Alpha Vantage data. Prepare a comprehensive macro and micro analysis combining both internal (Micro factors) and external (Macro factors).

✦ Deliverables:
Executive Summary: Provide a brief overview of the company's position and the industry context.

Micro Analysis (Internal – Company-Specific Factors):
- Profitability Metrics: Margins, ROE, ROA
- Valuation: P/E, P/B, EV/EBITDA ratios
- Growth: Revenue and earnings growth trends
- Financial Health: Debt ratios, current ratio, cash position
- Operational Efficiency: Asset turnover, inventory turnover
- Market Position: Market cap, trading volume, 52-week range

Macro Analysis (External – Market & Economic Factors):
- Sector Performance & Trends
- Market Sentiment & Technical Indicators
- Industry Competition
- Economic Environment Impact

Forward-Looking Outlook: Opportunities, risks, and expected future performance.

✦ Instructions:
Use a structured, section-based format with clear headings.
Provide explanations and implications.
Link financial indicators to expected investor outcomes.
Return comprehensive JSON analysis.`;

export interface AlphaVantageMetric {
  category: string;
  name: string;
  value: string;
  interpretation: string;
}

export interface AlphaVantageAnalysisData {
  executiveSummary: string;
  microAnalysis: {
    profitability: AlphaVantageMetric[];
    valuation: AlphaVantageMetric[];
    growth: AlphaVantageMetric[];
    financialHealth: AlphaVantageMetric[];
  };
  macroAnalysis: {
    sector: string;
    marketSentiment: string;
    technicalIndicators: string;
  };
  forwardOutlook: {
    opportunities: string[];
    risks: string[];
    recommendation: string;
  };
  sources: Array<{ name: string; timestamp: string; url?: string }>;
  lastUpdated: string;
}

export async function processAlphaVantageAnalysis(
  entity: EntityInfo
): Promise<AlphaVantageAnalysisData> {
  const sources: Array<{ name: string; timestamp: string; url?: string }> = [];

  if (!entity.ticker) {
    throw new Error("Ticker symbol required for Alpha Vantage analysis");
  }

  let quote;
  let timeSeries;
  let overview;

  try {
    const avKey = getAlphaVantageKey();
    
    // Fetch quote data
    quote = await getGlobalQuote(entity.ticker, avKey);
    
    // Fetch time series
    timeSeries = await getDailyTimeSeries(entity.ticker, avKey);
    
    // Fetch company overview
    overview = await getCompanyOverview(entity.ticker, avKey);

    sources.push({
      name: "Alpha Vantage",
      timestamp: new Date().toISOString(),
      url: "https://www.alphavantage.co/",
    });
  } catch (error) {
    console.error("Alpha Vantage data fetch error:", error);
    throw new Error(`Failed to fetch Alpha Vantage data: ${error instanceof Error ? error.message : "Unknown error"}`);
  }

  // Generate comprehensive analysis using OpenAI
  const openai = getOpenAI();
  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: SYSTEM_PROMPT,
      },
      {
        role: "user",
        content: `Perform comprehensive macro and micro analysis for ${entity.companyName || entity.ticker}.

Price Data: ${JSON.stringify(quote)}
Historical Data (60 days): ${JSON.stringify(timeSeries?.slice(0, 60))}
Company Overview: ${JSON.stringify(overview)}

Return JSON with:
- executiveSummary (string)
- microAnalysis (object with profitability, valuation, growth, financialHealth arrays of metrics)
- macroAnalysis (object with sector, marketSentiment, technicalIndicators strings)
- forwardOutlook (object with opportunities array, risks array, recommendation string)`,
      },
    ],
    response_format: { type: "json_object" },
  });

  const analysis = JSON.parse(completion.choices[0].message.content || "{}");

  return {
    executiveSummary: analysis.executiveSummary || "Analysis not available",
    microAnalysis: {
      profitability: Array.isArray(analysis.microAnalysis?.profitability) ? analysis.microAnalysis.profitability : [],
      valuation: Array.isArray(analysis.microAnalysis?.valuation) ? analysis.microAnalysis.valuation : [],
      growth: Array.isArray(analysis.microAnalysis?.growth) ? analysis.microAnalysis.growth : [],
      financialHealth: Array.isArray(analysis.microAnalysis?.financialHealth) ? analysis.microAnalysis.financialHealth : [],
    },
    macroAnalysis: {
      sector: analysis.macroAnalysis?.sector || "N/A",
      marketSentiment: analysis.macroAnalysis?.marketSentiment || "N/A",
      technicalIndicators: analysis.macroAnalysis?.technicalIndicators || "N/A",
    },
    forwardOutlook: {
      opportunities: Array.isArray(analysis.forwardOutlook?.opportunities) ? analysis.forwardOutlook.opportunities : [],
      risks: Array.isArray(analysis.forwardOutlook?.risks) ? analysis.forwardOutlook.risks : [],
      recommendation: analysis.forwardOutlook?.recommendation || "N/A",
    },
    sources,
    lastUpdated: new Date().toISOString(),
  };
}
