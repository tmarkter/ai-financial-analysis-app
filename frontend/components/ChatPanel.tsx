import { useState, useRef, useEffect } from "react";
import { Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import backend from "~backend/client";
import { WidgetData } from "./AnalysisDashboard";
import { ChatHistory } from "./ChatHistory";
import { PromptEditor } from "./PromptEditor";

interface ChatPanelProps {
  messages: Array<{ role: "user" | "assistant"; content: string }>;
  onNewQuery: (query: string) => void;
  onWidgetUpdate: (widgetId: string, status: WidgetData["status"], data?: any, error?: string) => void;
  onChatMessage: (message: string) => void;
  currentSessionId?: string;
  onSelectSession: (sessionId: string) => void;
  onNewSession: () => void;
}

export function ChatPanel({ messages, onNewQuery, onWidgetUpdate, onChatMessage, currentSessionId, onSelectSession, onNewSession }: ChatPanelProps) {
  const [query, setQuery] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isStreaming) return;

    const userQuery = query.trim();
    setQuery("");
    onNewQuery(userQuery);
    setIsStreaming(true);

    try {
      const stream = await backend.agent.chat({ query: userQuery });
      
      let chatBuffer = "";
      
      for await (const msg of stream) {
        try {
          if (msg.type === "text") {
            chatBuffer += msg.content + "\n";
          } else if (msg.type === "widget_start") {
            onWidgetUpdate(msg.widgetId!, "loading");
          } else if (msg.type === "widget_complete") {
            onWidgetUpdate(msg.widgetId!, "complete", msg.data);
          } else if (msg.type === "suggestions" && msg.suggestions) {
            setSuggestions(msg.suggestions);
          } else if (msg.type === "error") {
            if (msg.widgetId) {
              onWidgetUpdate(msg.widgetId, "error", undefined, msg.content);
            }
            console.error("Stream error:", msg.content);
          }
        } catch (msgError) {
          console.error("Error processing message:", msgError);
        }
      }

      if (chatBuffer) {
        onChatMessage(chatBuffer);
      }
    } catch (error) {
      console.error("Chat error:", error);
      onChatMessage("An error occurred while processing your request. Please try again.");
    } finally {
      setIsStreaming(false);
    }
  };

  return (
    <div className="w-full min-w-0 flex flex-col border-r border-border bg-card">
      <div className="border-b border-border px-4 md:px-6 py-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <ChatHistory onSelectSession={onSelectSession} onNewSession={onNewSession} />
            <div className="min-w-0">
              <h2 className="text-lg md:text-xl font-semibold text-foreground">Chat Analysis</h2>
              <p className="text-sm md:text-base text-muted-foreground hidden sm:block">Ask about any company or financial topic</p>
            </div>
          </div>
          <PromptEditor promptId="chat" promptName="Chat Assistant" />
        </div>
      </div>

      <ScrollArea className="flex-1 px-4 md:px-6 py-4" ref={scrollRef}>
        <div className="space-y-4 max-w-4xl">
          {messages.length === 0 && (
            <div className="text-center py-8 md:py-12">
              <p className="text-base text-muted-foreground mb-4">Start by asking about a company</p>
              <div className="flex flex-wrap gap-2 justify-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setQuery("Analyze Apple company")}
                  className="text-white border-white/20 hover:bg-white/10"
                >
                  Apple Analysis
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setQuery("Tesla financial overview")}
                  className="text-white border-white/20 hover:bg-white/10"
                >
                  Tesla Overview
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setQuery("Bitcoin price and news")}
                  className="text-white border-white/20 hover:bg-white/10"
                >
                  Bitcoin Info
                </Button>
              </div>
            </div>
          )}
          
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-4 py-3 ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground"
                }`}
              >
                <p className="text-base whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))}

          {isStreaming && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-lg px-4 py-3">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            </div>
          )}

          {suggestions.length > 0 && !isStreaming && (
            <div className="mt-4 space-y-2">
              <p className="text-sm text-muted-foreground">Suggested follow-up questions:</p>
              <div className="flex flex-col gap-2">
                {suggestions.map((suggestion, idx) => (
                  <Button
                    key={idx}
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setQuery(suggestion);
                      setSuggestions([]);
                    }}
                    className="text-left justify-start h-auto py-2 px-3 text-white border-white/20 hover:bg-white/10"
                  >
                    {suggestion}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <form onSubmit={handleSubmit} className="border-t border-border p-4 md:p-6">
        <div className="flex gap-2 md:gap-3">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask about any company (e.g., 'Apple analysis')..."
            disabled={isStreaming}
            className="flex-1 text-white text-base h-11 md:h-12 px-4"
          />
          <Button type="submit" disabled={!query.trim() || isStreaming} size="lg" className="h-11 md:h-12 px-4 md:px-6">
            {isStreaming ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
