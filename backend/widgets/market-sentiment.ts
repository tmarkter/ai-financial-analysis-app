import { EntityInfo } from "../agent/entity-extraction";
import { getRecentNews } from "../datasources/gdelt";
import { getOpenAI } from "../agent/openai";
import { WIDGET_PROMPTS } from "../config/prompts";

export interface SentimentIndicator {
  metric: string;
  value: number;
  trend: "bullish" | "bearish" | "neutral";
  explanation: string;
}

export interface MarketSentimentData {
  overallSentiment: "bullish" | "bearish" | "neutral";
  confidence: number;
  indicators: SentimentIndicator[];
  summary: string;
  socialMediaBuzz: {
    volume: "high" | "medium" | "low";
    sentiment: "positive" | "negative" | "mixed";
  };
  sources: Array<{ name: string; timestamp: string }>;
  lastUpdated: string;
}

export async function processMarketSentiment(
  entity: EntityInfo
): Promise<MarketSentimentData> {
  const query = entity.companyName || entity.ticker || "market";
  const sources: Array<{ name: string; timestamp: string }> = [];
  
  let articles: any[] = [];
  
  try {
    articles = await getRecentNews(query);
    sources.push({
      name: "GDELT DOC 2.0",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("GDELT error:", error);
  }

  const openai = getOpenAI();
  const prompt = WIDGET_PROMPTS["market-sentiment"] || {
    systemPrompt: `You are a market sentiment analysis AI agent. Analyze news and data to determine market sentiment.

Provide:
1. Overall sentiment: "bullish", "bearish", or "neutral"
2. Confidence score (0-100)
3. Sentiment indicators with metrics, values, trends, and explanations
4. Summary of sentiment drivers
5. Social media buzz analysis

Return JSON with: overallSentiment, confidence, indicators (array of {metric, value, trend, explanation}), summary, socialMediaBuzz {volume, sentiment}`
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
        content: `Analyze market sentiment for ${query} based on these articles:
${JSON.stringify(articles.slice(0, 20))}`,
      },
    ],
    response_format: { type: "json_object" },
  });

  let analysis: any = {};
  try {
    const content = completion.choices[0].message.content || "{}";
    analysis = JSON.parse(content);
  } catch (parseError) {
    console.error("JSON parse error in market-sentiment:", parseError);
    analysis = {
      overallSentiment: "neutral",
      confidence: 0,
      indicators: [],
      summary: "Analysis format error",
      socialMediaBuzz: { volume: "low", sentiment: "mixed" }
    };
  }

  return {
    overallSentiment: analysis.overallSentiment || "neutral",
    confidence: analysis.confidence || 0,
    indicators: Array.isArray(analysis.indicators) ? analysis.indicators : [],
    summary: analysis.summary || "No sentiment summary available",
    socialMediaBuzz: analysis.socialMediaBuzz || { volume: "low", sentiment: "mixed" },
    sources,
    lastUpdated: new Date().toISOString(),
  };
}
