import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Target, TrendingUp, AlertCircle } from "lucide-react";
import { PromptEditor } from "../PromptEditor";
import { fmtCurrencyUSD, fmtNumber, fmtPercent } from "@/utils/format";
import { EmptyState } from "../EmptyState";
import type { AnalystConsensusData } from "~backend/widgets/analyst-consensus";

interface Props {
  status: "loading" | "complete" | "error";
  data?: AnalystConsensusData;
  error?: string;
}

export function AnalystConsensusWidget({ status, data, error }: Props) {
  const getRecommendationColor = (rec: string) => {
    if (rec.includes("Buy")) return "text-green-500 bg-green-500/10 border-green-500/20";
    if (rec.includes("Sell")) return "text-red-500 bg-red-500/10 border-red-500/20";
    return "text-yellow-500 bg-yellow-500/10 border-yellow-500/20";
  };

  const getUpsidePotential = () => {
    if (!data) return 0;
    return ((data.targetPrice.average - data.currentPrice) / data.currentPrice) * 100;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            <div>
              <CardTitle>Analyst Consensus</CardTitle>
              <CardDescription>Wall Street estimates, price targets, and earnings surprises</CardDescription>
            </div>
          </div>
          <PromptEditor promptId="analyst-consensus" promptName="Analyst Consensus" />
        </div>
      </CardHeader>
      <CardContent>
        {status === "loading" && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {status === "error" && (
          <div className="space-y-3 py-4">
            <div className="flex items-start gap-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold">Analysis Failed</p>
                <p className="text-xs mt-1 opacity-90">{error}</p>
              </div>
            </div>
          </div>
        )}

        {status === "complete" && data && (
          <div className="space-y-6">
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm">{data.summary}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className={`p-4 rounded-lg border ${getRecommendationColor(data.recommendation)}`}>
                <p className="text-xs font-semibold uppercase mb-1">Recommendation</p>
                <p className="text-2xl font-bold">{data.recommendation}</p>
                <p className="text-xs mt-1">{data.analystCount} analysts</p>
              </div>

              <div className="p-4 bg-muted rounded-lg">
                <p className="text-xs text-muted-foreground">Price Target</p>
                <p className="text-2xl font-bold">{fmtCurrencyUSD(data.targetPrice.average)}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Range: {fmtCurrencyUSD(data.targetPrice.low)} - {fmtCurrencyUSD(data.targetPrice.high)}
                </p>
              </div>

              <div className="p-4 bg-muted rounded-lg">
                <p className="text-xs text-muted-foreground">Upside Potential</p>
                <p className={`text-2xl font-bold ${getUpsidePotential() >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {fmtPercent(getUpsidePotential())}
                </p>
                <p className="text-xs text-muted-foreground mt-1">vs Current: {fmtCurrencyUSD(data.currentPrice)}</p>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold mb-3">EPS Estimates</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground mb-2">Next Quarter</p>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Consensus:</span>
                      <span className="font-medium">{fmtNumber(data.epsEstimates.nextQuarter.estimatedEpsAvg)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Range:</span>
                      <span className="text-xs">
                        {fmtNumber(data.epsEstimates.nextQuarter.estimatedEpsLow)} - {fmtNumber(data.epsEstimates.nextQuarter.estimatedEpsHigh)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground mb-2">Next Year</p>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Consensus:</span>
                      <span className="font-medium">{fmtNumber(data.epsEstimates.nextYear.estimatedEpsAvg)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Range:</span>
                      <span className="text-xs">
                        {fmtNumber(data.epsEstimates.nextYear.estimatedEpsLow)} - {fmtNumber(data.epsEstimates.nextYear.estimatedEpsHigh)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {data.surpriseHistory.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Earnings Surprise History
                </h4>
                <div className="space-y-2">
                  {data.surpriseHistory.map((surprise, idx) => (
                    <div key={idx} className="p-3 bg-muted rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-muted-foreground">{surprise.period}</p>
                          <p className="text-sm mt-1">
                            Est: {fmtNumber(surprise.estimated)} | Act: {fmtNumber(surprise.actual)}
                          </p>
                        </div>
                        <div className={`text-right ${surprise.surprise >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          <p className="text-lg font-bold">{fmtPercent(surprise.surprisePercent)}</p>
                          <p className="text-xs">{surprise.surprise >= 0 ? 'Beat' : 'Miss'}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

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
