import WidgetShell from "@/components/common/WidgetShell";
import { TrendingUp, TrendingDown } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { PromptEditor } from "../PromptEditor";
import { fmtNumber, fmtPercent } from "@/utils/format";
import type { CompanySnapshotData } from "~backend/widgets/company-snapshot";

interface Props {
  status: "loading" | "complete" | "error";
  data?: CompanySnapshotData;
  error?: string;
}

export function CompanySnapshotWidget({ status, data, error }: Props) {
  const isEmpty = status === "complete" && (!data?.priceData && !data?.kpis?.length && !data?.chartData?.length);
  
  return (
    <WidgetShell 
      title="Company Snapshot" 
      isLoading={status === "loading"}
      error={status === "error" ? error : null}
      isEmpty={isEmpty}
      minHeight={320}
      footer={data?.sources ? (
        <div>
          <p>Sources: {data.sources.map((s) => s.name).join(", ")}</p>
          <p>Updated: {data.lastUpdated ? new Date(data.lastUpdated).toLocaleString() : '—'}</p>
        </div>
      ) : undefined}
    >
      <div className="space-y-4">
        {data?.priceData && (
          <div className="flex items-center gap-4 p-4 bg-neutral-950 rounded-lg border border-neutral-800">
            <div className="flex-1">
              <p className="text-2xl font-bold text-neutral-100">
                ${fmtNumber(data.priceData.price, 2, "—")}
              </p>
              <div className="flex items-center gap-2 mt-1">
                {(data.priceData.change ?? 0) >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-500" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500" />
                )}
                <span className={(data.priceData.change ?? 0) >= 0 ? "text-green-500" : "text-red-500"}>
                  {fmtNumber(data.priceData.change, 2, "—")} ({fmtPercent(data.priceData.changePercent, 2, "—")})
                </span>
              </div>
            </div>
          </div>
        )}

        {data?.chartData && data.chartData.length > 0 && (
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.chartData}>
                <XAxis dataKey="date" hide />
                <YAxis domain={["auto", "auto"]} hide />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgb(10 10 10)",
                    border: "1px solid rgb(38 38 38)",
                    borderRadius: "6px",
                  }}
                />
                <Line type="monotone" dataKey="close" stroke="rgb(34 197 94)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {data?.kpis && data.kpis.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold mb-2 text-neutral-100">Key Metrics</h4>
            <div className="grid grid-cols-2 gap-2">
              {data.kpis.map((kpi, idx) => (
                <div key={idx} className="p-3 bg-neutral-950 rounded-lg border border-neutral-800">
                  <p className="text-xs text-neutral-400 line-clamp-1">{kpi.name}</p>
                  <p className="text-sm font-medium text-neutral-100 line-clamp-1">
                    {kpi.value} {kpi.unit || ""}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {data?.peers && data.peers.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold mb-2 text-neutral-100">Peers</h4>
            <div className="flex flex-wrap gap-2">
              {data.peers.map((peer, idx) => (
                <span key={idx} className="px-2 py-1 bg-neutral-950 border border-neutral-800 rounded text-xs text-neutral-300 line-clamp-1">
                  {peer}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
      
      <div className="absolute top-4 right-4">
        <PromptEditor promptId="company-snapshot" promptName="Company Snapshot" />
      </div>
    </WidgetShell>
  );
}
