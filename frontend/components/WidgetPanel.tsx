import { ScrollArea } from "@/components/ui/scroll-area";
import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WidgetData } from "./AnalysisDashboard";
import { CompanySnapshotWidget } from "./widgets/CompanySnapshotWidget";
import { NewsImpactWidget } from "./widgets/NewsImpactWidget";
import { MacroSectorWidget } from "./widgets/MacroSectorWidget";
import { RiskFlagsWidget } from "./widgets/RiskFlagsWidget";
import { CryptoWidget } from "./widgets/CryptoWidget";
import { FinancialAnalystWidget } from "./widgets/FinancialAnalystWidget";
import { DayTraderWidget } from "./widgets/DayTraderWidget";
import { MASpecialistWidget } from "./widgets/MASpecialistWidget";
import { ComparisonWidget } from "./widgets/ComparisonWidget";
import { PortfolioWidget } from "./widgets/PortfolioWidget";
import { MarketSentimentWidget } from "./widgets/MarketSentimentWidget";
import { AnalystConsensusWidget } from "./widgets/AnalystConsensusWidget";
import { InvestmentThesisWidget } from "./widgets/InvestmentThesisWidget";

interface WidgetPanelProps {
  widgets: WidgetData[];
}

export function WidgetPanel({ widgets }: WidgetPanelProps) {
  return (
    <div className="w-full min-w-0 flex flex-col bg-background border-l border-border">
      <div className="border-b border-border px-4 md:px-6 py-4 bg-card">
        <h2 className="text-lg md:text-xl font-semibold text-foreground">Widget Dashboard</h2>
        <p className="text-sm md:text-base text-muted-foreground hidden sm:block">Real-time financial insights powered by AI agents</p>
      </div>

      <ScrollArea className="flex-1 p-4 md:p-6">
        <div className="w-full grid auto-rows-max gap-4">
          {widgets.length === 0 && (
            <div className="text-center py-12 text-neutral-400 min-h-[400px] grid place-items-center">
              <div>
                <p className="mb-2 text-base">Widgets will appear here when you start a query</p>
                <p className="text-sm">Each widget acts as a specialized financial analyst providing deep insights</p>
              </div>
            </div>
          )}

          {widgets.map((widget) => (
            <div key={widget.id}>
              {widget.id === "comparison" && (
                <ComparisonWidget
                  status={widget.status}
                  data={widget.data}
                  error={widget.error}
                />
              )}
              {widget.id === "company-snapshot" && (
                <CompanySnapshotWidget
                  status={widget.status}
                  data={widget.data}
                  error={widget.error}
                />
              )}
              {widget.id === "news-impact" && (
                <NewsImpactWidget
                  status={widget.status}
                  data={widget.data}
                  error={widget.error}
                />
              )}
              {widget.id === "macro-sector" && (
                <MacroSectorWidget
                  status={widget.status}
                  data={widget.data}
                  error={widget.error}
                />
              )}
              {widget.id === "risk-flags" && (
                <RiskFlagsWidget
                  status={widget.status}
                  data={widget.data}
                  error={widget.error}
                />
              )}
              {widget.id === "crypto" && (
                <CryptoWidget
                  status={widget.status}
                  data={widget.data}
                  error={widget.error}
                />
              )}
              {widget.id === "financial-analyst" && (
                <FinancialAnalystWidget
                  status={widget.status}
                  data={widget.data}
                  error={widget.error}
                />
              )}
              {widget.id === "day-trader" && (
                <DayTraderWidget
                  status={widget.status}
                  data={widget.data}
                  error={widget.error}
                />
              )}
              {widget.id === "ma-specialist" && (
                <MASpecialistWidget
                  status={widget.status}
                  data={widget.data}
                  error={widget.error}
                />
              )}
              {widget.id === "portfolio" && (
                <PortfolioWidget
                  status={widget.status}
                  data={widget.data}
                  error={widget.error}
                />
              )}
              {widget.id === "market-sentiment" && (
                <MarketSentimentWidget
                  status={widget.status}
                  data={widget.data}
                  error={widget.error}
                />
              )}
              {widget.id === "analyst-consensus" && (
                <AnalystConsensusWidget
                  status={widget.status}
                  data={widget.data}
                  error={widget.error}
                />
              )}
              {widget.id === "investment-thesis" && (
                <InvestmentThesisWidget
                  status={widget.status}
                  data={widget.data}
                  error={widget.error}
                />
              )}
              {widget.id === "peer-comparison" && (
                <ComparisonWidget
                  status={widget.status}
                  data={widget.data}
                  error={widget.error}
                />
              )}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
