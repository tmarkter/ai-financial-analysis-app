import { EntityInfo } from "../agent/entity-extraction";
import { getFREDSeries } from "../datasources/fred";
import { getOpenAI, getFREDKey } from "../agent/openai";

const SYSTEM_PROMPT = `You are a macro explainer. Fetch 2–4 time series (from FRED/World Bank/IMF) most relevant to the entity's country/sector (e.g., CPI, 10Y yield, PMI, GDP growth).
Return short notes on why each matters to the entity's valuation or risk, plus sources and last values.`;

export interface MacroIndicator {
  name: string;
  value: number;
  unit: string;
  explanation: string;
  chartData: Array<{ date: string; value: number }>;
}

export interface MacroSectorData {
  summary: string;
  indicators: MacroIndicator[];
  sources: Array<{ name: string; timestamp: string; url?: string }>;
  lastUpdated: string;
}

export async function processMacroSector(
  entity: EntityInfo
): Promise<MacroSectorData> {
  // Default to US indicators for now
  const indicatorSeries = [
    { id: "CPIAUCSL", name: "Consumer Price Index" },
    { id: "DGS10", name: "10-Year Treasury Yield" },
    { id: "UNRATE", name: "Unemployment Rate" },
  ];

  const indicators: MacroIndicator[] = [];
  const sources: Array<{ name: string; timestamp: string; url?: string }> = [];

  for (const series of indicatorSeries) {
    try {
      const data = await getFREDSeries(series.id, getFREDKey());
      if (data.length > 0) {
        const latestValue = data[data.length - 1].value;
        indicators.push({
          name: series.name,
          value: latestValue,
          unit: series.id === "DGS10" ? "%" : series.id === "UNRATE" ? "%" : "Index",
          explanation: "",
          chartData: data.slice(-90).map((item) => ({
            date: item.date,
            value: item.value,
          })),
        });
      }
    } catch (error) {
      console.error(`Error fetching ${series.id}:`, error);
    }
  }

  if (indicators.length > 0) {
    sources.push({
      name: "FRED (Federal Reserve Economic Data)",
      timestamp: new Date().toISOString(),
      url: "https://fred.stlouisfed.org/",
    });
  }

  // Use OpenAI to explain relevance
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
        content: `Explain how these macro indicators relate to ${entity.companyName || entity.ticker}:
${JSON.stringify(indicators.map((i) => ({ name: i.name, value: i.value })))}

Return JSON with: summary (string), and for each indicator add an explanation field.`,
      },
    ],
    response_format: { type: "json_object" },
  });

  const analysis = JSON.parse(completion.choices[0].message.content || "{}");

  // Merge explanations
  if (analysis.indicators) {
    indicators.forEach((indicator, idx) => {
      if (analysis.indicators[idx]) {
        indicator.explanation = analysis.indicators[idx].explanation || "";
      }
    });
  }

  return {
    summary: analysis.summary || "Macro indicators fetched",
    indicators,
    sources,
    lastUpdated: new Date().toISOString(),
  };
}
