import { EntityInfo } from "../agent/entity-extraction";
import { getDailyTimeSeries } from "../datasources/alpha-vantage";
import { getCompanyFacts } from "../datasources/sec-edgar";
import { getOpenAI, getAlphaVantageKey } from "../agent/openai";
import { getCompanySnapshot } from "../orchestrator/company-snapshot-orchestrator";
import { avLimiter, callWithLimit } from "../utils/limiters";

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
  const sources: Array<{ name: string; timestamp: string; url?: string }> = [];

  // Use orchestrator to fetch data from multiple providers with fallbacks
  let priceData;
  let chartData;
  let coreData;
  
  if (entity.ticker) {
    try {
      // Get company core data from orchestrator (Alpha Vantage + FMP with fallbacks)
      coreData = await getCompanySnapshot(entity.ticker);
      
      if (coreData.price) {
        priceData = {
          price: coreData.price,
          change: coreData.change || 0,
          changePercent: coreData.changePercent || 0,
        };
      }

      // Add sources from orchestrator
      if (coreData._sources && coreData._sources.length > 0) {
        coreData._sources.forEach(source => {
          sources.push({
            name: source,
            timestamp: new Date().toISOString(),
          });
        });
      }

      // Fetch time series data with rate limiting
      const avKey = getAlphaVantageKey();
      if (avKey) {
        try {
          const timeSeries = await callWithLimit(avLimiter, () => 
            getDailyTimeSeries(entity.ticker!, avKey)
          );
          if (timeSeries && timeSeries.length > 0) {
            chartData = timeSeries.slice(0, 60).reverse().map((item) => ({
              date: item.date,
              close: item.close,
            }));
          }
        } catch (tsError) {
          console.error("Time series error:", tsError);
        }
      }
    } catch (error) {
      console.error("Company snapshot orchestrator error:", error);
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
Core Data: ${JSON.stringify(coreData)}
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

  // If we have no data at all, throw an error
  if (!priceData && !chartData && kpis.length === 0 && !fundamentals && !coreData) {
    throw new Error("Unable to fetch any data for company snapshot. All data providers failed.");
  }

  return {
    summary: analysis.summary || "Company snapshot data",
    priceData,
    chartData,
    kpis,
    peers: Array.isArray(analysis.peers) ? analysis.peers : [],
    sources,
    lastUpdated: new Date().toISOString(),
  };
}
