import { safeJSON } from "./format";

export interface EarningsQuality {
  revenueRecognition?: string;
  nonRecurringItems?: string;
  accountingRedFlags?: string;
}

export function normalizeEarningsQuality(input: unknown): string[] {
  const eq = (typeof input === "string" ? safeJSON<EarningsQuality>(input) : input) as Partial<EarningsQuality> | undefined;
  
  if (!eq || typeof eq !== "object") return [];
  
  const out: string[] = [];
  if (eq.revenueRecognition) out.push(`Revenue Recognition: ${eq.revenueRecognition}`);
  if (eq.nonRecurringItems) out.push(`Non-Recurring Items: ${eq.nonRecurringItems}`);
  if (eq.accountingRedFlags) out.push(`Red Flags: ${eq.accountingRedFlags}`);
  
  return out;
}

export function detectLanguage(text: string): string {
  if (!text) return "unknown";
  
  const chinesePattern = /[\u4e00-\u9fa5]/;
  const japanesePattern = /[\u3040-\u309f\u30a0-\u30ff]/;
  const koreanPattern = /[\uac00-\ud7af]/;
  const cyrillicPattern = /[\u0400-\u04ff]/;
  
  if (chinesePattern.test(text)) return "zh";
  if (japanesePattern.test(text)) return "ja";
  if (koreanPattern.test(text)) return "ko";
  if (cyrillicPattern.test(text)) return "ru";
  
  return "en";
}

export function filterEnglishNews<T extends { title?: string; summary?: string; description?: string; language?: string }>(
  articles: T[]
): T[] {
  return articles.filter(article => {
    if (article.language && article.language.toLowerCase().startsWith("en")) return true;
    
    const text = article.title || article.summary || article.description || "";
    const detectedLang = detectLanguage(text);
    
    return detectedLang === "en";
  });
}
