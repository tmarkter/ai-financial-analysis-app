import { useState, useEffect } from "react";
import { History, X, Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/components/ui/use-toast";
import backend from "~backend/client";
import type { ChatSession } from "~backend/chat-history/history";

interface ChatHistoryProps {
  onSelectSession: (sessionId: string) => void;
  onNewSession: () => void;
}

export function ChatHistory({ onSelectSession, onNewSession }: ChatHistoryProps) {
  const [open, setOpen] = useState(false);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      loadSessions();
    }
  }, [open]);

  const loadSessions = async () => {
    setLoading(true);
    try {
      const data = await backend.chat_history.listSessions();
      setSessions(data.sessions || []);
    } catch (error) {
      console.error("Error loading sessions:", error);
      setSessions([]);
    } finally {
      setLoading(false);
    }
  };

  const deleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await backend.chat_history.deleteSession({ sessionId });
      setSessions(sessions.filter((s) => s.id !== sessionId));
      toast({
        title: "Success",
        description: "Chat session deleted",
      });
    } catch (error) {
      console.error("Error deleting session:", error);
      toast({
        title: "Error",
        description: "Failed to delete session",
        variant: "destructive",
      });
    }
  };

  const handleSelectSession = (sessionId: string) => {
    onSelectSession(sessionId);
    setOpen(false);
  };

  const handleNewSession = () => {
    onNewSession();
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-white hover:text-white">
          <History className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-80">
        <SheetHeader>
          <SheetTitle>Chat History</SheetTitle>
          <SheetDescription>Your previous conversations</SheetDescription>
        </SheetHeader>
        <div className="mt-4 space-y-2">
          <Button onClick={handleNewSession} className="w-full" variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            New Chat
          </Button>
          <ScrollArea className="h-[calc(100vh-200px)]">
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : sessions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No chat history</div>
            ) : (
              <div className="space-y-2">
                {sessions.map((session) => (
                  <div
                    key={session.id}
                    className="p-3 rounded-lg border border-border hover:bg-muted cursor-pointer group"
                    onClick={() => handleSelectSession(session.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{session.title}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {session.updatedAt ? new Date(session.updatedAt).toLocaleDateString() : 'N/A'}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 opacity-0 group-hover:opacity-100"
                        onClick={(e) => deleteSession(session.id, e)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </SheetContent>
    </Sheet>
  );
}
