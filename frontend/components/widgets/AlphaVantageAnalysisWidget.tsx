import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, TrendingUp, AlertTriangle, Activity, BarChart3, Target } from "lucide-react";
import { PromptEditor } from "../PromptEditor";
import type { AlphaVantageAnalysisData } from "~backend/widgets/alpha-vantage-analysis";

interface Props {
  status: "loading" | "complete" | "error";
  data?: AlphaVantageAnalysisData;
  error?: string;
}

export function AlphaVantageAnalysisWidget({ status, data, error }: Props) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            <div>
              <CardTitle>Alpha Vantage Analysis</CardTitle>
              <CardDescription>Comprehensive macro & micro analysis powered by Alpha Vantage</CardDescription>
            </div>
          </div>
          <PromptEditor promptId="alpha-vantage-analysis" promptName="Alpha Vantage Analysis" />
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
                <p className="font-semibold">Analysis Failed</p>
                <p className="text-xs mt-1 opacity-90">{error}</p>
              </div>
            </div>
          </div>
        )}

        {status === "complete" && data && (
          <div className="space-y-6">
            {/* Executive Summary */}
            <div className="p-4 bg-muted rounded-lg">
              <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Executive Summary
              </h4>
              <p className="text-sm">{typeof data.executiveSummary === 'string' ? data.executiveSummary : String(data.executiveSummary || 'No summary available')}</p>
            </div>

            {/* Micro Analysis */}
            <div>
              <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-blue-500" />
                Micro Analysis (Internal Factors)
              </h4>
              <div className="space-y-4">
                {data.microAnalysis.profitability.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-2">Profitability</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {data.microAnalysis.profitability.map((metric, idx) => (
                        <div key={idx} className="p-3 bg-muted rounded-lg">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-muted-foreground">{typeof metric?.name === 'string' ? metric.name : String(metric?.name || 'Metric')}</span>
                            <span className="text-sm font-semibold">{typeof metric?.value === 'string' ? metric.value : String(metric?.value || 'N/A')}</span>
                          </div>
                          <p className="text-xs text-muted-foreground">{typeof metric?.interpretation === 'string' ? metric.interpretation : String(metric?.interpretation || '')}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {data.microAnalysis.valuation.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-2">Valuation</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {data.microAnalysis.valuation.map((metric, idx) => (
                        <div key={idx} className="p-3 bg-muted rounded-lg">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-muted-foreground">{typeof metric?.name === 'string' ? metric.name : String(metric?.name || 'Metric')}</span>
                            <span className="text-sm font-semibold">{typeof metric?.value === 'string' ? metric.value : String(metric?.value || 'N/A')}</span>
                          </div>
                          <p className="text-xs text-muted-foreground">{typeof metric?.interpretation === 'string' ? metric.interpretation : String(metric?.interpretation || '')}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {data.microAnalysis.growth.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-2">Growth</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {data.microAnalysis.growth.map((metric, idx) => (
                        <div key={idx} className="p-3 bg-muted rounded-lg">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-muted-foreground">{typeof metric?.name === 'string' ? metric.name : String(metric?.name || 'Metric')}</span>
                            <span className="text-sm font-semibold">{typeof metric?.value === 'string' ? metric.value : String(metric?.value || 'N/A')}</span>
                          </div>
                          <p className="text-xs text-muted-foreground">{typeof metric?.interpretation === 'string' ? metric.interpretation : String(metric?.interpretation || '')}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {data.microAnalysis.financialHealth.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-2">Financial Health</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {data.microAnalysis.financialHealth.map((metric, idx) => (
                        <div key={idx} className="p-3 bg-muted rounded-lg">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-muted-foreground">{typeof metric?.name === 'string' ? metric.name : String(metric?.name || 'Metric')}</span>
                            <span className="text-sm font-semibold">{typeof metric?.value === 'string' ? metric.value : String(metric?.value || 'N/A')}</span>
                          </div>
                          <p className="text-xs text-muted-foreground">{typeof metric?.interpretation === 'string' ? metric.interpretation : String(metric?.interpretation || '')}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Macro Analysis */}
            <div>
              <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Activity className="h-4 w-4 text-purple-500" />
                Macro Analysis (External Factors)
              </h4>
              <div className="space-y-3">
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-xs font-semibold text-muted-foreground mb-1">Sector Performance</p>
                  <p className="text-sm">{typeof data.macroAnalysis.sector === 'string' ? data.macroAnalysis.sector : String(data.macroAnalysis.sector || 'N/A')}</p>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-xs font-semibold text-muted-foreground mb-1">Market Sentiment</p>
                  <p className="text-sm">{typeof data.macroAnalysis.marketSentiment === 'string' ? data.macroAnalysis.marketSentiment : String(data.macroAnalysis.marketSentiment || 'N/A')}</p>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-xs font-semibold text-muted-foreground mb-1">Technical Indicators</p>
                  <p className="text-sm">{typeof data.macroAnalysis.technicalIndicators === 'string' ? data.macroAnalysis.technicalIndicators : String(data.macroAnalysis.technicalIndicators || 'N/A')}</p>
                </div>
              </div>
            </div>

            {/* Forward Outlook */}
            <div>
              <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Target className="h-4 w-4 text-green-500" />
                Forward-Looking Outlook
              </h4>
              <div className="space-y-3">
                {data.forwardOutlook.opportunities.length > 0 && (
                  <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                    <p className="text-xs font-semibold text-green-500 mb-2">Opportunities</p>
                    <ul className="space-y-1">
                      {data.forwardOutlook.opportunities.map((opp, idx) => (
                        <li key={idx} className="text-sm flex items-start gap-2">
                          <span className="text-green-500 mt-1">•</span>
                          <span>{typeof opp === 'string' ? opp : String(opp)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {data.forwardOutlook.risks.length > 0 && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <p className="text-xs font-semibold text-red-500 mb-2">Risks</p>
                    <ul className="space-y-1">
                      {data.forwardOutlook.risks.map((risk, idx) => (
                        <li key={idx} className="text-sm flex items-start gap-2">
                          <span className="text-red-500 mt-1">•</span>
                          <span>{typeof risk === 'string' ? risk : String(risk)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg">
                  <p className="text-xs font-semibold text-primary mb-1">Recommendation</p>
                  <p className="text-sm font-medium">{typeof data.forwardOutlook.recommendation === 'string' ? data.forwardOutlook.recommendation : String(data.forwardOutlook.recommendation || 'N/A')}</p>
                </div>
              </div>
            </div>

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
