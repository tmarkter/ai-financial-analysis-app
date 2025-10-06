

const BASE_URL = "https://www.alphavantage.co/query";

export interface GlobalQuoteData {
  symbol: string;
  price: string;
  change: string;
  changePercent: string;
  volume: string;
}

export interface DailyTimeSeriesItem {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export async function getGlobalQuote(symbol: string, apiKey: string): Promise<GlobalQuoteData> {
  const url = `${BASE_URL}?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${apiKey}`;
  
  const response = await fetch(url);
  const data = await response.json() as any;

  if (data["Error Message"]) {
    throw new Error(`Alpha Vantage error: ${data["Error Message"]}`);
  }

  if (data["Note"]) {
    throw new Error(`Alpha Vantage rate limit: ${data["Note"]}`);
  }

  if (data["Information"]) {
    throw new Error(`Alpha Vantage info: ${data["Information"]}`);
  }

  const quote = data["Global Quote"];
  if (!quote || Object.keys(quote).length === 0) {
    console.error("Alpha Vantage response:", JSON.stringify(data));
    throw new Error(`No quote data available for symbol: ${symbol}. Response: ${JSON.stringify(data).substring(0, 200)}`);
  }

  return {
    symbol: quote["01. symbol"],
    price: quote["05. price"],
    change: quote["09. change"],
    changePercent: quote["10. change percent"],
    volume: quote["06. volume"],
  };
}

export async function getDailyTimeSeries(
  symbol: string,
  apiKey: string
): Promise<DailyTimeSeriesItem[]> {
  const url = `${BASE_URL}?function=TIME_SERIES_DAILY&symbol=${symbol}&outputsize=compact&apikey=${apiKey}`;
  
  const response = await fetch(url);
  const data = await response.json() as any;

  if (data["Error Message"]) {
    throw new Error(`Alpha Vantage error: ${data["Error Message"]}`);
  }

  if (data["Note"]) {
    throw new Error(`Alpha Vantage rate limit: ${data["Note"]}`);
  }

  if (data["Information"]) {
    throw new Error(`Alpha Vantage info: ${data["Information"]}`);
  }

  const timeSeries = data["Time Series (Daily)"];
  if (!timeSeries) {
    console.error("Alpha Vantage response:", JSON.stringify(data));
    throw new Error(`No time series data available for symbol: ${symbol}`);
  }

  const items: DailyTimeSeriesItem[] = [];
  for (const [date, values] of Object.entries(timeSeries)) {
    items.push({
      date,
      open: parseFloat((values as any)["1. open"]),
      high: parseFloat((values as any)["2. high"]),
      low: parseFloat((values as any)["3. low"]),
      close: parseFloat((values as any)["4. close"]),
      volume: parseInt((values as any)["5. volume"]),
    });
  }

  return items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export interface CompanyOverviewData {
  symbol: string;
  name: string;
  description: string;
  sector: string;
  industry: string;
  marketCap: string;
  peRatio: string;
  pegRatio: string;
  bookValue: string;
  dividendYield: string;
  eps: string;
  revenuePerShare: string;
  profitMargin: string;
  operatingMargin: string;
  returnOnAssets: string;
  returnOnEquity: string;
  revenue: string;
  grossProfit: string;
  dilutedEPS: string;
  quarterlyEarningsGrowth: string;
  quarterlyRevenueGrowth: string;
  analystTargetPrice: string;
  trailingPE: string;
  forwardPE: string;
  priceToSales: string;
  priceToBook: string;
  evToRevenue: string;
  evToEBITDA: string;
  beta: string;
  week52High: string;
  week52Low: string;
  day50MovingAverage: string;
  day200MovingAverage: string;
}

export async function getCompanyOverview(
  symbol: string,
  apiKey: string
): Promise<CompanyOverviewData> {
  const url = `${BASE_URL}?function=OVERVIEW&symbol=${symbol}&apikey=${apiKey}`;
  
  const response = await fetch(url);
  const data = await response.json() as any;

  if (data["Error Message"]) {
    throw new Error(`Alpha Vantage error: ${data["Error Message"]}`);
  }

  if (data["Note"]) {
    throw new Error(`Alpha Vantage rate limit: ${data["Note"]}`);
  }

  if (data["Information"]) {
    throw new Error(`Alpha Vantage info: ${data["Information"]}`);
  }

  if (!data.Symbol) {
    console.error("Alpha Vantage response:", JSON.stringify(data));
    throw new Error(`No company overview data available for symbol: ${symbol}`);
  }

  return {
    symbol: data.Symbol || "",
    name: data.Name || "",
    description: data.Description || "",
    sector: data.Sector || "",
    industry: data.Industry || "",
    marketCap: data.MarketCapitalization || "",
    peRatio: data.PERatio || "",
    pegRatio: data.PEGRatio || "",
    bookValue: data.BookValue || "",
    dividendYield: data.DividendYield || "",
    eps: data.EPS || "",
    revenuePerShare: data.RevenuePerShareTTM || "",
    profitMargin: data.ProfitMargin || "",
    operatingMargin: data.OperatingMarginTTM || "",
    returnOnAssets: data.ReturnOnAssetsTTM || "",
    returnOnEquity: data.ReturnOnEquityTTM || "",
    revenue: data.RevenueTTM || "",
    grossProfit: data.GrossProfitTTM || "",
    dilutedEPS: data.DilutedEPSTTM || "",
    quarterlyEarningsGrowth: data.QuarterlyEarningsGrowthYOY || "",
    quarterlyRevenueGrowth: data.QuarterlyRevenueGrowthYOY || "",
    analystTargetPrice: data.AnalystTargetPrice || "",
    trailingPE: data.TrailingPE || "",
    forwardPE: data.ForwardPE || "",
    priceToSales: data.PriceToSalesRatioTTM || "",
    priceToBook: data.PriceToBookRatio || "",
    evToRevenue: data.EVToRevenue || "",
    evToEBITDA: data.EVToEBITDA || "",
    beta: data.Beta || "",
    week52High: data["52WeekHigh"] || "",
    week52Low: data["52WeekLow"] || "",
    day50MovingAverage: data["50DayMovingAverage"] || "",
    day200MovingAverage: data["200DayMovingAverage"] || "",
  };
}
