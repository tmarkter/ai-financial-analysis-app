import { EntityInfo } from "../agent/entity-extraction";
import { getFREDSeries } from "../datasources/fred";
import { getOpenAI, getFREDKey } from "../agent/openai";
import { WIDGET_PROMPTS } from "../config/prompts";

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
  const indicators: MacroIndicator[] = [];
  const sources: Array<{ name: string; timestamp: string; url?: string }> = [];

  // Try to fetch FRED data, but continue even if it fails
  const indicatorSeries = [
    { id: "CPIAUCSL", name: "Consumer Price Index" },
    { id: "DGS10", name: "10-Year Treasury Yield" },
    { id: "UNRATE", name: "Unemployment Rate" },
  ];

  for (const series of indicatorSeries) {
    try {
      const fredKey = getFREDKey();
      if (fredKey) {
        const data = await getFREDSeries(series.id, fredKey);
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

  // Generate comprehensive analysis using OpenAI
  const openai = getOpenAI();
  const prompt = WIDGET_PROMPTS["macro-sector"];
  
  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: prompt?.systemPrompt || "You are a macroeconomic strategist analyzing market conditions and sector performance.",
      },
      {
        role: "user",
        content: `Perform a comprehensive macro and micro analysis for ${entity.companyName || entity.ticker || "the company"}.

${indicators.length > 0 ? `Available macro indicators:\n${JSON.stringify(indicators.map((i) => ({ name: i.name, value: i.value })))}` : 'No specific macro indicators available - use general economic knowledge.'}

Return JSON with:
- summary: comprehensive executive summary and analysis
- indicators: array of ${indicators.length > 0 ? 'the provided indicators with detailed explanations' : 'mock indicators with explanations for display purposes (use realistic current values)'}`,
      },
    ],
    response_format: { type: "json_object" },
  });

  const analysis = JSON.parse(completion.choices[0].message.content || "{}");

  // If we have FRED data, merge explanations
  if (indicators.length > 0 && analysis.indicators) {
    indicators.forEach((indicator, idx) => {
      if (analysis.indicators[idx]) {
        indicator.explanation = analysis.indicators[idx].explanation || "";
      }
    });
  } else if (analysis.indicators && Array.isArray(analysis.indicators)) {
    // Use AI-generated indicators if no FRED data
    analysis.indicators.forEach((ind: any) => {
      indicators.push({
        name: ind.name || "Economic Indicator",
        value: ind.value || 0,
        unit: ind.unit || "",
        explanation: ind.explanation || "",
        chartData: [],
      });
    });
    
    sources.push({
      name: "OpenAI Analysis",
      timestamp: new Date().toISOString(),
    });
  }

  return {
    summary: analysis.summary || "Comprehensive macro and micro analysis completed",
    indicators,
    sources,
    lastUpdated: new Date().toISOString(),
  };
}
