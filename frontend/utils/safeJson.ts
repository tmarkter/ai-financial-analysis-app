export function tryParseJson<T = any>(s: unknown): { ok: true; data: T } | { ok: false; reason: string } {
  if (typeof s !== "string") return { ok: false, reason: "Not a string" };
  
  try { 
    return { ok: true, data: JSON.parse(s) }; 
  } catch {}
  
  const fencedMatch = s.match(/```json\s*([\s\S]*?)\s*```/i);
  if (fencedMatch?.[1]) {
    try { 
      return { ok: true, data: JSON.parse(fencedMatch[1]) }; 
    } catch {}
  }
  
  const jsonMatch = s.match(/{[\s\S]*}/);
  if (jsonMatch?.[0]) {
    try { 
      return { ok: true, data: JSON.parse(jsonMatch[0]) }; 
    } catch {}
  }
  
  return { ok: false, reason: "Invalid JSON" };
}
