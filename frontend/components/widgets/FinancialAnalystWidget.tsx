import WidgetShell from "@/components/common/WidgetShell";
import { PromptEditor } from "../PromptEditor";
import { fmtCurrencyUSD, fmtPercent, fmtNumber } from "@/utils/format";
import { normalizeEarningsQuality } from "@/utils/normalize";
import type { FinancialAnalystData } from "~backend/widgets/financial-analyst";

interface Props {
  status: "loading" | "complete" | "error";
  data?: FinancialAnalystData;
  error?: string;
}

export function FinancialAnalystWidget({ status, data, error }: Props) {
  const isEmpty = !data?.summary && !data?.financialMetrics;

  return (
    <WidgetShell 
      title="Financial Analyst" 
      isLoading={status === "loading"}
      error={error}
      isEmpty={isEmpty}
      minHeight={320}
      footer={data?.sources ? (
        <p>Sources: {data.sources.map((s) => s.name).join(", ")}</p>
      ) : undefined}
    >
      <div className="space-y-4">
        {data?.summary && (
          <div className="p-4 bg-neutral-950 rounded-lg border border-neutral-800">
            <p className="text-sm text-neutral-100 line-clamp-4">{typeof data.summary === 'string' ? data.summary : String(data.summary || 'No summary available')}</p>
          </div>
        )}

        {data?.financialMetrics && (
          <div>
            <h4 className="text-sm font-semibold mb-3 text-neutral-100">Financial Metrics</h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-neutral-950 rounded-lg border border-neutral-800">
                <p className="text-xs text-neutral-400">Revenue</p>
                <p className="text-lg font-bold text-neutral-100">
                  {fmtCurrencyUSD(data.financialMetrics.revenue)}
                </p>
              </div>
              <div className="p-3 bg-neutral-950 rounded-lg border border-neutral-800">
                <p className="text-xs text-neutral-400">Net Income</p>
                <p className="text-lg font-bold text-neutral-100">
                  {fmtCurrencyUSD(data.financialMetrics.netIncome)}
                </p>
              </div>
              {data.financialMetrics.margins && (
                <>
                  <div className="p-3 bg-neutral-950 rounded-lg border border-neutral-800">
                    <p className="text-xs text-neutral-400">Gross Margin</p>
                    <p className="text-lg font-bold text-neutral-100">
                      {fmtPercent(data.financialMetrics.margins.gross)}
                    </p>
                  </div>
                  <div className="p-3 bg-neutral-950 rounded-lg border border-neutral-800">
                    <p className="text-xs text-neutral-400">Net Margin</p>
                    <p className="text-lg font-bold text-neutral-100">
                      {fmtPercent(data.financialMetrics.margins.net)}
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {data?.ratios && (
          <div>
            <h4 className="text-sm font-semibold mb-3 text-neutral-100">Key Ratios</h4>
            <div className="grid grid-cols-2 gap-2">
              {data.ratios.profitability && (
                <>
                  <div className="p-2 bg-neutral-950 border border-neutral-800 rounded text-sm">
                    <span className="text-neutral-400">ROE:</span>{" "}
                    <span className="font-medium text-neutral-100">
                      {fmtPercent(data.ratios.profitability.roe)}
                    </span>
                  </div>
                  <div className="p-2 bg-neutral-950 border border-neutral-800 rounded text-sm">
                    <span className="text-neutral-400">ROA:</span>{" "}
                    <span className="font-medium text-neutral-100">
                      {fmtPercent(data.ratios.profitability.roa)}
                    </span>
                  </div>
                </>
              )}
              {data.ratios.leverage && (
                <div className="p-2 bg-neutral-950 border border-neutral-800 rounded text-sm">
                  <span className="text-neutral-400">D/E:</span>{" "}
                  <span className="font-medium text-neutral-100">
                    {fmtNumber(data.ratios.leverage.debtToEquity)}
                  </span>
                </div>
              )}
              {data.ratios.liquidity && (
                <div className="p-2 bg-neutral-950 border border-neutral-800 rounded text-sm">
                  <span className="text-neutral-400">Current Ratio:</span>{" "}
                  <span className="font-medium text-neutral-100">
                    {fmtNumber(data.ratios.liquidity.currentRatio)}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {(() => {
          const eqBullets = normalizeEarningsQuality(data?.earningsQuality);
          return eqBullets.length > 0 ? (
            <div>
              <h4 className="text-sm font-semibold mb-2 text-neutral-100">Earnings Quality</h4>
              <ul className="list-disc list-inside space-y-1">
                {eqBullets.map((item, idx) => (
                  <li key={idx} className="text-sm text-neutral-400 line-clamp-2">{typeof item === 'string' ? item : String(item)}</li>
                ))}
              </ul>
            </div>
          ) : null;
        })()}
      </div>
      
      <div className="absolute top-4 right-4">
        <PromptEditor promptId="financial-analyst" promptName="Financial Analyst" />
      </div>
    </WidgetShell>
  );
}
