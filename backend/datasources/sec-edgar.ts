const BASE_URL = "https://data.sec.gov";

// Map common company names to CIK numbers (this is a simplified version)
// In production, you'd want a more comprehensive mapping or search API
const COMPANY_CIK_MAP: Record<string, string> = {
  "apple": "0000320193",
  "microsoft": "0000789019",
  "tesla": "0001318605",
  "amazon": "0001018724",
  "google": "0001652044",
  "meta": "0001326801",
  "nvidia": "0001045810",
};

export async function getCompanyFacts(companyName: string): Promise<any> {
  const normalizedName = companyName.toLowerCase();
  const cik = COMPANY_CIK_MAP[normalizedName];
  
  if (!cik) {
    console.log(`No CIK mapping found for ${companyName}`);
    return null;
  }

  const url = `${BASE_URL}/api/xbrl/companyfacts/CIK${cik}.json`;
  
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Financial Analysis App contact@example.com",
    },
  });

  if (!response.ok) {
    throw new Error(`SEC EDGAR error: ${response.statusText}`);
  }

  const data = await response.json() as any;
  
  // Extract key financial metrics
  const facts = data.facts?.["us-gaap"] || {};
  const relevantFacts: Record<string, any> = {};

  // Common financial metrics
  const metrics = [
    "Assets",
    "Liabilities",
    "StockholdersEquity",
    "Revenues",
    "NetIncomeLoss",
    "EarningsPerShareBasic",
  ];

  for (const metric of metrics) {
    if (facts[metric]) {
      const units = facts[metric].units?.USD || facts[metric].units?.["USD/shares"];
      if (units && units.length > 0) {
        const latest = units[units.length - 1];
        relevantFacts[metric] = {
          value: latest.val,
          unit: latest.unit || "USD",
          filed: latest.filed,
        };
      }
    }
  }

  return relevantFacts;
}
