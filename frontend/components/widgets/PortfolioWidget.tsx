import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Briefcase, TrendingUp, AlertTriangle } from "lucide-react";
import { PromptEditor } from "../PromptEditor";
import { fmtCurrencyUSD, fmtNumber } from "@/utils/format";
import type { PortfolioData } from "~backend/widgets/portfolio";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface Props {
  status: "loading" | "complete" | "error";
  data?: PortfolioData;
  error?: string;
}

export function PortfolioWidget({ status, data, error }: Props) {
  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "low":
        return "text-green-500 bg-green-500/10 border-green-500/20";
      case "high":
        return "text-red-500 bg-red-500/10 border-red-500/20";
      default:
        return "text-yellow-500 bg-yellow-500/10 border-yellow-500/20";
    }
  };

  const getPieData = () => {
    if (!data?.positions) return [];
    return data.positions.map(p => ({
      name: p.ticker,
      value: p.allocation,
    }));
  };

  const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-primary" />
            <div>
              <CardTitle>Portfolio Manager</CardTitle>
              <CardDescription>Portfolio allocation, risk analysis, and rebalancing recommendations</CardDescription>
            </div>
          </div>
          <PromptEditor promptId="portfolio" promptName="Portfolio Manager" />
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
              <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold">Portfolio Analysis Failed</p>
                <p className="text-xs mt-1 opacity-90">{error}</p>
              </div>
            </div>
            {error?.includes(':') && (
              <div className="text-xs text-muted-foreground bg-muted p-3 rounded">
                <p className="font-semibold mb-1">Possible causes:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Invalid ticker symbols (check spelling)</li>
                  <li>API rate limits exceeded (retry in 60s)</li>
                  <li>Market data temporarily unavailable</li>
                </ul>
              </div>
            )}
          </div>
        )}

        {status === "complete" && data && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-xs text-muted-foreground">Total Value</p>
                <p className="text-2xl font-bold">{fmtCurrencyUSD(data.totalValue)}</p>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-xs text-muted-foreground">Diversification Score</p>
                <p className="text-2xl font-bold">{data.diversificationScore}/100</p>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-xs text-muted-foreground">Positions</p>
                <p className="text-2xl font-bold">{data.positions.length}</p>
              </div>
            </div>

            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm">{data.summary}</p>
            </div>

            {data.positions.length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-semibold mb-3">Allocation</h4>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={getPieData()}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {getPieData().map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div>
                  <h4 className="text-sm font-semibold mb-3">Positions</h4>
                  <div className="space-y-2">
                    {data.positions.map((position, idx) => (
                      <div key={idx} className="p-3 bg-muted rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <p className="font-semibold">{position.ticker}</p>
                            <p className="text-xs text-muted-foreground">{position.companyName}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold">{fmtCurrencyUSD(position.currentPrice)}</p>
                            <p className="text-xs text-muted-foreground">{fmtNumber(position.allocation)}%</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className={`text-xs px-2 py-1 rounded border ${getRiskColor(position.risk)}`}>
                            {position.risk.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">{position.recommendation}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div>
              <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
                Risk Analysis
              </h4>
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm">{data.riskAnalysis}</p>
              </div>
            </div>

            {data.rebalancingAdvice.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  Rebalancing Advice
                </h4>
                <ul className="space-y-2">
                  {data.rebalancingAdvice.map((advice, idx) => (
                    <li key={idx} className="flex items-start gap-2 p-3 bg-muted rounded-lg">
                      <span className="text-primary mt-1">•</span>
                      <span className="text-sm">{advice}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {data.sources && (
              <div className="pt-4 border-t border-border">
                <p className="text-xs text-muted-foreground">
                  Sources: {data.sources.map((s) => s.name).join(", ")}
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
