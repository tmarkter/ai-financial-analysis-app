const BASE_URL = "https://api.opensanctions.org";

export interface SanctionMatch {
  name: string;
  datasets: string[];
  schema: string;
  score?: number;
}

export async function searchSanctions(query: string): Promise<SanctionMatch[]> {
  const encodedQuery = encodeURIComponent(query);
  const url = `${BASE_URL}/search/default?q=${encodedQuery}`;
  
  const response = await fetch(url);
  
  if (!response.ok) {
    // OpenSanctions might not always be available, so we gracefully handle errors
    console.error(`OpenSanctions error: ${response.statusText}`);
    return [];
  }

  const data = await response.json() as any;
  const matches: SanctionMatch[] = [];

  if (data.results) {
    for (const result of data.results) {
      matches.push({
        name: result.caption || result.id,
        datasets: result.datasets || [],
        schema: result.schema || "unknown",
        score: result.score,
      });
    }
  }

  return matches;
}
