import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Briefcase } from "lucide-react";
import { PromptEditor } from "../PromptEditor";
import type { MASpecialistData } from "~backend/widgets/ma-specialist";

interface Props {
  status: "loading" | "complete" | "error";
  data?: MASpecialistData;
  error?: string;
}

export function MASpecialistWidget({ status, data, error }: Props) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-primary" />
            <div>
              <CardTitle>M&A Specialist</CardTitle>
              <CardDescription>Merger and acquisition analysis and deal valuation</CardDescription>
            </div>
          </div>
          <PromptEditor promptId="ma-specialist" promptName="M&A Specialist" />
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
              <p className="text-sm">{typeof data.summary === 'string' ? data.summary : String(data.summary || 'No summary available')}</p>
            </div>

            {data.dealEconomics && (
              <div>
                <h4 className="text-sm font-semibold mb-3">Deal Economics</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-xs text-muted-foreground">Current Valuation</p>
                    <p className="text-lg font-bold">${(data.dealEconomics.currentValuation / 1e9).toFixed(2)}B</p>
                  </div>
                  {data.dealEconomics.evToEbitda && (
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-xs text-muted-foreground">EV/EBITDA</p>
                      <p className="text-lg font-bold">{data.dealEconomics.evToEbitda.toFixed(1)}x</p>
                    </div>
                  )}
                  {data.dealEconomics.priceToEarnings && (
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-xs text-muted-foreground">P/E Ratio</p>
                      <p className="text-lg font-bold">{data.dealEconomics.priceToEarnings.toFixed(1)}x</p>
                    </div>
                  )}
                  {data.dealEconomics.premiumRange && (
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-xs text-muted-foreground">Premium Range</p>
                      <p className="text-sm font-medium">
                        {data.dealEconomics.premiumRange.low}% - {data.dealEconomics.premiumRange.high}%
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {data.strategicRationale && (
              <div>
                <h4 className="text-sm font-semibold mb-2">Strategic Rationale</h4>
                <div className="space-y-2">
                  {data.strategicRationale.synergies && data.strategicRationale.synergies.length > 0 && (
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">Synergies</p>
                      <ul className="list-disc list-inside text-sm space-y-1">
                        {data.strategicRationale.synergies.map((synergy, idx) => (
                          <li key={idx}>{typeof synergy === 'string' ? synergy : String(synergy)}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {data.strategicRationale.marketPosition && (
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">Market Position</p>
                      <p className="text-sm">{typeof data.strategicRationale.marketPosition === 'string' ? data.strategicRationale.marketPosition : String(data.strategicRationale.marketPosition || 'N/A')}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {data.recentDeals && data.recentDeals.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-2">Recent M&A Activity</h4>
                <div className="space-y-2">
                  {data.recentDeals.slice(0, 3).map((deal, idx) => (
                    <div key={idx} className="p-3 bg-muted rounded-lg">
                      <p className="text-sm font-medium">{typeof deal.target === 'string' ? deal.target : String(deal.target || 'N/A')} ← {typeof deal.acquirer === 'string' ? deal.acquirer : String(deal.acquirer || 'N/A')}</p>
                      <div className="flex justify-between mt-1">
                        {deal.value && (
                          <span className="text-xs text-muted-foreground">
                            ${(deal.value / 1e9).toFixed(2)}B
                          </span>
                        )}
                          <span className="text-xs text-muted-foreground">{typeof deal.date === 'string' ? deal.date : String(deal.date || 'N/A')}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {data.risks && data.risks.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-2">Key Risks</h4>
                <ul className="list-disc list-inside space-y-1">
                  {data.risks.map((risk, idx) => (
                    <li key={idx} className="text-sm text-muted-foreground">{typeof risk === 'string' ? risk : String(risk)}</li>
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
