import { getOpenAI } from "./openai";

export interface EntityInfo {
  companyName?: string;
  ticker?: string;
  sector?: string;
  country?: string;
  isComparison?: boolean;
  companies?: Array<{
    companyName?: string;
    ticker?: string;
  }>;
}

export async function extractEntityInfo(query: string): Promise<EntityInfo> {
  const openai = getOpenAI();
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `You are an entity extraction system for financial queries. Extract company information from the user's query.

For comparison queries (e.g., "Tesla vs Apple", "compare Microsoft and Google"):
- Set isComparison to true
- Extract all companies in the "companies" array with companyName and ticker
- Also set the first company as the main companyName and ticker

For single company queries:
- Set isComparison to false
- Extract: companyName, ticker, sector, country

Treat any common name as a company (e.g., "apple" → Apple Inc., not the fruit).
Return a JSON object. Leave fields empty if not found.`,
      },
      {
        role: "user",
        content: query,
      },
    ],
    response_format: { type: "json_object" },
  });

  const content = completion.choices[0].message.content || "{}";
  return JSON.parse(content) as EntityInfo;
}
