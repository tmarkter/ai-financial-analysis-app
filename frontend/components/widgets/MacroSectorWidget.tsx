import WidgetShell from "@/components/common/WidgetShell";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { PromptEditor } from "../PromptEditor";
import { fmtNumber } from "@/utils/format";
import type { MacroSectorData } from "~backend/widgets/macro-sector";

interface Props {
  status: "loading" | "complete" | "error";
  data?: MacroSectorData;
  error?: string;
}

export function MacroSectorWidget({ status, data, error }: Props) {
  const isEmpty = !data?.indicators?.length;

  return (
    <WidgetShell 
      title="Macro and Micro Analysis" 
      isLoading={status === "loading"}
      error={error}
      isEmpty={isEmpty}
      minHeight={320}
      footer={data?.sources ? (
        <div>
          <p>Sources: {data.sources.map((s) => s.name).join(", ")}</p>
          <p>Updated: {data.lastUpdated ? new Date(data.lastUpdated).toLocaleString() : '—'}</p>
        </div>
      ) : undefined}
    >
      <div className="space-y-6">
        {data?.indicators.map((indicator, idx) => (
          <div key={idx} className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-neutral-100 line-clamp-1">
                {indicator.name}
              </h4>
              <span className="text-sm font-medium text-neutral-100 shrink-0">
                {fmtNumber(indicator.value, 2, "—")} {indicator.unit || ""}
              </span>
            </div>

            {indicator.chartData && indicator.chartData.length > 0 && (
              <div className="h-32">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={indicator.chartData}>
                    <XAxis dataKey="date" hide />
                    <YAxis domain={["auto", "auto"]} hide />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "rgb(10 10 10)",
                        border: "1px solid rgb(38 38 38)",
                        borderRadius: "6px",
                      }}
                    />
                    <Line type="monotone" dataKey="value" stroke="rgb(34 197 94)" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {indicator.explanation && (
              <p className="text-xs text-neutral-400 line-clamp-3">
                {indicator.explanation}
              </p>
            )}
          </div>
        ))}
      </div>
      
      <div className="absolute top-4 right-4">
        <PromptEditor promptId="macro-sector" promptName="Macro and Micro Analysis" />
      </div>
    </WidgetShell>
  );
}
