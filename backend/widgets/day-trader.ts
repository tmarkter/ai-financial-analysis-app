import { EntityInfo } from "../agent/entity-extraction";
import { getFMPQuote, getFMPIntradayPrice } from "../datasources/fmp";
import { getOpenAI } from "../agent/openai";
import { WIDGET_PROMPTS } from "../config/prompts";

export interface DayTraderData {
  summary: string;
  priceAction?: {
    current: number;
    dayHigh: number;
    dayLow: number;
    open: number;
    vwap?: number;
    support: number[];
    resistance: number[];
  };
  technicalIndicators?: {
    rsi?: number;
    macd?: { value: number; signal: number };
    ema9?: number;
    ema20?: number;
    ema50?: number;
  };
  intradayChart?: Array<{ time: string; price: number; volume: number }>;
  tradingSetups?: Array<{ type: string; entry: number; target: number; stop: number; riskReward: number }>;
  sources: Array<{ name: string; timestamp: string }>;
  lastUpdated: string;
}

export async function processDayTrader(
  entity: EntityInfo
): Promise<DayTraderData> {
  const sources: Array<{ name: string; timestamp: string }> = [];
  
  let quoteData, intradayData;
  
  if (entity.ticker) {
    try {
      [quoteData, intradayData] = await Promise.all([
        getFMPQuote(entity.ticker),
        getFMPIntradayPrice(entity.ticker, "5min"),
      ]);
      
      sources.push({
        name: "FMP API (Intraday Data)",
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("FMP error:", error);
    }
  }

  const openai = getOpenAI();
  const prompt = WIDGET_PROMPTS["day-trader"];
  
  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: prompt.systemPrompt,
      },
      {
        role: "user",
        content: `Analyze intraday price action for ${entity.companyName || entity.ticker}:

Current Quote: ${JSON.stringify(quoteData)}
Intraday 5-min Data: ${JSON.stringify(intradayData?.slice(0, 50))}

Provide day trading analysis in JSON: summary, priceAction (support/resistance arrays), technicalIndicators, intradayChart, tradingSetups (array with type, entry, target, stop, riskReward).`,
      },
    ],
    response_format: { type: "json_object" },
  });

  const analysis = JSON.parse(completion.choices[0].message.content || "{}");

  return {
    summary: analysis.summary || "Day trading analysis unavailable",
    priceAction: analysis.priceAction,
    technicalIndicators: analysis.technicalIndicators,
    intradayChart: analysis.intradayChart,
    tradingSetups: analysis.tradingSetups || [],
    sources,
    lastUpdated: new Date().toISOString(),
  };
}
