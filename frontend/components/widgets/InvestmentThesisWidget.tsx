import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Lightbulb, TrendingUp, TrendingDown, AlertTriangle, Calendar, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PromptEditor } from "../PromptEditor";
import { EmptyState } from "../EmptyState";
import type { InvestmentThesisData } from "~backend/widgets/investment-thesis";

interface Props {
  status: "loading" | "complete" | "error";
  data?: InvestmentThesisData;
  error?: string;
}

export function InvestmentThesisWidget({ status, data, error }: Props) {
  const getRatingColor = (rating: string) => {
    if (rating.includes("Buy")) return "bg-green-500/10 text-green-500 border-green-500/20";
    if (rating.includes("Sell")) return "bg-red-500/10 text-red-500 border-red-500/20";
    return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
  };

  const getValuationColor = (verdict: string) => {
    if (verdict === "Undervalued") return "text-green-500";
    if (verdict === "Overvalued") return "text-red-500";
    return "text-yellow-500";
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-primary" />
            <div>
              <CardTitle>AI Investment Thesis</CardTitle>
              <CardDescription>Comprehensive bull/bear case, catalysts, and valuation assessment</CardDescription>
            </div>
          </div>
          <PromptEditor promptId="investment-thesis" promptName="Investment Thesis" />
        </div>
      </CardHeader>
      <CardContent>
        {status === "loading" && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {status === "error" && (
          <EmptyState 
            title="Thesis Generation Failed" 
            subtitle={error || "Unable to generate investment thesis"} 
            icon="alert" 
          />
        )}

        {status === "complete" && data && (
          <div className="space-y-6">
            <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
              <p className="text-lg font-semibold">{data.oneLiner}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className={`p-4 rounded-lg border ${getRatingColor(data.investmentRating)}`}>
                <p className="text-xs font-semibold uppercase mb-1">Rating</p>
                <p className="text-xl font-bold">{data.investmentRating}</p>
              </div>

              <div className="p-4 bg-muted rounded-lg">
                <p className="text-xs text-muted-foreground">Valuation</p>
                <p className={`text-xl font-bold ${getValuationColor(data.valuation?.verdict || 'Fairly Valued')}`}>
                  {typeof data.valuation === 'string' ? data.valuation : (data.valuation?.verdict || 'N/A')}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Fair: {typeof data.valuation === 'object' ? (data.valuation?.fair || 'N/A') : 'N/A'}
                </p>
              </div>

              <div className="p-4 bg-muted rounded-lg">
                <p className="text-xs text-muted-foreground">Confidence</p>
                <p className="text-xl font-bold">{data.confidence}%</p>
                <div className="w-full bg-border rounded-full h-2 mt-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all"
                    style={{ width: `${data.confidence}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-green-500/5 border border-green-500/20 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                  <h4 className="text-sm font-semibold">{data.bullCase.title}</h4>
                </div>
                <ul className="space-y-2">
                    {data.bullCase.points.map((point, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <span className="text-green-500 mt-1">•</span>
                        <span>{typeof point === 'string' ? point : String(point)}</span>
                      </li>
                    ))}
                </ul>
              </div>

              <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingDown className="h-5 w-5 text-red-500" />
                  <h4 className="text-sm font-semibold">{data.bearCase.title}</h4>
                </div>
                <ul className="space-y-2">
                    {data.bearCase.points.map((point, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <span className="text-red-500 mt-1">•</span>
                        <span>{typeof point === 'string' ? point : String(point)}</span>
                      </li>
                    ))}
                </ul>
              </div>
            </div>

            {data.keyCatalysts.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="h-4 w-4 text-primary" />
                  <h4 className="text-sm font-semibold">Key Catalysts</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {data.keyCatalysts.map((catalyst, idx) => {
                    // Ensure catalyst is an object with expected properties
                    const catalystEvent = typeof catalyst === 'object' && catalyst !== null 
                      ? (catalyst.event || String(catalyst))
                      : String(catalyst);
                    const catalystTiming = typeof catalyst === 'object' && catalyst !== null
                      ? (catalyst.timing || 'TBD')
                      : 'TBD';
                    const catalystImpact = typeof catalyst === 'object' && catalyst !== null
                      ? (catalyst.impact || 'neutral')
                      : 'neutral';
                    
                    return (
                      <div key={idx} className="p-3 bg-muted rounded-lg">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="text-sm font-medium">{catalystEvent}</p>
                            <p className="text-xs text-muted-foreground mt-1">{catalystTiming}</p>
                          </div>
                          <Badge variant={catalystImpact === "positive" ? "default" : "outline"} className="ml-2">
                            {catalystImpact}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.growthDrivers.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    <h4 className="text-sm font-semibold">Growth Drivers</h4>
                  </div>
                  <ul className="space-y-2">
                    {data.growthDrivers.map((driver, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm p-2 bg-muted rounded">
                        <span className="text-primary mt-1">▸</span>
                        <span>{typeof driver === 'string' ? driver : String(driver)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {data.keyRisks.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    <h4 className="text-sm font-semibold">Key Risks</h4>
                  </div>
                  <ul className="space-y-2">
                    {data.keyRisks.map((risk, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm p-2 bg-muted rounded">
                        <span className="text-yellow-500 mt-1">▸</span>
                        <span>{typeof risk === 'string' ? risk : String(risk)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {data.sources && (
              <div className="pt-4 border-t border-border">
                <p className="text-xs text-muted-foreground">
                  Sources: {data.sources.map((s) => s.name).join(", ")}
                </p>
                <p className="text-xs text-muted-foreground">Generated: {data.lastUpdated ? new Date(data.lastUpdated).toLocaleString() : 'N/A'}</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
