const BASE_URL = "https://api.gdeltproject.org/api/v2/doc/doc";

export interface NewsArticle {
  title: string;
  url: string;
  source: string;
  publishedAt: string;
  tone?: number;
  language?: string;
}

function detectLanguage(text: string): string {
  if (!text) return "unknown";
  
  const chinesePattern = /[\u4e00-\u9fa5]/;
  const japanesePattern = /[\u3040-\u309f\u30a0-\u30ff]/;
  const koreanPattern = /[\uac00-\ud7af]/;
  const cyrillicPattern = /[\u0400-\u04ff]/;
  
  if (chinesePattern.test(text)) return "zh";
  if (japanesePattern.test(text)) return "ja";
  if (koreanPattern.test(text)) return "ko";
  if (cyrillicPattern.test(text)) return "ru";
  
  return "en";
}

export async function getRecentNews(query: string, languageFilter = "en"): Promise<NewsArticle[]> {
  const encodedQuery = encodeURIComponent(query);
  const url = `${BASE_URL}?query=${encodedQuery}&mode=artlist&maxrecords=50&format=json`;
  
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`GDELT error: ${response.statusText}`);
  }

  const data = await response.json() as any;
  const articles: NewsArticle[] = [];

  if (data.articles) {
    for (const article of data.articles) {
      const title = article.title || "";
      const detectedLang = article.language || detectLanguage(title);
      
      if (languageFilter && detectedLang !== languageFilter) {
        continue;
      }
      
      articles.push({
        title,
        url: article.url || "",
        source: article.domain || "",
        publishedAt: article.seendate || new Date().toISOString(),
        tone: article.tone,
        language: detectedLang,
      });
      
      if (articles.length >= 25) break;
    }
  }

  return articles;
}
