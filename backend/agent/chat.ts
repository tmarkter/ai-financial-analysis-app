import { api, StreamOut } from "encore.dev/api";
import { analyzeQuery } from "./analyze";
import { createChatCompletion } from "./openai";
import { WIDGET_PROMPTS } from "../config/prompts";

export interface ChatRequest {
  query: string;
  conversationId?: string;
}

export interface ChatMessage {
  type: "text" | "widget_start" | "widget_complete" | "error" | "suggestions";
  content: string;
  widgetId?: string;
  data?: any;
  suggestions?: string[];
}

// Main chat endpoint with streaming response
export const chat = api.streamOut<ChatRequest, ChatMessage>(
  { expose: true, path: "/chat" },
  async (req, stream) => {
    try {
      // Send initial message
      await stream.send({
        type: "text",
        content: "Analyzing your query...",
      });

      // Start widget processing in parallel
      const widgetPromise = analyzeQuery(req.query, stream);

      // Generate chat response using OpenAI with configurable prompt
      const chatPrompt = WIDGET_PROMPTS["chat"]?.systemPrompt;
      const chatResponse = await createChatCompletion(req.query, chatPrompt);
      
      await stream.send({
        type: "text",
        content: chatResponse,
      });

      // Generate follow-up suggestions
      const suggestionsPrompt = `Based on this financial query: "${req.query}", suggest 3 relevant follow-up questions a user might ask. Return only a JSON array of strings.`;
      const suggestionsResponse = await createChatCompletion(suggestionsPrompt);
      
      try {
        const suggestions = JSON.parse(suggestionsResponse);
        if (Array.isArray(suggestions)) {
          await stream.send({
            type: "suggestions",
            content: "Follow-up suggestions",
            suggestions,
          });
        }
      } catch (e) {
        // Ignore if parsing fails
      }

      // Wait for all widgets to complete
      await widgetPromise;

    } catch (error) {
      await stream.send({
        type: "error",
        content: error instanceof Error ? error.message : "An error occurred",
      });
    } finally {
      await stream.close();
    }
  }
);
