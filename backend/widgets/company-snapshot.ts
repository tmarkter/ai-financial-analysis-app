import { EntityInfo } from "../agent/entity-extraction";
import { getGlobalQuote, getDailyTimeSeries } from "../datasources/alpha-vantage";
import { getCompanyFacts } from "../datasources/sec-edgar";
import { getOpenAI, getAlphaVantageKey } from "../agent/openai";

const SYSTEM_PROMPT = `You are a financial data summarizer. Using Alpha Vantage (price/volume) and SEC EDGAR (companyfacts/filings), produce:
(1) price & day change
(2) last 30–60 days mini-chart data
(3) 3–5 KPIs or fundamentals if available (clearly label units)
(4) 2–4 peers by name only if confidently matched
(5) sources with timestamps
Prefer daily series if intraday is rate-limited. No advice.`;

export interface CompanySnapshotData {
  summary: string;
  priceData?: {
    price: number;
    change: number;
    changePercent: number;
  };
  chartData?: Array<{ date: string; close: number }>;
  kpis?: Array<{ name: string; value: string; unit: string }>;
  peers?: string[];
  sources: Array<{ name: string; timestamp: string; url?: string }>;
  lastUpdated: string;
}

export async function processCompanySnapshot(
  entity: EntityInfo
): Promise<CompanySnapshotData> {
  const tools: Array<any> = [];
  const sources: Array<{ name: string; timestamp: string; url?: string }> = [];

  // Fetch Alpha Vantage data
  let priceData;
  let chartData;
  if (entity.ticker) {
    try {
      const quote = await getGlobalQuote(entity.ticker, getAlphaVantageKey());
      priceData = {
        price: parseFloat(quote.price),
        change: parseFloat(quote.change),
        changePercent: parseFloat(quote.changePercent),
      };
      sources.push({
        name: "Alpha Vantage Global Quote",
        timestamp: new Date().toISOString(),
        url: "https://www.alphavantage.co/",
      });

      const timeSeries = await getDailyTimeSeries(entity.ticker, getAlphaVantageKey());
      chartData = timeSeries.slice(0, 60).map((item) => ({
        date: item.date,
        close: item.close,
      }));
    } catch (error) {
      console.error("Alpha Vantage error:", error);
    }
  }

  // Fetch SEC data
  let fundamentals;
  if (entity.companyName) {
    try {
      fundamentals = await getCompanyFacts(entity.companyName);
      if (fundamentals) {
        sources.push({
          name: "SEC EDGAR",
          timestamp: new Date().toISOString(),
          url: "https://www.sec.gov/edgar",
        });
      }
    } catch (error) {
      console.error("SEC EDGAR error:", error);
    }
  }

  // Use OpenAI to analyze and format the data
  const openai = getOpenAI();
  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: SYSTEM_PROMPT + "\n\nIMPORTANT: In the kpis array, value must ALWAYS be a string (not an object). Format numbers appropriately with units.",
      },
      {
        role: "user",
        content: `Analyze this company data and provide a structured summary:
Company: ${entity.companyName || entity.ticker}
Price Data: ${JSON.stringify(priceData)}
Chart Data (last 60 days): ${JSON.stringify(chartData)}
Fundamentals: ${JSON.stringify(fundamentals)}

Return JSON with: 
- summary (string)
- kpis (array of {name: string, value: string, unit: string} - value must be a STRING, not an object)
- peers (array of company name strings)`,
      },
    ],
    response_format: { type: "json_object" },
  });

  let analysis: any = {};
  try {
    const content = completion.choices[0].message.content || "{}";
    analysis = JSON.parse(content);
  } catch (parseError) {
    console.error("JSON parse error in company-snapshot:", parseError);
    analysis = { summary: "Analysis format error", kpis: [], peers: [] };
  }

  // Ensure kpis values are strings
  const kpis = Array.isArray(analysis.kpis) 
    ? analysis.kpis.map((kpi: any) => ({
        name: kpi.name || "Unknown",
        value: typeof kpi.value === 'string' ? kpi.value : String(kpi.value || "N/A"),
        unit: kpi.unit || ""
      }))
    : [];

  return {
    summary: analysis.summary || "No summary available",
    priceData,
    chartData,
    kpis,
    peers: Array.isArray(analysis.peers) ? analysis.peers : [],
    sources,
    lastUpdated: new Date().toISOString(),
  };
}
