import { api } from "encore.dev/api";
import OpenAI from "openai";
import { getOpenAIConfig } from "../agent/openai";
import { getPrompt } from "../config/prompts";

export interface GlobalIndexRow {
  name: string;
  ticker: string;
  last: number;
  changePct: number;
  local: string;
}

export interface GlobalIndicesData {
  rows: GlobalIndexRow[];
  sources?: { name: string }[];
  lastUpdated?: string;
}

const MAJOR_INDICES = [
  { name: "ADX General", ticker: "ADXGI", region: "UAE" },
  { name: "DFM General", ticker: "DFMGI", region: "UAE" },
  { name: "FTSE 100", ticker: "UKX", region: "UK" },
  { name: "DAX", ticker: "DAX", region: "Germany" },
  { name: "S&P 500", ticker: "SPX", region: "US" },
  { name: "NASDAQ", ticker: "CCMP", region: "US" },
  { name: "Nikkei 225", ticker: "NKY", region: "Japan" },
  { name: "Hang Seng", ticker: "HSI", region: "Hong Kong" },
];

export const globalIndices = api(
  { expose: true, method: "POST", path: "/widgets/global-indices" },
  async (params: { query: string }): Promise<GlobalIndicesData> => {
    const config = getOpenAIConfig();
    const openai = new OpenAI({ apiKey: config.apiKey });

    const systemPrompt = await getPrompt("global-indices");

    const userPrompt = `
Query: ${params.query}

Generate a snapshot of global market indices focusing on GCC and major international markets.
Return data for these indices: ${MAJOR_INDICES.map((i) => `${i.name} (${i.ticker})`).join(", ")}

Return JSON matching:
{
  "rows": [
    {
      "name": "ADX General",
      "ticker": "ADXGI",
      "last": 9250.5,
      "changePct": 0.45,
      "local": "UAE"
    }
  ],
  "sources": [{"name": "Market Data"}],
  "lastUpdated": "${new Date().toISOString()}"
}
`.trim();

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.3,
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0].message.content || "{}";
    const result = JSON.parse(content) as GlobalIndicesData;

    return result;
  }
);