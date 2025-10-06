import { TrendingUp, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  onNewChat?: () => void;
}

export function Header({ onNewChat }: HeaderProps) {
  return (
    <header className="border-b border-border bg-card sticky top-0 z-50">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <TrendingUp className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">AI Financial Analysis</h1>
            <p className="text-sm text-muted-foreground">Multi-agent financial insights platform</p>
          </div>
        </div>
        <Button onClick={onNewChat} variant="outline" size="sm" className="gap-2 text-white border-white/20 hover:bg-white/10">
          <PlusCircle className="h-4 w-4" />
          New Chat
        </Button>
      </div>
    </header>
  );
}
