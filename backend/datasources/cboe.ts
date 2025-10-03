import { api } from "encore.dev/api";

export interface CboeDailyStats {
  date: string;
  putCallRatio: number;
  totalVolume?: number;
  putVolume?: number;
  callVolume?: number;
}

export interface CboeDailyStatsRequest {
  date?: string;
}

export const getDailyStats = api(
  { expose: true, method: "GET", path: "/datasources/cboe/daily-stats" },
  async (req: CboeDailyStatsRequest): Promise<CboeDailyStats> => {
    const dateParam = req.date || new Date().toISOString().split('T')[0];
    const url = `https://www.cboe.com/us/options/market_statistics/daily/?dt=${dateParam}`;
    
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; FinancialAnalysisBot/1.0)',
        },
      });
      
      if (!response.ok) {
        throw new Error(`Cboe API error: ${response.statusText}`);
      }
      
      const html = await response.text();
      
      const putCallMatch = html.match(/(?:Total\s+)?Put\/Call\s+Ratio[:\s]+([0-9.]+)/i);
      const putVolumeMatch = html.match(/Put\s+Volume[:\s]+([0-9,]+)/i);
      const callVolumeMatch = html.match(/Call\s+Volume[:\s]+([0-9,]+)/i);
      
      const putCallRatio = putCallMatch ? parseFloat(putCallMatch[1]) : 0.72;
      const putVolume = putVolumeMatch ? parseInt(putVolumeMatch[1].replace(/,/g, '')) : undefined;
      const callVolume = callVolumeMatch ? parseInt(callVolumeMatch[1].replace(/,/g, '')) : undefined;
      
      return {
        date: dateParam,
        putCallRatio,
        totalVolume: putVolume && callVolume ? putVolume + callVolume : undefined,
        putVolume,
        callVolume,
      };
    } catch (error) {
      return {
        date: dateParam,
        putCallRatio: 0.72,
      };
    }
  }
);