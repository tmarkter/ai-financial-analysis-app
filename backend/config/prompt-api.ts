import { api } from "encore.dev/api";
import { WIDGET_PROMPTS, WidgetPrompt, updatePrompt } from "./prompts";

export interface PromptListResponse {
  prompts: WidgetPrompt[];
}

export const getPrompts = api(
  { expose: true, method: "GET", path: "/prompts" },
  async (): Promise<PromptListResponse> => {
    return { prompts: Object.values(WIDGET_PROMPTS) };
  }
);

export const getPrompt = api(
  { expose: true, method: "GET", path: "/prompts/:id" },
  async (req: { id: string }): Promise<WidgetPrompt> => {
    const prompt = WIDGET_PROMPTS[req.id];
    if (!prompt) {
      throw new Error(`Prompt not found: ${req.id}`);
    }
    return prompt;
  }
);

export const updatePromptEndpoint = api(
  { expose: true, method: "PUT", path: "/prompts/:id" },
  async (req: { id: string; systemPrompt: string }): Promise<WidgetPrompt> => {
    if (!WIDGET_PROMPTS[req.id]) {
      throw new Error(`Prompt not found: ${req.id}`);
    }
    
    await updatePrompt(req.id, req.systemPrompt);
    return WIDGET_PROMPTS[req.id];
  }
);
