import WidgetShell from "@/components/common/WidgetShell";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { PromptEditor } from "../PromptEditor";
import { Badge } from "@/components/ui/badge";
import type { MarketSentimentData } from "~backend/widgets/market-sentiment";
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from 'recharts';

interface Props {
  status: "loading" | "complete" | "error";
  data?: MarketSentimentData;
  error?: string;
}

export function MarketSentimentWidget({ status, data, error }: Props) {
  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case "bullish":
        return <TrendingUp className="h-5 w-5 text-green-500" />;
      case "bearish":
        return <TrendingDown className="h-5 w-5 text-red-500" />;
      default:
        return <Minus className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case "bullish":
      case "positive":
        return "bg-green-500/10 text-green-500 border-green-500/20";
      case "bearish":
      case "negative":
        return "bg-red-500/10 text-red-500 border-red-500/20";
      default:
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
    }
  };

  const getRadarData = () => {
    if (!data?.indicators) return [];
    return data.indicators.map(ind => ({
      metric: ind.metric,
      value: ind.value,
    }));
  };

  const isEmpty = !data?.overallSentiment;

  return (
    <WidgetShell 
      title="Market Sentiment" 
      isLoading={status === "loading"}
      error={error}
      isEmpty={isEmpty}
      minHeight={400}
      footer={data?.sources ? (
        <div>
          <p>Sources: {data.sources.map((s) => s.name).join(", ")}</p>
          <p>Updated: {data.lastUpdated ? new Date(data.lastUpdated).toLocaleString() : '—'}</p>
        </div>
      ) : undefined}
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className={`p-4 rounded-lg border ${getSentimentColor(data?.overallSentiment || "")}`}>
            <div className="flex items-center gap-2 mb-2">
              {getSentimentIcon(data?.overallSentiment || "")}
              <p className="text-xs font-semibold uppercase">Overall Sentiment</p>
            </div>
            <p className="text-2xl font-bold line-clamp-1">{data?.overallSentiment}</p>
          </div>
          
          <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-lg">
            <p className="text-xs text-neutral-400">Confidence</p>
            <p className="text-2xl font-bold text-neutral-100">{data?.confidence}%</p>
            <div className="w-full bg-neutral-800 rounded-full h-2 mt-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all"
                style={{ width: `${data?.confidence || 0}%` }}
              />
            </div>
          </div>

          <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-lg">
            <p className="text-xs text-neutral-400">Social Buzz</p>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <Badge variant="outline" className={getSentimentColor(data?.socialMediaBuzz?.sentiment || "")}>
                {data?.socialMediaBuzz?.sentiment}
              </Badge>
              <Badge variant="outline">
                {data?.socialMediaBuzz?.volume} volume
              </Badge>
            </div>
          </div>
        </div>

        {data?.summary && (
          <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-lg">
            <p className="text-sm text-neutral-100 line-clamp-4">{data.summary}</p>
          </div>
        )}

        {data?.indicators && data.indicators.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-semibold mb-3 text-neutral-100">Sentiment Radar</h4>
              <ResponsiveContainer width="100%" height={250}>
                <RadarChart data={getRadarData()}>
                  <PolarGrid stroke="rgb(38 38 38)" />
                  <PolarAngleAxis dataKey="metric" stroke="rgb(163 163 163)" />
                  <PolarRadiusAxis stroke="rgb(115 115 115)" />
                  <Radar
                    name="Sentiment"
                    dataKey="value"
                    stroke="rgb(34 197 94)"
                    fill="rgb(34 197 94)"
                    fillOpacity={0.3}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            <div>
              <h4 className="text-sm font-semibold mb-3 text-neutral-100">Indicators</h4>
              <div className="space-y-3">
                {data.indicators.map((indicator, idx) => (
                  <div key={idx} className="p-3 bg-neutral-950 border border-neutral-800 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-semibold text-neutral-100 line-clamp-1">{indicator.metric}</p>
                      <div className="flex items-center gap-2 shrink-0">
                        {getSentimentIcon(indicator.trend)}
                        <span className="text-sm font-bold text-neutral-100">{indicator.value}</span>
                      </div>
                    </div>
                    <p className="text-xs text-neutral-400 line-clamp-2">{indicator.explanation}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
      
      <div className="absolute top-4 right-4">
        <PromptEditor promptId="market-sentiment" promptName="Market Sentiment" />
      </div>
    </WidgetShell>
  );
}
