import OpenAI from "openai";
import { secret } from "encore.dev/config";

const openAIKey = secret("OpenAIKey");
const alphaVantageKey = secret("AlphaVantageKey");
const fredKey = secret("FREDKey");

export function getOpenAI(): OpenAI {
  return new OpenAI({ apiKey: openAIKey() });
}

export function getAlphaVantageKey(): string {
  return alphaVantageKey();
}

export function getFREDKey(): string {
  return fredKey();
}

export async function createChatCompletion(query: string, systemPrompt?: string): Promise<string> {
  const openai = getOpenAI();
  
  const defaultPrompt = `You are a professional financial analyst assistant. 
Provide informational insights about companies, markets, and investments based on the data provided.
Always cite sources and include timestamps when referencing data.
Do NOT provide personal financial advice - only informational analysis.
Be concise but comprehensive in your responses.`;
  
  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: systemPrompt || defaultPrompt,
      },
      {
        role: "user",
        content: query,
      },
    ],
  });

  return completion.choices[0].message.content || "No response generated.";
}
