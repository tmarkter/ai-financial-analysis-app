const BASE_URL = "https://api.coingecko.com/api/v3";

export interface CryptoPriceData {
  usd: number;
  usd_24h_change: number;
}

export async function getCryptoPrice(
  ids: string[]
): Promise<Record<string, CryptoPriceData>> {
  const idsParam = ids.join(",");
  const url = `${BASE_URL}/simple/price?ids=${idsParam}&vs_currencies=usd&include_24hr_change=true`;
  
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`CoinGecko error: ${response.statusText}`);
  }

  return await response.json() as Record<string, CryptoPriceData>;
}
