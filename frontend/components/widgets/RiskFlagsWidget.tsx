import WidgetShell from "@/components/common/WidgetShell";
import { Shield, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PromptEditor } from "../PromptEditor";
import type { RiskFlagsData } from "~backend/widgets/risk-flags";

interface Props {
  status: "loading" | "complete" | "error";
  data?: RiskFlagsData;
  error?: string;
}

export function RiskFlagsWidget({ status, data, error }: Props) {
  const hasMatches = data?.matches && data.matches.length > 0;
  const isEmpty = !hasMatches && status === "complete";

  return (
    <WidgetShell 
      title="Risk Flags" 
      isLoading={status === "loading"}
      error={error}
      isEmpty={false}
      minHeight={220}
      footer={data?.sources ? (
        <div>
          <p>Sources: {data.sources.map((s) => s.name).join(", ")}</p>
          <p>Updated: {data.lastUpdated ? new Date(data.lastUpdated).toLocaleString() : '—'}</p>
        </div>
      ) : undefined}
    >
      <div className="space-y-4">
        {!hasMatches ? (
          <div className="flex items-center gap-2 p-4 bg-green-500/10 rounded-lg text-green-500 border border-green-500/20">
            <Shield className="h-5 w-5 shrink-0" />
            <p className="text-sm font-medium">No risk flags found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {data.matches.map((match, idx) => (
              <div key={idx} className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg space-y-2">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-neutral-100 line-clamp-2">{match.name}</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {match.datasets.map((dataset, didx) => (
                        <Badge key={didx} variant="outline" className="text-xs line-clamp-1">
                          {dataset}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div className="absolute top-4 right-4">
        <PromptEditor promptId="risk-flags" promptName="Risk Flags" />
      </div>
    </WidgetShell>
  );
}
