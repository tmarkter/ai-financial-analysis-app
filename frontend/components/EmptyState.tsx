import { AlertCircle, Database } from "lucide-react";

interface EmptyStateProps {
  title?: string;
  subtitle?: string;
  icon?: "alert" | "database";
}

export function EmptyState({ 
  title = "No data available", 
  subtitle = "We couldn't retrieve the requested information.", 
  icon = "database" 
}: EmptyStateProps) {
  const Icon = icon === "alert" ? AlertCircle : Database;
  
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="p-3 rounded-full bg-muted mb-4">
        <Icon className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-sm font-semibold text-foreground mb-1">{title}</h3>
      <p className="text-xs text-muted-foreground max-w-sm">{subtitle}</p>
    </div>
  );
}
