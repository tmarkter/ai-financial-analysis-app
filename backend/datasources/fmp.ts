import { secret } from "encore.dev/config";

const fmpApiKey = secret("FMPKey");

export function getFMPKey(): string {
  return fmpApiKey();
}

const FMP_BASE_URL = "https://financialmodelingprep.com/api/v3";
const TIMEOUT_MS = 7000;
const MAX_RETRIES = 2;

async function fetchWithTimeout(url: string, timeoutMs = TIMEOUT_MS): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    const response = await fetch(url, { signal: controller.signal });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

function normalizeSymbol(symbol: string): string {
  return symbol?.trim().toUpperCase().replace(/\.(US|AX|L)$/i, "");
}

export interface FMPQuote {
  symbol: string;
  name: string;
  price: number;
  changesPercentage: number;
  change: number;
  dayLow: number;
  dayHigh: number;
  yearHigh: number;
  yearLow: number;
  marketCap: number;
  priceAvg50: number;
  priceAvg200: number;
  volume: number;
  avgVolume: number;
  open: number;
  previousClose: number;
  eps: number;
  pe: number;
  earningsAnnouncement?: string;
}

export interface FMPFinancials {
  symbol: string;
  date: string;
  revenue: number;
  netIncome: number;
  grossProfit: number;
  eps: number;
  operatingIncome: number;
  ebitda: number;
}

export interface FMPRatios {
  symbol: string;
  date: string;
  currentRatio: number;
  quickRatio: number;
  debtEquityRatio: number;
  returnOnEquity: number;
  returnOnAssets: number;
  priceEarningsRatio: number;
  priceToBookRatio: number;
  dividendYield: number;
}

export async function getFMPQuote(symbol: string): Promise<FMPQuote> {
  const normalizedSymbol = normalizeSymbol(symbol);
  
  try {
    const apiKey = getFMPKey();
    const url = `${FMP_BASE_URL}/quote/${normalizedSymbol}?apikey=${apiKey}`;
    
    let lastError: any;
    for (let i = 0; i <= MAX_RETRIES; i++) {
      try {
        const response = await fetchWithTimeout(url);
        
        if (response.status === 403) {
          throw new Error(`API_KEY_INVALID: Check FMP API key or upgrade plan`);
        }
        
        if (!response.ok) {
          throw new Error(`HTTP_${response.status}`);
        }
        
        const data = await response.json();
        if (!Array.isArray(data) || data.length === 0) {
          throw new Error(`NO_DATA: ${normalizedSymbol}`);
        }
        
        return data[0];
      } catch (error: any) {
        lastError = error;
        if (error.message?.includes('API_KEY_INVALID')) {
          throw error;
        }
        if (i < MAX_RETRIES) {
          await new Promise(resolve => setTimeout(resolve, 350 * (i + 1)));
        }
      }
    }
    
    throw lastError;
  } catch (error: any) {
    if (error.message?.includes('API_KEY_INVALID')) {
      console.warn(`FMP API key issue for ${normalizedSymbol}, using fallback data`);
      return createFallbackQuote(normalizedSymbol);
    }
    throw error;
  }
}

function createFallbackQuote(symbol: string): FMPQuote {
  return {
    symbol,
    name: symbol,
    price: 0,
    changesPercentage: 0,
    change: 0,
    dayLow: 0,
    dayHigh: 0,
    yearHigh: 0,
    yearLow: 0,
    marketCap: 0,
    priceAvg50: 0,
    priceAvg200: 0,
    volume: 0,
    avgVolume: 0,
    open: 0,
    previousClose: 0,
    eps: 0,
    pe: 0,
  };
}

export async function getFMPFinancials(symbol: string, limit: number = 4): Promise<FMPFinancials[]> {
  const apiKey = getFMPKey();
  const url = `${FMP_BASE_URL}/income-statement/${symbol}?limit=${limit}&apikey=${apiKey}`;
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`FMP API error: ${response.statusText}`);
  }
  
  return await response.json() as FMPFinancials[];
}

export async function getFMPRatios(symbol: string, limit: number = 4): Promise<FMPRatios[]> {
  const normalizedSymbol = normalizeSymbol(symbol);
  const apiKey = getFMPKey();
  const url = `${FMP_BASE_URL}/ratios/${normalizedSymbol}?limit=${limit}&apikey=${apiKey}`;
  
  let lastError: any;
  for (let i = 0; i <= MAX_RETRIES; i++) {
    try {
      const response = await fetchWithTimeout(url);
      if (!response.ok) {
        throw new Error(`HTTP_${response.status}`);
      }
      
      return await response.json() as FMPRatios[];
    } catch (error: any) {
      lastError = error;
      if (i < MAX_RETRIES) {
        await new Promise(resolve => setTimeout(resolve, 350 * (i + 1)));
      }
    }
  }
  
  throw lastError;
}

export async function getFMPHistoricalPrice(symbol: string, from?: string, to?: string): Promise<any[]> {
  const apiKey = getFMPKey();
  let url = `${FMP_BASE_URL}/historical-price-full/${symbol}?apikey=${apiKey}`;
  
  if (from) url += `&from=${from}`;
  if (to) url += `&to=${to}`;
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`FMP API error: ${response.statusText}`);
  }
  
  const data: any = await response.json();
  return data.historical || [];
}

export async function getFMPIntradayPrice(symbol: string, interval: string = "5min"): Promise<any[]> {
  const apiKey = getFMPKey();
  const url = `${FMP_BASE_URL}/historical-chart/${interval}/${symbol}?apikey=${apiKey}`;
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`FMP API error: ${response.statusText}`);
  }
  
  return await response.json() as any[];
}

export async function getFMPCompanyProfile(symbol: string): Promise<any> {
  const normalizedSymbol = normalizeSymbol(symbol);
  const apiKey = getFMPKey();
  const url = `${FMP_BASE_URL}/profile/${normalizedSymbol}?apikey=${apiKey}`;
  
  let lastError: any;
  for (let i = 0; i <= MAX_RETRIES; i++) {
    try {
      const response = await fetchWithTimeout(url);
      if (!response.ok) {
        throw new Error(`HTTP_${response.status}`);
      }
      
      const data = await response.json();
      return Array.isArray(data) ? data[0] : data;
    } catch (error: any) {
      lastError = error;
      if (i < MAX_RETRIES) {
        await new Promise(resolve => setTimeout(resolve, 350 * (i + 1)));
      }
    }
  }
  
  throw lastError;
}

export async function getFMPMarketCap(symbol: string): Promise<any> {
  const apiKey = getFMPKey();
  const url = `${FMP_BASE_URL}/market-capitalization/${symbol}?apikey=${apiKey}`;
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`FMP API error: ${response.statusText}`);
  }
  
  return await response.json();
}

export async function getFMPPeers(symbol: string): Promise<string[]> {
  const apiKey = getFMPKey();
  const url = `${FMP_BASE_URL}/stock_peers?symbol=${symbol}&apikey=${apiKey}`;
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`FMP API error: ${response.statusText}`);
  }
  
  const data: any = await response.json();
  return data[0]?.peersList || [];
}

export async function getFMPNews(symbol?: string, limit: number = 10): Promise<any[]> {
  const apiKey = getFMPKey();
  let url = `${FMP_BASE_URL}/stock_news?limit=${limit}&apikey=${apiKey}`;
  
  if (symbol) {
    url = `${FMP_BASE_URL}/stock_news?tickers=${symbol}&limit=${limit}&apikey=${apiKey}`;
  }
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`FMP API error: ${response.statusText}`);
  }
  
  return await response.json() as any[];
}
