import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Activity } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { PromptEditor } from "../PromptEditor";
import { fmtNumber } from "@/utils/format";
import type { DayTraderData } from "~backend/widgets/day-trader";

interface Props {
  status: "loading" | "complete" | "error";
  data?: DayTraderData;
  error?: string;
}

export function DayTraderWidget({ status, data, error }: Props) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            <div>
              <CardTitle>Day Trading Analysis</CardTitle>
              <CardDescription>Intraday price action, volume, and short-term setups</CardDescription>
            </div>
          </div>
          <PromptEditor promptId="day-trader" promptName="Day Trader" />
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
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm">{data.summary}</p>
            </div>

            {data.priceAction && (
              <div>
                <h4 className="text-sm font-semibold mb-3">Price Action</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-xs text-muted-foreground">Current</p>
                    <p className="text-lg font-bold">${fmtNumber(data.priceAction.current)}</p>
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-xs text-muted-foreground">Day Range</p>
                    <p className="text-sm font-medium">
                      ${fmtNumber(data.priceAction.dayLow)} - ${fmtNumber(data.priceAction.dayHigh)}
                    </p>
                  </div>
                  {data.priceAction.support && data.priceAction.support.length > 0 && (
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-xs text-muted-foreground">Support</p>
                      <p className="text-sm font-medium">${fmtNumber(data.priceAction.support[0])}</p>
                    </div>
                  )}
                  {data.priceAction.resistance && data.priceAction.resistance.length > 0 && (
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-xs text-muted-foreground">Resistance</p>
                      <p className="text-sm font-medium">${fmtNumber(data.priceAction.resistance[0])}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {data.intradayChart && data.intradayChart.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-2">Intraday Chart</h4>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data.intradayChart}>
                      <XAxis dataKey="time" hide />
                      <YAxis domain={["auto", "auto"]} hide />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "6px",
                        }}
                      />
                      <Line type="monotone" dataKey="price" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {data.tradingSetups && data.tradingSetups.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-2">Trading Setups</h4>
                <div className="space-y-2">
                  {data.tradingSetups.slice(0, 3).map((setup, idx) => (
                    <div key={idx} className="p-3 bg-muted rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-sm font-medium">{setup.type}</span>
                        <span className="text-xs text-muted-foreground">R:R {fmtNumber(setup.riskReward, 1)}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div>
                          <span className="text-muted-foreground">Entry:</span> ${fmtNumber(setup.entry)}
                        </div>
                        <div>
                          <span className="text-muted-foreground">Target:</span> ${fmtNumber(setup.target)}
                        </div>
                        <div>
                          <span className="text-muted-foreground">Stop:</span> ${fmtNumber(setup.stop)}
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
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
