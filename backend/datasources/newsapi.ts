import { secret } from "encore.dev/config";

const newsApiKey = secret("NewsAPIKey");

export function getNewsAPIKey(): string {
  return newsApiKey();
}

const NEWS_API_BASE_URL = "https://newsapi.org/v2";

export interface NewsArticle {
  source: {
    id: string | null;
    name: string;
  };
  author: string | null;
  title: string;
  description: string;
  url: string;
  urlToImage: string | null;
  publishedAt: string;
  content: string;
}

export interface NewsResponse {
  status: string;
  totalResults: number;
  articles: NewsArticle[];
}

export async function getTopHeadlines(
  category?: string,
  country: string = "us",
  pageSize: number = 20
): Promise<NewsResponse> {
  const apiKey = getNewsAPIKey();
  let url = `${NEWS_API_BASE_URL}/top-headlines?country=${country}&pageSize=${pageSize}&apiKey=${apiKey}`;
  
  if (category) {
    url += `&category=${category}`;
  }
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`News API error: ${response.statusText}`);
  }
  
  return await response.json() as NewsResponse;
}

export async function searchNews(
  query: string,
  from?: string,
  to?: string,
  sortBy: string = "publishedAt",
  pageSize: number = 20
): Promise<NewsResponse> {
  const apiKey = getNewsAPIKey();
  let url = `${NEWS_API_BASE_URL}/everything?q=${encodeURIComponent(query)}&sortBy=${sortBy}&pageSize=${pageSize}&apiKey=${apiKey}`;
  
  if (from) url += `&from=${from}`;
  if (to) url += `&to=${to}`;
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`News API error: ${response.statusText}`);
  }
  
  return await response.json() as NewsResponse;
}

export async function getBusinessNews(
  query?: string,
  pageSize: number = 20
): Promise<NewsResponse> {
  const apiKey = getNewsAPIKey();
  
  if (query) {
    return searchNews(query, undefined, undefined, "publishedAt", pageSize);
  }
  
  return getTopHeadlines("business", "us", pageSize);
}

export async function getCompanyNews(
  companyName: string,
  pageSize: number = 10
): Promise<NewsResponse> {
  const today = new Date();
  const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
  
  return searchNews(
    companyName,
    thirtyDaysAgo.toISOString().split('T')[0],
    today.toISOString().split('T')[0],
    "publishedAt",
    pageSize
  );
}
