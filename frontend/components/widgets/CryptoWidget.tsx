import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Bitcoin, TrendingUp, TrendingDown } from "lucide-react";
import { PromptEditor } from "../PromptEditor";
import type { CryptoData } from "~backend/widgets/crypto";

interface Props {
  status: "loading" | "complete" | "error";
  data?: CryptoData;
  error?: string;
}

export function CryptoWidget({ status, data, error }: Props) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bitcoin className="h-5 w-5 text-primary" />
            <div>
              <CardTitle>Cryptocurrency</CardTitle>
              <CardDescription>Cryptocurrency price tracking, market cap analysis, and trend identification</CardDescription>
            </div>
          </div>
          <PromptEditor promptId="crypto" promptName="Crypto Analysis" />
        </div>
      </CardHeader>
      <CardContent>
        {status === "loading" && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {status === "error" && (
          <div className="text-sm text-destructive py-4">{error}</div>
        )}

        {status === "complete" && data && (
          <div className="space-y-4">
            {data.prices.map((crypto, idx) => (
              <div key={idx} className="p-4 bg-muted rounded-lg">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold">{crypto.name}</h4>
                  <div className="text-right">
                    <p className="text-lg font-bold">${crypto.price.toLocaleString()}</p>
                    <div className="flex items-center gap-1 justify-end">
                      {crypto.change24h >= 0 ? (
                        <TrendingUp className="h-3 w-3 text-green-500" />
                      ) : (
                        <TrendingDown className="h-3 w-3 text-red-500" />
                      )}
                      <span
                        className={`text-xs ${
                          crypto.change24h >= 0 ? "text-green-500" : "text-red-500"
                        }`}
                      >
                        {crypto.change24h.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {data.sources && (
              <div className="pt-4 border-t border-border">
                <p className="text-xs text-muted-foreground">
                  Sources: {data.sources.map((s) => s.name).join(", ")}
                </p>
                <p className="text-xs text-muted-foreground">Updated: {data.lastUpdated ? new Date(data.lastUpdated).toLocaleString() : 'N/A'}</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
