

const BASE_URL = "https://api.stlouisfed.org/fred";

export interface FREDObservation {
  date: string;
  value: number;
}

export async function getFREDSeries(seriesId: string, apiKey: string): Promise<FREDObservation[]> {
  const url = `${BASE_URL}/series/observations?series_id=${seriesId}&api_key=${apiKey}&file_type=json`;
  
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`FRED error: ${response.statusText}`);
  }

  const data = await response.json() as any;
  const observations: FREDObservation[] = [];

  if (data.observations) {
    for (const obs of data.observations) {
      const value = parseFloat(obs.value);
      if (!isNaN(value)) {
        observations.push({
          date: obs.date,
          value,
        });
      }
    }
  }

  return observations;
}
