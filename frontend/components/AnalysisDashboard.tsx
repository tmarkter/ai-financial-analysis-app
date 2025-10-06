import { useState } from "react";
import { ChatPanel } from "./ChatPanel";
import { WidgetPanel } from "./WidgetPanel";
import { Header } from "./Header";
import backend from "@/utils/backendClient";

export interface WidgetData {
  id: string;
  status: "loading" | "complete" | "error";
  data?: any;
  error?: string;
}

export function AnalysisDashboard() {
  const [widgets, setWidgets] = useState<WidgetData[]>([]);
  const [chatMessages, setChatMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | undefined>();

  const handleNewQuery = async (query: string) => {
    setWidgets([]);
    setChatMessages((prev) => [...prev, { role: "user", content: query }]);

    if (!currentSessionId) {
      try {
        const session = await backend.chat_history.createSession({ title: query.slice(0, 50) });
        setCurrentSessionId(session.id);
        await backend.chat_history.addMessage({ sessionId: session.id, role: "user", content: query });
      } catch (error) {
        console.error("Error creating session:", error);
      }
    } else {
      try {
        await backend.chat_history.addMessage({ sessionId: currentSessionId, role: "user", content: query });
      } catch (error) {
        console.error("Error adding message:", error);
      }
    }
  };

  const handleWidgetUpdate = (widgetId: string, status: WidgetData["status"], data?: any, error?: string) => {
    setWidgets((prev) => {
      const existing = prev.find((w) => w.id === widgetId);
      if (existing) {
        return prev.map((w) =>
          w.id === widgetId ? { ...w, status, data, error } : w
        );
      }
      return [...prev, { id: widgetId, status, data, error }];
    });
  };

  const handleChatMessage = async (message: string) => {
    setChatMessages((prev) => [...prev, { role: "assistant", content: message }]);
    
    if (currentSessionId) {
      try {
        await backend.chat_history.addMessage({ sessionId: currentSessionId, role: "assistant", content: message });
      } catch (error) {
        console.error("Error adding message:", error);
      }
    }
  };

  const handleSelectSession = async (sessionId: string) => {
    try {
      const data = await backend.chat_history.getMessages({ sessionId });
      setChatMessages(data.messages.map((m: any) => ({ role: m.role, content: m.content })));
      setCurrentSessionId(sessionId);
      setWidgets([]);
    } catch (error) {
      console.error("Error loading session:", error);
    }
  };

  const handleNewSession = () => {
    setChatMessages([]);
    setWidgets([]);
    setCurrentSessionId(undefined);
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Header onNewChat={handleNewSession} />
      <div className="flex flex-1 overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 w-full h-full">
          <ChatPanel
            messages={chatMessages}
            onNewQuery={handleNewQuery}
            onWidgetUpdate={handleWidgetUpdate}
            onChatMessage={handleChatMessage}
            currentSessionId={currentSessionId}
            onSelectSession={handleSelectSession}
            onNewSession={handleNewSession}
          />
          <WidgetPanel widgets={widgets} />
        </div>
      </div>
    </div>
  );
}
