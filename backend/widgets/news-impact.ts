import { EntityInfo } from "../agent/entity-extraction";
import { getRecentNews } from "../datasources/gdelt";
import { getCompanyNews } from "../datasources/newsapi";
import { getOpenAI } from "../agent/openai";
import { WIDGET_PROMPTS } from "../config/prompts";

export interface NewsItem {
  title: string;
  source: string;
  time: string;
  sentiment: "pos" | "neg" | "mix";
  impactHypothesis: string;
  url: string;
}

export interface NewsImpactData {
  summary: string;
  news: NewsItem[];
  sources: Array<{ name: string; timestamp: string; url?: string }>;
  lastUpdated: string;
}

export async function processNewsImpact(
  entity: EntityInfo
): Promise<NewsImpactData> {
  const query = entity.companyName || entity.ticker || "";
  const sources: Array<{ name: string; timestamp: string; url?: string }> = [];
  
  let articles: any[] = [];
  
  // Try News API first
  try {
    const newsApiResults = await getCompanyNews(query);
    articles = newsApiResults.articles.map(a => ({
      title: a.title,
      source: a.source.name,
      url: a.url,
      publishedAt: a.publishedAt,
      description: a.description,
    }));
    
    sources.push({
      name: "News API",
      timestamp: new Date().toISOString(),
      url: "https://newsapi.org/",
    });
  } catch (error) {
    console.error("News API error:", error);
    
    // Fallback to GDELT
    try {
      articles = await getRecentNews(query);
      sources.push({
        name: "GDELT DOC 2.0",
        timestamp: new Date().toISOString(),
        url: "https://www.gdeltproject.org/",
      });
    } catch (gdeltError) {
      console.error("GDELT error:", gdeltError);
    }
  }

  const openai = getOpenAI();
  const prompt = WIDGET_PROMPTS["news-impact"] || { systemPrompt: "Analyze news articles for financial impact." };
  
  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: prompt.systemPrompt + "\n\nYou MUST respond with valid JSON only. The response must have this exact structure: {\"summary\": \"...\", \"news\": [{\"title\": \"...\", \"source\": \"...\", \"time\": \"...\", \"sentiment\": \"pos|neg|mix\", \"impactHypothesis\": \"...\", \"url\": \"...\"}]}",
      },
      {
        role: "user",
        content: `Analyze these news articles for ${query}:
${JSON.stringify(articles.slice(0, 15))}

Return valid JSON with: summary (string), news (array of {title, source, time, sentiment ("pos", "neg", or "mix"), impactHypothesis, url})`,
      },
    ],
    response_format: { type: "json_object" },
  });

  let analysis: any = {};
  try {
    const content = completion.choices[0].message.content || "{}";
    analysis = JSON.parse(content);
  } catch (parseError) {
    console.error("JSON parse error in news-impact:", parseError);
    console.error("Raw content:", completion.choices[0].message.content);
    analysis = { summary: "Analysis format error", news: [] };
  }

  return {
    summary: analysis.summary || "No news summary available",
    news: Array.isArray(analysis.news) ? analysis.news : [],
    sources,
    lastUpdated: new Date().toISOString(),
  };
}
