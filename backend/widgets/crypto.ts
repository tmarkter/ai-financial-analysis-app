import { getCryptoPrice } from "../datasources/coingecko";

export interface CryptoData {
  summary: string;
  prices: Array<{
    id: string;
    name: string;
    price: number;
    change24h: number;
  }>;
  sources: Array<{ name: string; timestamp: string; url?: string }>;
  lastUpdated: string;
}

export async function processCrypto(query: string): Promise<CryptoData> {
  const cryptoIds = ["bitcoin", "ethereum"];
  const pricesData = await getCryptoPrice(cryptoIds);

  const prices = Object.entries(pricesData).map(([id, data]) => ({
    id,
    name: id.charAt(0).toUpperCase() + id.slice(1),
    price: data.usd,
    change24h: data.usd_24h_change,
  }));

  return {
    summary: `Current cryptocurrency prices for ${prices.map((p) => p.name).join(", ")}`,
    prices,
    sources: [
      {
        name: "CoinGecko",
        timestamp: new Date().toISOString(),
        url: "https://www.coingecko.com/",
      },
    ],
    lastUpdated: new Date().toISOString(),
  };
}
