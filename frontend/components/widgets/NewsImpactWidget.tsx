import WidgetShell from "@/components/common/WidgetShell";
import { ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PromptEditor } from "../PromptEditor";
import { tryParseJson } from "@/utils/safeJson";
import type { NewsImpactData } from "~backend/widgets/news-impact";

interface Props {
  status: "loading" | "complete" | "error";
  data?: NewsImpactData | string;
  error?: string;
}

export function NewsImpactWidget({ status, data, error }: Props) {
  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case "pos":
        return "bg-green-500/10 text-green-500 border-green-500/20";
      case "neg":
        return "bg-red-500/10 text-red-500 border-red-500/20";
      default:
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
    }
  };

  const parsed = typeof data === "string" 
    ? tryParseJson<NewsImpactData>(data) 
    : { ok: true as const, data: data as NewsImpactData };

  const actualError = error || (!parsed.ok ? `News analysis failed: ${parsed.reason}` : null);
  const newsData = parsed.ok ? parsed.data : null;
  const isEmpty = !newsData?.news?.length;

  return (
    <WidgetShell 
      title="News & Impact" 
      isLoading={status === "loading"}
      error={actualError}
      isEmpty={isEmpty}
      minHeight={280}
      footer={newsData?.sources ? (
        <div>
          <p>Sources: {newsData.sources.map((s) => s.name).join(", ")}</p>
          <p>Updated: {newsData.lastUpdated ? new Date(newsData.lastUpdated).toLocaleString() : '—'}</p>
        </div>
      ) : undefined}
    >
      <div className="space-y-3">
        {newsData?.news.map((article, idx) => (
          <div key={idx} className="p-3 bg-neutral-950 rounded-lg border border-neutral-800 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <h4 className="text-sm font-medium flex-1 text-neutral-100 line-clamp-2">
                {article.title}
              </h4>
              <Badge variant="outline" className={getSentimentColor(article.sentiment)}>
                {article.sentiment}
              </Badge>
            </div>
            <p className="text-xs text-neutral-400 line-clamp-3">
              {article.impactHypothesis}
            </p>
            <div className="flex items-center justify-between text-xs text-neutral-500">
              <span className="line-clamp-1">{article.source}</span>
              {article.url && (
                <a
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 hover:text-primary shrink-0"
                >
                  Read <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
      
      <div className="absolute top-4 right-4">
        <PromptEditor promptId="news-impact" promptName="News Impact" />
      </div>
    </WidgetShell>
  );
}
