import { api } from "encore.dev/api";
import { secret } from "encore.dev/config";

const twelveDataApiKey = secret("TwelveDataApiKey");

export interface TwelveDataPriceRequest {
  symbol: string;
  exchange?: string;
}

export interface TwelveDataPriceResponse {
  symbol: string;
  exchange: string;
  price: number;
  timestamp: string;
  currency?: string;
}

export interface TwelveDataTimeSeriesRequest {
  symbol: string;
  interval?: string;
  exchange?: string;
  outputsize?: number;
}

export interface TwelveDataTimeSeriesResponse {
  symbol: string;
  values: Array<{
    datetime: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume?: number;
  }>;
}

export interface TwelveDataIndicesRequest {
  symbol: string;
  country?: string;
}

export interface TwelveDataIndicesResponse {
  symbol: string;
  name: string;
  country: string;
  currency: string;
  exchange: string;
  price: number;
  change: number;
  percentChange: number;
  timestamp: string;
}

export const getPrice = api(
  { expose: true, method: "GET", path: "/datasources/twelve-data/price" },
  async (req: TwelveDataPriceRequest): Promise<TwelveDataPriceResponse> => {
    const apiKey = twelveDataApiKey();
    if (!apiKey) {
      throw new Error("Twelve Data API key not configured");
    }
    
    const params = new URLSearchParams({
      symbol: req.symbol,
      apikey: apiKey,
    });
    
    if (req.exchange) {
      params.append('exchange', req.exchange);
    }
    
    const url = `https://api.twelvedata.com/price?${params.toString()}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Twelve Data API error: ${response.statusText}`);
    }
    
    const data = await response.json() as any;
    
    if (data.status === 'error') {
      throw new Error(`Twelve Data API error: ${data.message}`);
    }
    
    return {
      symbol: req.symbol,
      exchange: req.exchange || data.exchange || '',
      price: parseFloat(data.price),
      timestamp: new Date().toISOString(),
      currency: data.currency,
    };
  }
);

export const getTimeSeries = api(
  { expose: true, method: "GET", path: "/datasources/twelve-data/time-series" },
  async (req: TwelveDataTimeSeriesRequest): Promise<TwelveDataTimeSeriesResponse> => {
    const apiKey = twelveDataApiKey();
    if (!apiKey) {
      throw new Error("Twelve Data API key not configured");
    }
    
    const params = new URLSearchParams({
      symbol: req.symbol,
      interval: req.interval || '1day',
      apikey: apiKey,
      outputsize: (req.outputsize || 30).toString(),
    });
    
    if (req.exchange) {
      params.append('exchange', req.exchange);
    }
    
    const url = `https://api.twelvedata.com/time_series?${params.toString()}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Twelve Data API error: ${response.statusText}`);
    }
    
    const data = await response.json() as any;
    
    if (data.status === 'error') {
      throw new Error(`Twelve Data API error: ${data.message}`);
    }
    
    const values = (data.values || []).map((v: any) => ({
      datetime: v.datetime,
      open: parseFloat(v.open),
      high: parseFloat(v.high),
      low: parseFloat(v.low),
      close: parseFloat(v.close),
      volume: v.volume ? parseInt(v.volume) : undefined,
    }));
    
    return {
      symbol: req.symbol,
      values,
    };
  }
);

export const getIndices = api(
  { expose: true, method: "GET", path: "/datasources/twelve-data/indices" },
  async (req: TwelveDataIndicesRequest): Promise<TwelveDataIndicesResponse> => {
    const apiKey = twelveDataApiKey();
    if (!apiKey) {
      throw new Error("Twelve Data API key not configured");
    }
    
    const params = new URLSearchParams({
      symbol: req.symbol,
      apikey: apiKey,
    });
    
    if (req.country) {
      params.append('country', req.country);
    }
    
    const quoteUrl = `https://api.twelvedata.com/quote?${params.toString()}`;
    
    const response = await fetch(quoteUrl);
    if (!response.ok) {
      throw new Error(`Twelve Data API error: ${response.statusText}`);
    }
    
    const data = await response.json() as any;
    
    if (data.status === 'error') {
      throw new Error(`Twelve Data API error: ${data.message}`);
    }
    
    return {
      symbol: data.symbol,
      name: data.name,
      country: req.country || '',
      currency: data.currency || '',
      exchange: data.exchange || '',
      price: parseFloat(data.close || data.price),
      change: parseFloat(data.change || '0'),
      percentChange: parseFloat(data.percent_change || '0'),
      timestamp: data.timestamp || new Date().toISOString(),
    };
  }
);