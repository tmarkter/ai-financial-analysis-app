

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

  const quote = data["Global Quote"];
  if (!quote) {
    throw new Error("No quote data available");
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

  const timeSeries = data["Time Series (Daily)"];
  if (!timeSeries) {
    throw new Error("No time series data available");
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
