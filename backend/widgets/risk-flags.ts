import { EntityInfo } from "../agent/entity-extraction";
import { searchSanctions } from "../datasources/opensanctions";
import { getOpenAI } from "../agent/openai";

const SYSTEM_PROMPT = `You are a compliance screener. Query OpenSanctions (yente) with the entity name; if 'hits' > 0, list matched names, dataset(s), and link(s).
Otherwise return 'No hits found'. Do not claim more than the API returns.`;

export interface RiskMatch {
  name: string;
  datasets: string[];
  url?: string;
}

export interface RiskFlagsData {
  summary: string;
  matches: RiskMatch[];
  sources: Array<{ name: string; timestamp: string; url?: string }>;
  lastUpdated: string;
}

export async function processRiskFlags(
  entity: EntityInfo
): Promise<RiskFlagsData> {
  const query = entity.companyName || entity.ticker || "";
  const sanctionsData = await searchSanctions(query);

  const openai = getOpenAI();
  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: SYSTEM_PROMPT,
      },
      {
        role: "user",
        content: `Analyze sanctions screening results for ${query}:
${JSON.stringify(sanctionsData)}

Return JSON with: summary (string), matches (array of {name, datasets, url})`,
      },
    ],
    response_format: { type: "json_object" },
  });

  const analysis = JSON.parse(completion.choices[0].message.content || "{}");

  return {
    summary: analysis.summary || "No hits found",
    matches: analysis.matches || [],
    sources: [
      {
        name: "OpenSanctions",
        timestamp: new Date().toISOString(),
        url: "https://www.opensanctions.org/",
      },
    ],
    lastUpdated: new Date().toISOString(),
  };
}
