import { EntityInfo } from "../agent/entity-extraction";
import { getFREDSeries } from "../datasources/fred";
import { getOpenAI, getFREDKey } from "../agent/openai";

const SYSTEM_PROMPT = `You are a professional financial and investment analyst. Prepare a comprehensive and structured analysis of any bank (or financial institution) using a clear framework that combines both internal (Micro factors) and external (Macro factors) that investors consider before making an investment decision.

✦ Deliverables:
Executive Summary: Provide a brief overview of the bank's position and the industry context.

Micro Analysis (Internal – Bank-Specific Factors):
- Profitability: Net Interest Margin (NIM), Return on Assets (ROA), Return on Equity (ROE).
- Asset Quality: Non-Performing Loans (NPL) ratio, Provision Coverage, Loan-to-Deposit ratio.
- Capital Adequacy: CET1 ratio, Total Capital Ratio.
- Operational Efficiency: Cost-to-Income ratio.
- Growth: Loan and deposit growth trends.
- Income Diversification: Fee-based income vs. interest income.
- Digitalization & Innovation: Fintech integration, mobile adoption, cost efficiency from digital channels.
- Management & Governance: Leadership quality, governance, and risk management practices.

Macro Analysis (External – Market & Economic Factors):
- Interest Rate Environment.
- Economic Growth (GDP trends).
- Inflation impact.
- Unemployment levels.
- Monetary Policy & Regulation (Basel III/IV, IFRS 9, AML/KYC, central bank rules).
- Political & Sovereign Risk.
- Currency Stability.
- Competition & Market Consolidation.

Valuation Metrics: Price-to-Book (P/B), Price-to-Earnings (P/E), Dividend Yield, EV/EBITDA.

Forward-Looking Outlook: Opportunities, risks, and expected future performance.

✦ Instructions:
Use a structured, section-based format with clear headings and subheadings.
Provide explanations and, where relevant, examples or implications.
Link financial indicators to expected investor outcomes.
Ensure the analysis is suitable for use in an equity research report or investment memo.`;

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
  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: SYSTEM_PROMPT,
      },
      {
        role: "user",
        content: `Perform a comprehensive macro and micro analysis for ${entity.companyName || entity.ticker || "the financial institution"}.

${indicators.length > 0 ? `Available macro indicators:\n${JSON.stringify(indicators.map((i) => ({ name: i.name, value: i.value })))}` : 'No specific macro indicators available - use general economic knowledge.'}

Provide:
1. Executive Summary
2. Micro Analysis (if this is a financial institution, include all bank-specific factors; otherwise adapt to the company type)
3. Macro Analysis ${indicators.length > 0 ? 'using the provided indicators' : 'based on current economic conditions'}
4. Key insights and forward-looking outlook

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
