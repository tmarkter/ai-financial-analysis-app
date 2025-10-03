import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Globe2, Loader2 } from "lucide-react";
import { PromptEditor } from "../PromptEditor";
import { fmtNumber } from "@/utils/format";

export interface GlobalIndexRow {
  name: string;
  ticker: string;
  last: number;
  changePct: number;
  local: string;
}

interface Props {
  status: "loading" | "complete" | "error";
  data?: { rows: GlobalIndexRow[]; sources?: { name: string }[]; lastUpdated?: string };
  error?: string;
}

export function GlobalIndicesWidget({ status, data, error }: Props) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe2 className="h-5 w-5 text-primary" />
            <div>
              <CardTitle>Global Indices (GCC & Intl)</CardTitle>
              <CardDescription>ADX, DFM, FTSE, DAX, S&P & more</CardDescription>
            </div>
          </div>
          <PromptEditor promptId="global-indices" promptName="Global Indices" />
        </div>
      </CardHeader>
      <CardContent>
        {status === "loading" && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {status === "error" && <div className="text-sm text-destructive py-4">{error}</div>}

        {status === "complete" && data && (
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-2 font-semibold">Index</th>
                    <th className="text-left py-2 px-2 font-semibold">Ticker</th>
                    <th className="text-right py-2 px-2 font-semibold">Last</th>
                    <th className="text-right py-2 px-2 font-semibold">Change</th>
                    <th className="text-left py-2 px-2 font-semibold">Region</th>
                  </tr>
                </thead>
                <tbody>
                  {data.rows.map((r, i) => (
                    <tr key={i} className="border-b border-border/60">
                      <td className="py-2 px-2">{r.name}</td>
                      <td className="py-2 px-2 text-muted-foreground">{r.ticker}</td>
                      <td className="py-2 px-2 text-right font-medium">{fmtNumber(r.last, 2)}</td>
                      <td
                        className={`py-2 px-2 text-right font-medium ${
                          r.changePct > 0 ? "text-green-500" : r.changePct < 0 ? "text-red-500" : "text-yellow-500"
                        }`}
                      >
                        {fmtNumber(r.changePct, 2)}%
                      </td>
                      <td className="py-2 px-2">{r.local}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {data.sources && (
              <div className="pt-2 border-t border-border text-xs text-muted-foreground">
                Sources: {data.sources.map((s) => s.name).join(", ")} · Updated:{" "}
                {data.lastUpdated ? new Date(data.lastUpdated).toLocaleString() : "—"}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}